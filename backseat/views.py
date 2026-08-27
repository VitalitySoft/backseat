import io, json, os, uuid
from urllib.parse import quote
import qrcode
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Q, Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import AuditLog, Block, Campaign, Charity, Donation, Message, Notification, Report, RideJoin, RideOffer, RiderProfile, UserProfile

PAGES = {"about": ("About Backseat", "Backseat helps people share empty seats for free while giving passengers an optional way to support registered charities."), "how-it-works": ("How it works", "Riders publish spare-seat trips, passengers request a ride, and any donation after the trip is voluntary."), "safety": ("Safety", "Verified profiles, reporting, blocking, clear ride status, and community checks keep trust at the center."), "community-guidelines": ("Community guidelines", "Be respectful, do not set fares, keep routes accurate, and report unsafe behavior quickly."), "terms": ("Terms", "Backseat is a free seat-sharing coordination tool. Donation and legal copy should be reviewed before launch."), "privacy": ("Privacy", "Only collect the profile, ride, messaging, verification, and donation data needed to run the service."), "disclaimers": ("Disclaimers", "The donation confirmation flow is simulated and must be replaced before processing real payments."), "become-a-rider": ("Become a rider", "Create a rider profile, verify your vehicle details, and start sharing spare seats for free.")}

def profile_for(user):
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": "ADMIN" if user.is_superuser else "USER"}); return profile

def rider_for(profile):
    try: return profile.rider_profile
    except RiderProfile.DoesNotExist: return None

def audit(request, action, target_type="", target_id=""):
    actor = profile_for(request.user) if request.user.is_authenticated else None
    AuditLog.objects.create(actor=actor, action=action, target_type=target_type, target_id=str(target_id))

def body_json(request):
    if request.content_type == "application/json":
        try: return json.loads(request.body.decode() or "{}")
        except json.JSONDecodeError: return {}
    return request.POST

def json_error(message, status=400):
    return JsonResponse({"error": message}, status=status)

def clean_datetime(value):
    if not value: return None
    return parse_datetime(value) or None

def login_json_required(request):
    if not request.user.is_authenticated:
        return None, json_error("Authentication required", 401)
    profile = profile_for(request.user)
    if profile.is_blocked:
        return None, json_error("Your account is blocked", 403)
    return profile, None

def user_payload(profile):
    rider = rider_for(profile)
    return {
        "id": profile.id,
        "name": profile.user.get_full_name(),
        "email": profile.user.email,
        "phone": profile.phone,
        "role": profile.role,
        "isBlocked": profile.is_blocked,
        "riderProfile": rider_payload(rider) if rider else None,
    }

def rider_payload(rider):
    return {
        "id": rider.id,
        "vehicleType": rider.vehicle_type,
        "vehicleMake": rider.vehicle_make,
        "vehicleModel": rider.vehicle_model,
        "vehiclePlate": rider.vehicle_plate,
        "seatsAvailable": rider.seats_available,
        "isVehicleVerified": rider.is_vehicle_verified,
        "isSharingActive": rider.is_sharing_active,
        "charityCode": rider.charity_code,
        "bio": rider.bio,
    }

def ride_payload(ride):
    return {
        "id": ride.id,
        "startLocation": ride.start_location,
        "destination": ride.destination,
        "seatsAvailable": ride.seats_available,
        "vehicleType": ride.vehicle_type,
        "departureAt": ride.departure_at,
        "notes": ride.notes,
        "status": ride.status,
        "createdAt": ride.created_at,
        "rider": rider_payload(ride.rider) | {"name": ride.rider.user_profile.user.get_full_name()},
    }

def admin_required(view):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or profile_for(request.user).role != "ADMIN": messages.error(request, "Admin access required."); return redirect("login")
        return view(request, *args, **kwargs)
    return wrapper

def home(request):
    total = Donation.objects.filter(status="SUCCESS").aggregate(total=Sum("amount"))["total"] or 0
    return render(request, "backseat/home.html", {"total_donations": total, "active_rides": RideOffer.objects.filter(status="ACTIVE").count(), "riders": RiderProfile.objects.filter(is_sharing_active=True).count()})

def static_page(request, slug): title, body = PAGES[slug]; return render(request, "backseat/page.html", {"title": title, "body": body})

def register_view(request):
    if request.method == "POST":
        email = request.POST["email"].lower()
        if User.objects.filter(username=email).exists(): messages.error(request, "An account already exists for that email."); return redirect("register")
        parts = request.POST["name"].split(" ", 1); user = User.objects.create_user(username=email, email=email, password=request.POST["password"], first_name=parts[0], last_name=parts[1] if len(parts) > 1 else "")
        UserProfile.objects.create(user=user, phone=request.POST.get("phone") or None); login(request, user); return redirect("dashboard")
    return render(request, "backseat/auth.html", {"mode": "register"})

def login_view(request):
    if request.method == "POST":
        user = authenticate(request, username=request.POST["email"].lower(), password=request.POST["password"])
        if not user: messages.error(request, "Invalid email or password."); return redirect("login")
        login(request, user); return redirect("dashboard")
    return render(request, "backseat/auth.html", {"mode": "login"})

def logout_view(request): logout(request); return redirect("home")

def find_a_ride(request):
    q = request.GET.get("q", ""); rides = RideOffer.objects.select_related("rider__user_profile__user").filter(status="ACTIVE")
    if q: rides = rides.filter(Q(start_location__icontains=q) | Q(destination__icontains=q))
    return render(request, "backseat/rides.html", {"rides": rides, "q": q})

@login_required
def ride_detail(request, ride_id):
    ride = get_object_or_404(RideOffer.objects.select_related("rider__user_profile__user"), id=ride_id)
    if request.method == "POST":
        join, created = RideJoin.objects.get_or_create(ride_offer=ride, passenger=profile_for(request.user), defaults={"status": "REQUESTED"})
        messages.success(request, "Ride request sent." if created else "You already requested this ride.")
        return redirect("my_trips")
    return render(request, "backseat/ride_detail.html", {"ride": ride})

@login_required
def offer_a_ride(request):
    user_profile = profile_for(request.user)
    if request.method == "POST":
        rider, _ = RiderProfile.objects.get_or_create(user_profile=user_profile, defaults={"charity_code": f"{request.user.first_name.upper() or 'RIDER'}{uuid.uuid4().hex[:6]}", "vehicle_type": request.POST["vehicle_type"], "vehicle_make": request.POST["vehicle_make"], "vehicle_model": request.POST["vehicle_model"], "vehicle_plate": request.POST["vehicle_plate"]})
        rider.vehicle_type=request.POST["vehicle_type"]; rider.vehicle_make=request.POST["vehicle_make"]; rider.vehicle_model=request.POST["vehicle_model"]; rider.vehicle_plate=request.POST["vehicle_plate"]; rider.seats_available=int(request.POST["seats_available"]); rider.is_sharing_active=True; rider.save()
        departure_at = clean_datetime(request.POST.get("departure_at"))
        RideOffer.objects.create(rider=rider, vehicle_type=rider.vehicle_type, seats_available=rider.seats_available, start_location=request.POST["start_location"], destination=request.POST["destination"], departure_at=departure_at, notes=request.POST.get("notes", ""))
        audit(request, "Published ride offer", "RideOffer", rider.id)
        messages.success(request, "Ride offer published."); return redirect("my_rides")
    return render(request, "backseat/offer_ride.html")

def rider_profile(request, rider_id): return render(request, "backseat/rider.html", {"rider": get_object_or_404(RiderProfile.objects.select_related("user_profile__user"), id=rider_id)})

def donate(request, code):
    rider = get_object_or_404(RiderProfile.objects.select_related("user_profile__user"), charity_code=code); charity = Charity.objects.filter(is_active=True).first()
    if not charity: return render(request, "backseat/page.html", {"title": "Donations unavailable", "body": "No active charity partner is configured yet."}, status=404)
    if request.method == "POST":
        donation = Donation.objects.create(donation_ref=f"DON-{uuid.uuid4().hex[:8].upper()}", amount=float(request.POST["amount"]), rider=rider, passenger=profile_for(request.user) if request.user.is_authenticated else None, charity=charity, status="SUCCESS", transaction_ref=f"UPI-{uuid.uuid4().hex[:8].upper()}", donor_display_name_snapshot=request.POST.get("display_name") or "Anonymous", completed_at=timezone.now())
        return redirect("receipt", donation_id=donation.id)
    upi = f"upi://pay?pa={quote(os.getenv('CHARITY_UPI_VPA', charity.beneficiary_upi_vpa))}&pn={quote(os.getenv('CHARITY_UPI_PAYEE_NAME', charity.beneficiary_name))}&cu=INR"; return render(request, "backseat/donate.html", {"rider": rider, "charity": charity, "upi": upi})

def receipt(request, donation_id): return render(request, "backseat/receipt.html", {"donation": get_object_or_404(Donation, id=donation_id)})
def qr_png(request, code): img = qrcode.make(request.build_absolute_uri(f"/donate/{code}")); buffer = io.BytesIO(); img.save(buffer, "PNG"); return HttpResponse(buffer.getvalue(), content_type="image/png")
def impact(request): donations = Donation.objects.filter(status="SUCCESS").order_by("-amount"); return render(request, "backseat/impact.html", {"donations": donations, "total": sum(d.amount for d in donations)})
@login_required
def dashboard(request): return render(request, "backseat/dashboard.html", {"profile": profile_for(request.user)})
@login_required
def dashboard_section(request, section):
    user_profile = profile_for(request.user); rider = rider_for(user_profile)
    context = {"section": section, "profile": user_profile, "rider": rider}
    if section == "My rides" and rider:
        context["rides"] = RideOffer.objects.filter(rider=rider).prefetch_related("joins__passenger__user").order_by("-created_at")
    elif section == "My trips":
        context["joins"] = RideJoin.objects.select_related("ride_offer__rider__user_profile__user").filter(passenger=user_profile).order_by("-created_at")
    elif section in {"Donations", "Payments", "Impact"}:
        mine = Donation.objects.select_related("rider__user_profile__user", "charity").filter(Q(passenger=user_profile) | Q(rider=rider) if rider else Q(passenger=user_profile)).order_by("-created_at")
        context["donations"] = mine; context["total"] = mine.filter(status="SUCCESS").aggregate(total=Sum("amount"))["total"] or 0
    return render(request, "backseat/dashboard_section.html", context)
@login_required
def profile(request):
    user_profile = profile_for(request.user)
    if request.method == "POST":
        name = request.POST["name"]; parts = name.split(" ", 1); request.user.first_name = parts[0]; request.user.last_name = parts[1] if len(parts) > 1 else ""; request.user.save(); user_profile.phone = request.POST.get("phone") or None; user_profile.save(); messages.success(request, "Profile updated.")
    return render(request, "backseat/profile.html", {"profile": user_profile})
@login_required
def dashboard_qr(request): return render(request, "backseat/qr.html", {"rider": rider_for(profile_for(request.user))})

@login_required
@require_POST
def update_join(request, join_id):
    join = get_object_or_404(RideJoin.objects.select_related("ride_offer__rider__user_profile", "passenger"), id=join_id)
    user_profile = profile_for(request.user); action = request.POST.get("action")
    is_rider = join.ride_offer.rider.user_profile_id == user_profile.id; is_passenger = join.passenger_id == user_profile.id
    if not (is_rider or is_passenger): messages.error(request, "You cannot update this ride request."); return redirect("dashboard")
    allowed = {"accept": "ACCEPTED", "decline": "DECLINED", "complete": "COMPLETED", "cancel": "CANCELLED"}
    if action in allowed and (is_rider or action == "cancel"):
        join.status = allowed[action]; join.save(update_fields=["status"])
        Notification.objects.create(user_profile=join.passenger if is_rider else join.ride_offer.rider.user_profile, type="RIDE", title="Ride request updated", body=f"{join.ride_offer.start_location} to {join.ride_offer.destination}: {join.status}", link=f"/rides/{join.ride_offer_id}")
        audit(request, f"Ride join {join.status.lower()}", "RideJoin", join.id)
        messages.success(request, "Ride request updated.")
    return redirect("my_rides" if is_rider else "my_trips")

@login_required
@require_POST
def update_ride(request, ride_id):
    ride = get_object_or_404(RideOffer.objects.select_related("rider__user_profile"), id=ride_id)
    if ride.rider.user_profile_id != profile_for(request.user).id: messages.error(request, "You cannot update this ride."); return redirect("my_rides")
    if request.POST.get("status") in {"ACTIVE", "COMPLETED", "CANCELLED"}:
        ride.status = request.POST["status"]; ride.save(update_fields=["status"])
        audit(request, f"Ride marked {ride.status.lower()}", "RideOffer", ride.id)
        messages.success(request, "Ride status updated.")
    return redirect("my_rides")

@login_required
@require_POST
def toggle_sharing(request):
    rider = rider_for(profile_for(request.user))
    if not rider: messages.error(request, "Create your rider profile first."); return redirect("offer_a_ride")
    rider.is_sharing_active = not rider.is_sharing_active; rider.save(update_fields=["is_sharing_active"])
    messages.success(request, "Sharing status updated.")
    return redirect("dashboard_qr")

@login_required
@require_POST
def report_user(request, user_id):
    reporter = profile_for(request.user); reported = get_object_or_404(UserProfile, id=user_id)
    Report.objects.create(reporter=reporter, reported=reported, reason=request.POST.get("reason", "Safety concern"), details=request.POST.get("details", ""))
    messages.success(request, "Report submitted for admin review.")
    return redirect(request.POST.get("next") or "dashboard")

@login_required
@require_POST
def block_user(request, user_id):
    Block.objects.get_or_create(blocker=profile_for(request.user), blocked=get_object_or_404(UserProfile, id=user_id))
    messages.success(request, "User blocked.")
    return redirect(request.POST.get("next") or "dashboard")

@admin_required
def admin_console(request):
    return render(request, "backseat/admin.html", {"stats": {"users": UserProfile.objects.count(), "riders": RiderProfile.objects.count(), "rides": RideOffer.objects.count(), "donations": Donation.objects.count(), "reports": Report.objects.count(), "audits": AuditLog.objects.order_by("-created_at")[:20]}, "users": UserProfile.objects.select_related("user").order_by("-created_at"), "riders": RiderProfile.objects.select_related("user_profile__user").order_by("-member_since"), "rides": RideOffer.objects.select_related("rider__user_profile__user").order_by("-created_at"), "donations": Donation.objects.select_related("rider__user_profile__user", "charity").order_by("-created_at"), "reports": Report.objects.select_related("reporter__user", "reported__user").order_by("-created_at"), "charities": Charity.objects.all(), "campaigns": Campaign.objects.select_related("charity")})

@admin_required
@require_POST
def admin_action(request, kind, item_id):
    if kind == "user":
        item = get_object_or_404(UserProfile, id=item_id); item.is_blocked = not item.is_blocked; item.save(update_fields=["is_blocked"])
    elif kind == "rider":
        item = get_object_or_404(RiderProfile, id=item_id); item.is_vehicle_verified = not item.is_vehicle_verified; item.save(update_fields=["is_vehicle_verified"])
    elif kind == "ride":
        item = get_object_or_404(RideOffer, id=item_id); item.status = request.POST.get("status", item.status); item.save(update_fields=["status"])
    elif kind == "donation":
        item = get_object_or_404(Donation, id=item_id); item.status = request.POST.get("status", item.status); item.save(update_fields=["status"])
    elif kind == "report":
        item = get_object_or_404(Report, id=item_id); item.status = request.POST.get("status", item.status); item.save(update_fields=["status"])
    elif kind == "charity":
        item = get_object_or_404(Charity, id=item_id)
        for field in ["name", "registration_number", "description", "beneficiary_upi_vpa", "beneficiary_name"]:
            if request.POST.get(field) is not None: setattr(item, field, request.POST.get(field))
        if request.POST.get("is_active") is not None: item.is_active = str(request.POST.get("is_active")).lower() in {"1", "true", "on", "yes"}
        item.save()
    elif kind == "campaign":
        item = get_object_or_404(Campaign, id=item_id)
        for field in ["name", "description", "amount_distributed", "beneficiaries_supported"]:
            if request.POST.get(field) is not None: setattr(item, field, request.POST.get(field))
        if request.POST.get("goal_amount") is not None: item.goal_amount = request.POST.get("goal_amount") or None
        if request.POST.get("is_active") is not None: item.is_active = str(request.POST.get("is_active")).lower() in {"1", "true", "on", "yes"}
        item.save()
    else:
        messages.error(request, "Unknown admin action."); return redirect("admin_console")
    audit(request, f"Admin updated {kind}", kind, item_id); messages.success(request, "Admin update saved.")
    return redirect("admin_console")

def api_me(request):
    if not request.user.is_authenticated: return JsonResponse({"user": None})
    return JsonResponse({"user": user_payload(profile_for(request.user))})

def api_rides(request):
    if request.method == "POST":
        profile, error = login_json_required(request)
        if error: return error
        rider = rider_for(profile)
        if not rider: return json_error("Create a rider profile first", 403)
        if not rider.is_vehicle_verified: return json_error("Your vehicle must be verified before you can offer a ride.", 403)
        data = body_json(request)
        seats = int(data.get("seatsAvailable") or data.get("seats_available") or 1)
        if seats > rider.seats_available: return json_error(f"Your vehicle has at most {rider.seats_available} spare seat(s).")
        offer = RideOffer.objects.create(rider=rider, vehicle_type=rider.vehicle_type, seats_available=seats, start_location=data.get("startLocation") or data.get("start_location"), destination=data.get("destination"), departure_at=clean_datetime(data.get("departureAt") or data.get("departure_at")), notes=data.get("notes", ""))
        if not rider.is_sharing_active:
            rider.is_sharing_active = True; rider.save(update_fields=["is_sharing_active"])
        audit(request, "API created ride", "RideOffer", offer.id)
        return JsonResponse({"id": offer.id})
    from_q = request.GET.get("from", "").strip() or request.GET.get("q", "").strip()
    to_q = request.GET.get("to", "").strip()
    vehicle_type = request.GET.get("vehicleType", "").strip()
    rides = RideOffer.objects.select_related("rider__user_profile__user").filter(status="ACTIVE", rider__is_sharing_active=True, rider__is_vehicle_verified=True)
    if from_q: rides = rides.filter(Q(start_location__icontains=from_q) | Q(destination__icontains=from_q))
    if to_q: rides = rides.filter(destination__icontains=to_q)
    if vehicle_type: rides = rides.filter(vehicle_type=vehicle_type)
    return JsonResponse({"offers": [ride_payload(r) for r in rides.order_by("-created_at")[:50]], "rides": [ride_payload(r) for r in rides.order_by("-created_at")[:50]]})

@csrf_exempt
def api_register(request):
    if request.method != "POST": return json_error("Method not allowed", 405)
    data = body_json(request); email = (data.get("email") or "").lower().strip()
    if User.objects.filter(username=email).exists(): return json_error("An account with this email or phone already exists", 409)
    name = data.get("name", "").strip(); password = data.get("password", "")
    if len(name) < 2 or len(password) < 8 or "@" not in email: return json_error("Invalid input")
    parts = name.split(" ", 1); user = User.objects.create_user(username=email, email=email, password=password, first_name=parts[0], last_name=parts[1] if len(parts) > 1 else "")
    profile = UserProfile.objects.create(user=user, phone=data.get("phone") or None); login(request, user)
    return JsonResponse(user_payload(profile))

@csrf_exempt
def api_login(request):
    if request.method != "POST": return json_error("Method not allowed", 405)
    data = body_json(request); user = authenticate(request, username=(data.get("email") or "").lower().strip(), password=data.get("password", ""))
    if not user: return json_error("Invalid email or password", 401)
    login(request, user); return JsonResponse(user_payload(profile_for(user)))

@csrf_exempt
def api_logout(request):
    logout(request); return JsonResponse({"ok": True})

@csrf_exempt
def api_profile(request):
    profile, error = login_json_required(request)
    if error: return error
    if request.method in {"POST", "PATCH"}:
        data = body_json(request); name = data.get("name")
        if name:
            parts = name.strip().split(" ", 1); request.user.first_name = parts[0]; request.user.last_name = parts[1] if len(parts) > 1 else ""; request.user.save()
        if "phone" in data: profile.phone = data.get("phone") or None
        if "leaderboardDisplay" in data: profile.leaderboard_display = data.get("leaderboardDisplay")
        profile.save()
    return JsonResponse(user_payload(profile))

@csrf_exempt
def api_rider_onboard(request):
    profile, error = login_json_required(request)
    if error: return error
    data = body_json(request)
    rider, _ = RiderProfile.objects.get_or_create(user_profile=profile, defaults={"charity_code": f"{(profile.user.first_name or 'RIDER').upper()}{uuid.uuid4().hex[:6]}", "vehicle_type": data.get("vehicleType", "FOUR_WHEELER"), "vehicle_make": data.get("vehicleMake", ""), "vehicle_model": data.get("vehicleModel", ""), "vehicle_plate": data.get("vehiclePlate", "")})
    rider.vehicle_type = data.get("vehicleType", rider.vehicle_type); rider.vehicle_make = data.get("vehicleMake", rider.vehicle_make); rider.vehicle_model = data.get("vehicleModel", rider.vehicle_model); rider.vehicle_plate = data.get("vehiclePlate", rider.vehicle_plate); rider.seats_available = int(data.get("seatsAvailable", rider.seats_available)); rider.bio = data.get("bio", rider.bio); rider.save()
    return JsonResponse({"rider": rider_payload(rider)})

@csrf_exempt
def api_rider_vehicle(request):
    return api_rider_onboard(request)

@csrf_exempt
def api_rider_sharing(request):
    profile, error = login_json_required(request)
    if error: return error
    rider = rider_for(profile)
    if not rider: return json_error("Create a rider profile first", 404)
    data = body_json(request)
    rider.is_sharing_active = bool(data.get("isSharingActive", not rider.is_sharing_active)); rider.save(update_fields=["is_sharing_active"])
    return JsonResponse({"rider": rider_payload(rider)})

@csrf_exempt
def api_rider_qr_regenerate(request):
    profile, error = login_json_required(request)
    if error: return error
    rider = rider_for(profile)
    if not rider: return json_error("Create a rider profile first", 404)
    rider.charity_code = f"{(profile.user.first_name or 'RIDER').upper()}{uuid.uuid4().hex[:8]}"; rider.save(update_fields=["charity_code"])
    return JsonResponse({"charityCode": rider.charity_code})

@csrf_exempt
def api_ride_detail(request, ride_id):
    ride = get_object_or_404(RideOffer.objects.select_related("rider__user_profile__user"), id=ride_id)
    if request.method in {"PATCH", "POST"}:
        profile, error = login_json_required(request)
        if error: return error
        if ride.rider.user_profile_id != profile.id and profile.role != "ADMIN": return json_error("Forbidden", 403)
        data = body_json(request)
        for field, key in [("start_location", "startLocation"), ("destination", "destination"), ("notes", "notes"), ("status", "status")]:
            if key in data: setattr(ride, field, data[key])
        if "seatsAvailable" in data: ride.seats_available = int(data["seatsAvailable"])
        ride.save(); return JsonResponse({"ride": ride_payload(ride)})
    return JsonResponse({"ride": ride_payload(ride)})

@csrf_exempt
def api_ride_join(request, ride_id):
    profile, error = login_json_required(request)
    if error: return error
    ride = get_object_or_404(RideOffer, id=ride_id, status="ACTIVE")
    if ride.rider.user_profile_id == profile.id: return json_error("You cannot request your own ride")
    join, created = RideJoin.objects.get_or_create(ride_offer=ride, passenger=profile, defaults={"status": "REQUESTED"})
    Notification.objects.create(user_profile=ride.rider.user_profile, type="RIDE_REQUEST", title="New ride request", body=f"{profile.user.get_full_name()} requested your ride.", link=f"/dashboard/my-rides")
    return JsonResponse({"id": join.id, "status": join.status, "created": created})

@csrf_exempt
def api_join_detail(request, ride_id, join_id):
    profile, error = login_json_required(request)
    if error: return error
    join = get_object_or_404(RideJoin.objects.select_related("ride_offer__rider__user_profile", "passenger"), id=join_id, ride_offer_id=ride_id)
    if join.passenger_id != profile.id and join.ride_offer.rider.user_profile_id != profile.id and profile.role != "ADMIN": return json_error("Forbidden", 403)
    data = body_json(request)
    if request.method in {"POST", "PATCH"} and data.get("status"):
        join.status = data["status"]; join.save(update_fields=["status"])
    return JsonResponse({"join": {"id": join.id, "status": join.status, "rideId": join.ride_offer_id, "passengerId": join.passenger_id}})

@csrf_exempt
def api_join_messages(request, ride_id, join_id):
    profile, error = login_json_required(request)
    if error: return error
    join = get_object_or_404(RideJoin.objects.select_related("ride_offer__rider__user_profile", "passenger"), id=join_id, ride_offer_id=ride_id)
    if join.passenger_id != profile.id and join.ride_offer.rider.user_profile_id != profile.id: return json_error("Forbidden", 403)
    if request.method == "POST":
        body = body_json(request).get("body", "").strip()
        if body: Message.objects.create(ride_join=join, sender=profile, body=body)
    messages_qs = Message.objects.filter(ride_join=join).select_related("sender__user").order_by("created_at")
    return JsonResponse({"messages": [{"id": m.id, "body": m.body, "senderId": m.sender_id, "senderName": m.sender.user.get_full_name(), "createdAt": m.created_at} for m in messages_qs]})

@csrf_exempt
def api_donate_initiate(request):
    data = body_json(request); rider = get_object_or_404(RiderProfile, charity_code=data.get("charityCode"))
    if not rider.is_vehicle_verified: return json_error("This rider's charity QR is not active yet - verification is pending.", 403)
    charity = Charity.objects.filter(is_active=True).first()
    if not charity: return json_error("No active charity is configured", 500)
    campaign = Campaign.objects.filter(charity=charity, is_active=True).order_by("-started_at").first()
    ref = f"DON-{uuid.uuid4().hex[:8].upper()}"; amount = float(data.get("amount", 0))
    if amount <= 0 or amount > 100000: return json_error("Enter a valid voluntary donation amount")
    donation = Donation.objects.create(donation_ref=ref, amount=amount, rider=rider, passenger=profile_for(request.user) if request.user.is_authenticated else None, charity=charity, campaign=campaign, status="PENDING", donor_display_name_snapshot=data.get("donorName") or "A kind traveller")
    upi = f"upi://pay?pa={quote(charity.beneficiary_upi_vpa)}&pn={quote(charity.beneficiary_name)}&am={amount}&cu=INR&tn={quote('Donation to ' + charity.name + ' via Backseat')}&tr={ref}"
    return JsonResponse({"donationId": donation.id, "donationRef": ref, "upiLink": upi})

@csrf_exempt
def api_donate_confirm(request):
    data = body_json(request); donation = get_object_or_404(Donation, id=data.get("donationId"))
    donation.status = data.get("status", "SUCCESS"); donation.transaction_ref = data.get("transactionRef") or f"UPI-{uuid.uuid4().hex[:8].upper()}"; donation.completed_at = timezone.now(); donation.save()
    return JsonResponse({"donationId": donation.id, "status": donation.status})

@csrf_exempt
def api_notifications(request):
    profile, error = login_json_required(request)
    if error: return error
    qs = Notification.objects.filter(user_profile=profile).order_by("-created_at")[:50]
    return JsonResponse({"notifications": [{"id": n.id, "type": n.type, "title": n.title, "body": n.body, "link": n.link, "isRead": n.is_read, "createdAt": n.created_at} for n in qs]})

@csrf_exempt
def api_notification_read(request, notification_id):
    profile, error = login_json_required(request)
    if error: return error
    n = get_object_or_404(Notification, id=notification_id, user_profile=profile); n.is_read = True; n.save(update_fields=["is_read"])
    return JsonResponse({"ok": True})

@csrf_exempt
def api_notifications_read_all(request):
    profile, error = login_json_required(request)
    if error: return error
    Notification.objects.filter(user_profile=profile, is_read=False).update(is_read=True)
    return JsonResponse({"ok": True})

@csrf_exempt
def api_reports(request):
    profile, error = login_json_required(request)
    if error: return error
    data = body_json(request); reported = get_object_or_404(UserProfile, id=data.get("reportedUserId"))
    report = Report.objects.create(reporter=profile, reported=reported, reason=data.get("reason", "Safety concern"), details=data.get("details", ""))
    return JsonResponse({"id": report.id, "status": report.status})

@csrf_exempt
def api_blocks(request):
    profile, error = login_json_required(request)
    if error: return error
    data = body_json(request); blocked = get_object_or_404(UserProfile, id=data.get("blockedUserId"))
    block, created = Block.objects.get_or_create(blocker=profile, blocked=blocked)
    return JsonResponse({"id": block.id, "created": created})

@csrf_exempt
def api_sos(request):
    profile, error = login_json_required(request)
    if error: return error
    data = body_json(request)
    AuditLog.objects.create(actor=profile, action="SOS alert", target_type="Safety", metadata_json=json.dumps(dict(data)))
    return JsonResponse({"ok": True, "message": "SOS alert recorded for admin review."})

@csrf_exempt
def api_chatbot(request):
    data = body_json(request)
    messages_in = data.get("messages") or [{"role": "user", "content": data.get("message", "")}]
    question = next((m.get("content", "") for m in reversed(messages_in) if m.get("role") == "user"), "").lower()
    topics = [
        (["find", "search", "passenger", "join", "book", "available rides"], "You can search available rides by pickup, destination, date, and seats. Open a ride, review the rider details, then send a join request. The rider can accept or decline the request from their dashboard.", [{"label": "Find a Ride", "href": "/find-a-ride"}]),
        (["offer", "driver", "rider", "publish", "vehicle", "seat", "offer a ride"], "To offer a ride, create an account, add your vehicle details, and publish your route with available seats. Backseat rides are free; riders do not set fares.", [{"label": "Offer a Ride", "href": "/offer-a-ride"}, {"label": "Become a Rider", "href": "/become-a-rider"}]),
        (["donate", "donation", "upi", "charity", "payment", "receipt"], "Donations are voluntary and chosen by the passenger after the ride. The current demo flow uses a UPI deep link and simulated confirmation, so real payment gateway credentials should be added before production use.", [{"label": "Charity Impact", "href": "/charity-impact"}]),
        (["safe", "safety", "sos", "report", "block", "trust"], "Backseat includes rider profiles, reporting, blocking, SOS access, and admin review workflows. For a safe trip, review the rider details, share your trip, and report any suspicious behavior.", [{"label": "Safety", "href": "/safety"}, {"label": "Community Guidelines", "href": "/community-guidelines"}]),
        (["qr", "code", "scan", "rider profile"], "Verified riders can use a charity QR page from their dashboard. Passengers can scan the rider QR to open the donation flow tied to that rider.", [{"label": "Dashboard QR", "href": "/dashboard/qr"}]),
        (["login", "register", "account", "password", "profile"], "Create an account from Register, then use Login to access your dashboard. From the dashboard you can manage profile details, vehicle information, rides, trips, and donations.", [{"label": "Login", "href": "/login"}, {"label": "Register", "href": "/register"}]),
        (["admin", "approve", "verify", "fraud", "dashboard", "manage"], "Admins can review users, riders, rides, donations, reports, fraud signals, charities, campaigns, audit logs, and leaderboard visibility from the admin portal.", [{"label": "Admin Portal", "href": "/admin"}]),
        (["fare", "price", "charge", "cost", "free"], "Backseat rides are not fare-based. A rider offers an empty seat for free, and a passenger may optionally donate any amount to charity after the ride.", [{"label": "How It Works", "href": "/how-it-works"}]),
    ]
    best = max(topics, key=lambda t: sum(1 for keyword in t[0] if keyword in question), default=None)
    if not question.strip() or not best or sum(1 for keyword in best[0] if keyword in question) == 0:
        return JsonResponse({"answer": 'I can help with finding rides, offering rides, rider QR codes, donations, safety, accounts, and admin workflows. Try asking something like "How do I offer a ride?" or "How do donations work?"', "links": []})
    return JsonResponse({"answer": best[1], "links": best[2]})

@csrf_exempt
@admin_required
def api_admin_update(request, kind, item_id):
    data = body_json(request)
    if kind == "user":
        item = get_object_or_404(UserProfile, id=item_id); item.is_blocked = bool(data.get("isBlocked", not item.is_blocked)); item.save(update_fields=["is_blocked"])
    elif kind == "rider":
        item = get_object_or_404(RiderProfile, id=item_id); item.is_vehicle_verified = bool(data.get("isVehicleVerified", not item.is_vehicle_verified)); item.hidden_from_leaderboard = bool(data.get("hiddenFromLeaderboard", item.hidden_from_leaderboard)); item.save()
    elif kind == "ride":
        item = get_object_or_404(RideOffer, id=item_id); item.status = data.get("status", item.status); item.save(update_fields=["status"])
    elif kind == "donation":
        item = get_object_or_404(Donation, id=item_id); item.status = data.get("status", item.status); item.save(update_fields=["status"])
    elif kind == "report":
        item = get_object_or_404(Report, id=item_id); item.status = data.get("status", item.status); item.save(update_fields=["status"])
    elif kind == "charity":
        item = get_object_or_404(Charity, id=item_id)
        for field in ["name", "registration_number", "description", "beneficiary_upi_vpa", "beneficiary_name"]:
            if field in data: setattr(item, field, data[field])
        if "isActive" in data: item.is_active = bool(data["isActive"])
        item.save()
    elif kind == "campaign":
        item = get_object_or_404(Campaign, id=item_id)
        for field in ["name", "description", "amount_distributed", "beneficiaries_supported", "goal_amount"]:
            if field in data: setattr(item, field, data[field])
        if "isActive" in data: item.is_active = bool(data["isActive"])
        item.save()
    else:
        return json_error("Unknown admin action", 404)
    audit(request, f"Admin API updated {kind}", kind, item_id)
    return JsonResponse({"ok": True})
