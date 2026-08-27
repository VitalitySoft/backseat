import io, os, uuid
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
from django.views.decorators.http import require_POST
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
        departure_at = request.POST.get("departure_at") or None
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
    else:
        messages.error(request, "Unknown admin action."); return redirect("admin_console")
    audit(request, f"Admin updated {kind}", kind, item_id); messages.success(request, "Admin update saved.")
    return redirect("admin_console")

def api_me(request):
    if not request.user.is_authenticated: return JsonResponse({"user": None})
    p = profile_for(request.user)
    return JsonResponse({"user": {"id": p.id, "email": request.user.email, "name": request.user.get_full_name(), "role": p.role, "isBlocked": p.is_blocked}})

def api_rides(request):
    rides = RideOffer.objects.select_related("rider__user_profile__user").filter(status="ACTIVE").order_by("-created_at")
    return JsonResponse({"rides": [{"id": r.id, "startLocation": r.start_location, "destination": r.destination, "seatsAvailable": r.seats_available, "vehicleType": r.vehicle_type, "riderName": r.rider.user_profile.user.get_full_name(), "status": r.status} for r in rides]})
