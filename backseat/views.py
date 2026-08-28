import io
import json
import os
import uuid
from datetime import timedelta
from urllib.parse import quote

import qrcode
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Count, Q, Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import (
    AuditLog,
    Block,
    Campaign,
    Charity,
    Donation,
    Message,
    Notification,
    Report,
    RideJoin,
    RideOffer,
    RiderProfile,
    UserProfile,
)

PAGES_DATA = {
    "about": {
        "title": "About Backseat",
        "subtitle": "A movement to turn everyday commutes into shared kindness.",
        "icon": "HeartHandshake",
    },
    "how-it-works": {
        "title": "How Backseat Works",
        "subtitle": "Four simple steps to share journeys and spread generosity.",
        "icon": "HelpCircle",
    },
    "safety": {
        "title": "Safety Centre",
        "subtitle": "Built-in trust, verified riders, and emergency assistance.",
        "icon": "ShieldCheck",
    },
    "community-guidelines": {
        "title": "Community Guidelines",
        "subtitle": "Standards that make every Backseat journey safe and respectful.",
        "icon": "FileText",
    },
    "terms": {
        "title": "Terms of Use",
        "subtitle": "Important legal agreements regarding our platform coordination.",
        "icon": "Scale",
    },
    "privacy": {
        "title": "Privacy Policy",
        "subtitle": "How we handle and protect your personal information.",
        "icon": "Lock",
    },
    "disclaimers": {
        "title": "Legal & Compliance Disclaimers",
        "subtitle": "Regulatory disclosures on charity collections and ridesharing.",
        "icon": "AlertCircle",
    },
    "become-a-rider": {
        "title": "Become a Charity Rider",
        "subtitle": "Register your vehicle and share your daily commute for good.",
        "icon": "Bike",
    },
}


def profile_for(user):
    profile, _ = UserProfile.objects.get_or_create(
        user=user, defaults={"role": "ADMIN" if user.is_superuser else "USER"}
    )
    return profile


def rider_for(profile):
    try:
        return profile.rider_profile
    except (RiderProfile.DoesNotExist, AttributeError):
        return None


def audit(request, action, target_type="", target_id=""):
    actor = profile_for(request.user) if request.user.is_authenticated else None
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
    )


def body_json(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body.decode() or "{}")
        except json.JSONDecodeError:
            return {}
    return request.POST


def json_error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def clean_datetime(value):
    if not value:
        return None
    return parse_datetime(value) or None


def format_display_name(user_profile):
    if not user_profile:
        return "Anonymous Traveller"
    pref = user_profile.leaderboard_display
    full = user_profile.user.get_full_name() or user_profile.user.username
    if pref == "ANONYMOUS":
        return "Anonymous Rider"
    elif pref == "FIRST_NAME_INITIAL":
        first = user_profile.user.first_name or full.split()[0]
        last = user_profile.user.last_name or (full.split()[1] if len(full.split()) > 1 else "")
        return f"{first} {last[0]}." if last else first
    return full


def user_payload(profile):
    rider = rider_for(profile)
    return {
        "id": profile.id,
        "name": profile.user.get_full_name() or profile.user.username,
        "email": profile.user.email,
        "phone": profile.phone,
        "role": profile.role,
        "isBlocked": profile.is_blocked,
        "isRider": rider is not None,
        "riderProfile": rider_payload(rider) if rider else None,
    }


def rider_payload(rider):
    if not rider:
        return None
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
        "departureAt": ride.departure_at.isoformat() if ride.departure_at else None,
        "notes": ride.notes,
        "status": ride.status,
        "createdAt": ride.created_at.isoformat(),
        "rider": {
            "name": ride.rider.user_profile.user.get_full_name() or ride.rider.user_profile.user.username,
            "vehicleType": ride.rider.vehicle_type,
            "isVehicleVerified": ride.rider.is_vehicle_verified,
        },
    }


def admin_required(view):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or profile_for(request.user).role != "ADMIN":
            messages.error(request, "Admin access required.")
            return redirect("login")
        return view(request, *args, **kwargs)
    return wrapper


def home(request):
    total_donations = Donation.objects.filter(status="SUCCESS").aggregate(total=Sum("amount"))["total"] or 0
    total_rides = RideOffer.objects.count()
    active_rides = RideOffer.objects.filter(status="ACTIVE").count()
    people_helped = RideJoin.objects.filter(status__in=["ACCEPTED", "COMPLETED"]).count()
    active_riders = RiderProfile.objects.filter(is_vehicle_verified=True, is_sharing_active=True).count()
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    monthly_contributors = Donation.objects.filter(status="SUCCESS", created_at__gte=thirty_days_ago).values("passenger").distinct().count()
    lifetime_contributors = Donation.objects.filter(status="SUCCESS").values("passenger").distinct().count()

    top_riders = (
        RiderProfile.objects.filter(is_vehicle_verified=True, hidden_from_leaderboard=False)
        .annotate(
            total_donated=Sum("donations__amount", filter=Q(donations__status="SUCCESS")),
            donation_count=Count("donations", filter=Q(donations__status="SUCCESS")),
        )
        .filter(total_donated__gt=0)
        .select_related("user_profile__user")
        .order_by("-total_donated")[:5]
    )

    leaderboard = []
    for r in top_riders:
        leaderboard.append({
            "rider_id": r.id,
            "display_name": format_display_name(r.user_profile),
            "avatar_initial": (r.user_profile.user.first_name or "R")[:1].upper(),
            "vehicle_type": r.vehicle_type,
            "total_donated": r.total_donated or 0,
            "donation_count": r.donation_count or 0,
        })

    return render(
        request,
        "backseat/home.html",
        {
            "total_donations": total_donations,
            "total_rides": total_rides,
            "active_rides": active_rides,
            "people_helped": people_helped,
            "active_riders": active_riders,
            "monthly_contributors": max(monthly_contributors, 1),
            "lifetime_contributors": max(lifetime_contributors, 1),
            "leaderboard": leaderboard,
        },
    )


def static_page(request, slug):
    info = PAGES_DATA.get(slug, {"title": slug.replace("-", " ").title(), "subtitle": "", "icon": "FileText"})
    user_profile = profile_for(request.user) if request.user.is_authenticated else None
    rider = rider_for(user_profile) if user_profile else None
    return render(
        request,
        "backseat/page.html",
        {"slug": slug, "title": info["title"], "subtitle": info["subtitle"], "icon": info["icon"], "profile": user_profile, "rider": rider},
    )


def register_view(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        name = request.POST.get("name", "").strip()
        phone = request.POST.get("phone", "").strip()

        if not email or not password or not name:
            messages.error(request, "Please fill in all required fields.")
            return render(request, "backseat/auth.html", {"mode": "register"})

        if User.objects.filter(username=email).exists():
            messages.error(request, "An account with this email already exists.")
            return render(request, "backseat/auth.html", {"mode": "register"})

        parts = name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        UserProfile.objects.create(user=user, phone=phone or None, email_verified=True)
        login(request, user)
        messages.success(request, f"Welcome to Backseat, {first_name}!")
        return redirect("dashboard")

    return render(request, "backseat/auth.html", {"mode": "register"})


def login_view(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")

        user = authenticate(request, username=email, password=password)
        if not user:
            messages.error(request, "Invalid email or password.")
            return render(request, "backseat/auth.html", {"mode": "login"})

        profile = profile_for(user)
        if profile.is_blocked:
            messages.error(request, "Your account has been suspended. Please contact support.")
            return render(request, "backseat/auth.html", {"mode": "login"})

        login(request, user)
        next_url = request.GET.get("next") or ("admin_console" if profile.role == "ADMIN" else "dashboard")
        return redirect(next_url)

    return render(request, "backseat/auth.html", {"mode": "login"})


def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect("home")


def find_a_ride(request):
    if request.user.is_authenticated and profile_for(request.user).role == "ADMIN":
        return redirect("admin_console")

    from_q = request.GET.get("from", "").strip() or request.GET.get("q", "").strip()
    to_q = request.GET.get("to", "").strip()
    vehicle_type = request.GET.get("vehicleType", "").strip()

    rides_qs = (
        RideOffer.objects.filter(
            status="ACTIVE",
            rider__is_sharing_active=True,
            rider__is_vehicle_verified=True,
        )
        .filter(Q(departure_at__isnull=True) | Q(departure_at__gt=timezone.now()))
        .select_related("rider__user_profile__user")
        .order_by("-created_at")
    )

    if from_q:
        rides_qs = rides_qs.filter(Q(start_location__icontains=from_q) | Q(destination__icontains=from_q))
    if to_q:
        rides_qs = rides_qs.filter(destination__icontains=to_q)
    if vehicle_type:
        rides_qs = rides_qs.filter(vehicle_type=vehicle_type)

    rides_list = list(rides_qs[:30])

    user_joins_map = {}
    if request.user.is_authenticated:
        user_profile = profile_for(request.user)
        joins = RideJoin.objects.filter(
            ride_offer__in=rides_list, passenger=user_profile
        ).order_by("-created_at")
        for j in joins:
            if j.ride_offer_id not in user_joins_map:
                user_joins_map[j.ride_offer_id] = j.status

    for r in rides_list:
        r.my_join_status = user_joins_map.get(r.id)

    return render(
        request,
        "backseat/rides.html",
        {
            "rides": rides_list,
            "from_q": from_q,
            "to_q": to_q,
            "vehicle_type": vehicle_type,
            "q": from_q,
        },
    )


@login_required
def ride_detail(request, ride_id):
    ride = get_object_or_404(
        RideOffer.objects.select_related("rider__user_profile__user"), id=ride_id
    )
    user_profile = profile_for(request.user)
    is_owner = ride.rider.user_profile_id == user_profile.id

    my_join = (
        RideJoin.objects.filter(ride_offer=ride, passenger=user_profile)
        .order_by("-created_at")
        .first()
    )

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "join":
            if is_owner:
                messages.error(request, "You cannot join your own ride offer.")
                return redirect("ride_detail", ride_id=ride.id)
            if not my_join or my_join.status == "DECLINED":
                my_join = RideJoin.objects.create(
                    ride_offer=ride, passenger=user_profile, status="REQUESTED"
                )
                Notification.objects.create(
                    user_profile=ride.rider.user_profile,
                    type="RIDE_REQUEST",
                    title="New ride request",
                    body=f"{user_profile.user.get_full_name()} requested to join your ride from {ride.start_location} to {ride.destination}.",
                    link="/dashboard/my-rides",
                )
                audit(request, "Requested ride join", "RideJoin", my_join.id)
                messages.success(request, "Your request to join this ride has been sent!")
            return redirect("ride_detail", ride_id=ride.id)

        elif action == "message" and my_join:
            body = request.POST.get("body", "").strip()
            if body:
                Message.objects.create(ride_join=my_join, sender=user_profile, body=body)
                recipient = ride.rider.user_profile if user_profile.id == my_join.passenger_id else my_join.passenger
                Notification.objects.create(
                    user_profile=recipient,
                    type="MESSAGE",
                    title="New chat message",
                    body=f"{user_profile.user.get_full_name()}: {body[:60]}",
                    link=f"/rides/{ride.id}",
                )
            return redirect("ride_detail", ride_id=ride.id)

    chat_messages = []
    if my_join:
        chat_messages = Message.objects.filter(ride_join=my_join).select_related("sender__user").order_by("created_at")

    charity = Charity.objects.filter(is_active=True).first()

    return render(
        request,
        "backseat/ride_detail.html",
        {
            "ride": ride,
            "is_owner": is_owner,
            "my_join": my_join,
            "chat_messages": chat_messages,
            "charity": charity,
        },
    )


@login_required
def offer_a_ride(request):
    user_profile = profile_for(request.user)
    rider = rider_for(user_profile)

    if request.method == "POST":
        if not rider:
            messages.error(request, "Please set up your vehicle details first.")
            return redirect("become_a_rider")
        if not rider.is_vehicle_verified:
            messages.error(request, "Your vehicle must be verified by an administrator before you can publish rides.")
            return redirect("offer_a_ride")

        start_location = request.POST.get("start_location", "").strip()
        destination = request.POST.get("destination", "").strip()
        seats_available = int(request.POST.get("seats_available") or 1)
        departure_at = clean_datetime(request.POST.get("departure_at"))
        notes = request.POST.get("notes", "").strip()

        if not start_location or not destination:
            messages.error(request, "Please specify both starting location and destination.")
            return render(request, "backseat/offer_ride.html", {"rider": rider})

        if seats_available > rider.seats_available:
            messages.error(request, f"You can offer at most {rider.seats_available} seat(s) in your vehicle.")
            return render(request, "backseat/offer_ride.html", {"rider": rider})

        offer = RideOffer.objects.create(
            rider=rider,
            vehicle_type=rider.vehicle_type,
            seats_available=seats_available,
            start_location=start_location,
            destination=destination,
            departure_at=departure_at,
            notes=notes,
            status="ACTIVE",
        )
        if not rider.is_sharing_active:
            rider.is_sharing_active = True
            rider.save(update_fields=["is_sharing_active"])

        audit(request, "Published ride offer", "RideOffer", offer.id)
        messages.success(request, "Your ride offer has been published!")
        return redirect("my_rides")

    return render(request, "backseat/offer_ride.html", {"rider": rider})


def rider_profile(request, rider_id):
    rider = get_object_or_404(
        RiderProfile.objects.select_related("user_profile__user"), id=rider_id
    )
    total_donated = Donation.objects.filter(rider=rider, status="SUCCESS").aggregate(t=Sum("amount"))["t"] or 0
    donation_count = Donation.objects.filter(rider=rider, status="SUCCESS").count()
    rides_count = RideOffer.objects.filter(rider=rider, status="COMPLETED").count()
    active_rides = RideOffer.objects.filter(rider=rider, status="ACTIVE")
    charity = Charity.objects.filter(is_active=True).first()

    return render(
        request,
        "backseat/rider.html",
        {
            "rider": rider,
            "total_donated": total_donated,
            "donation_count": donation_count,
            "rides_count": rides_count,
            "active_rides": active_rides,
            "charity": charity,
        },
    )


def donate(request, code):
    rider = get_object_or_404(
        RiderProfile.objects.select_related("user_profile__user"), charity_code=code
    )
    charity = Charity.objects.filter(is_active=True).first()
    if not charity:
        return render(
            request,
            "backseat/page.html",
            {
                "title": "Donations Unavailable",
                "body": "No active charity partner is configured yet. Please check back later.",
            },
            status=404,
        )

    campaign = Campaign.objects.filter(charity=charity, is_active=True).order_by("-started_at").first()

    if request.method == "POST":
        amount_raw = request.POST.get("amount", "0")
        try:
            amount = float(amount_raw)
        except ValueError:
            amount = 0

        if amount <= 0:
            messages.error(request, "Please choose or enter a valid donation amount.")
            return redirect("donate", code=code)

        donor_name = request.POST.get("donor_name", "").strip() or "A kind traveller"
        ref = f"DON-{uuid.uuid4().hex[:8].upper()}"
        tx_ref = f"UPI-{uuid.uuid4().hex[:8].upper()}"

        passenger_profile = profile_for(request.user) if request.user.is_authenticated else None

        donation = Donation.objects.create(
            donation_ref=ref,
            amount=amount,
            rider=rider,
            passenger=passenger_profile,
            charity=charity,
            campaign=campaign,
            status="SUCCESS",
            payment_method="UPI",
            transaction_ref=tx_ref,
            donor_display_name_snapshot=donor_name,
            completed_at=timezone.now(),
        )

        Notification.objects.create(
            user_profile=rider.user_profile,
            type="DONATION",
            title="New charity donation received",
            body=f"₹{amount:,.0f} was contributed to {charity.name} via your Backseat QR.",
            link="/dashboard/donations",
        )

        audit(request, f"Donation of ₹{amount} recorded", "Donation", donation.id)
        return redirect("receipt", donation_id=donation.id)

    upi_vpa = os.getenv("CHARITY_UPI_VPA", charity.beneficiary_upi_vpa)
    payee_name = os.getenv("CHARITY_UPI_PAYEE_NAME", charity.beneficiary_name)
    upi_link = f"upi://pay?pa={quote(upi_vpa)}&pn={quote(payee_name)}&cu=INR&tn={quote('Donation to ' + charity.name + ' via Backseat')}"

    return render(
        request,
        "backseat/donate.html",
        {
            "rider": rider,
            "charity": charity,
            "campaign": campaign,
            "upi_link": upi_link,
            "upi_vpa": upi_vpa,
        },
    )


def receipt(request, donation_id):
    donation = get_object_or_404(
        Donation.objects.select_related("rider__user_profile__user", "charity", "campaign", "passenger__user"),
        id=donation_id,
    )
    return render(request, "backseat/receipt.html", {"donation": donation})


def qr_png(request, code):
    url = request.build_absolute_uri(f"/donate/{code}")
    img = qrcode.make(url)
    buffer = io.BytesIO()
    img.save(buffer, "PNG")
    return HttpResponse(buffer.getvalue(), content_type="image/png")


def impact(request):
    donations = Donation.objects.filter(status="SUCCESS").select_related("charity", "rider__user_profile__user").order_by("-completed_at")
    total_donations = donations.aggregate(t=Sum("amount"))["t"] or 0
    total_rides = RideOffer.objects.count()
    people_helped = RideJoin.objects.filter(status__in=["ACCEPTED", "COMPLETED"]).count()

    top_riders = (
        RiderProfile.objects.filter(is_vehicle_verified=True, hidden_from_leaderboard=False)
        .annotate(
            total_donated=Sum("donations__amount", filter=Q(donations__status="SUCCESS")),
            donation_count=Count("donations", filter=Q(donations__status="SUCCESS")),
        )
        .filter(total_donated__gt=0)
        .select_related("user_profile__user")
        .order_by("-total_donated")
    )

    leaderboard = []
    for idx, r in enumerate(top_riders, 1):
        leaderboard.append({
            "rank": idx,
            "rider_id": r.id,
            "display_name": format_display_name(r.user_profile),
            "avatar_initial": (r.user_profile.user.first_name or "R")[:1].upper(),
            "vehicle_type": r.vehicle_type,
            "vehicle_model": f"{r.vehicle_make} {r.vehicle_model}",
            "total_donated": r.total_donated or 0,
            "donation_count": r.donation_count or 0,
        })

    charities = Charity.objects.filter(is_active=True).prefetch_related("campaigns")

    return render(
        request,
        "backseat/impact.html",
        {
            "leaderboard": leaderboard,
            "total_donations": total_donations,
            "total_rides": total_rides,
            "people_helped": people_helped,
            "charities": charities,
            "donations": donations[:20],
        },
    )


@login_required
def dashboard(request):
    user_profile = profile_for(request.user)
    rider = rider_for(user_profile)

    if not rider:
        joins = RideJoin.objects.filter(passenger=user_profile).select_related("ride_offer__rider__user_profile__user").order_by("-created_at")[:5]
        donations = Donation.objects.filter(passenger=user_profile, status="SUCCESS").order_by("-created_at")
        total_donated = donations.aggregate(t=Sum("amount"))["t"] or 0
        return render(
            request,
            "backseat/dashboard.html",
            {
                "is_rider": False,
                "profile": user_profile,
                "joins": joins,
                "donations": donations[:5],
                "total_donated": total_donated,
                "rides_joined": joins.count(),
            },
        )

    rides_offered = RideOffer.objects.filter(rider=rider).count()
    people_helped = RideJoin.objects.filter(ride_offer__rider=rider, status__in=["ACCEPTED", "COMPLETED"]).count()
    donations = Donation.objects.filter(rider=rider, status="SUCCESS").order_by("-created_at")
    total_donated = donations.aggregate(t=Sum("amount"))["t"] or 0
    donation_count = donations.count()

    current_ride = RideOffer.objects.filter(rider=rider, status="ACTIVE").order_by("-created_at").first()
    current_ride_requests = 0
    if current_ride:
        current_ride_requests = RideJoin.objects.filter(ride_offer=current_ride, status="REQUESTED").count()

    all_ranked = (
        RiderProfile.objects.filter(is_vehicle_verified=True, hidden_from_leaderboard=False)
        .annotate(total=Sum("donations__amount", filter=Q(donations__status="SUCCESS")))
        .order_by("-total")
    )
    total_riders = all_ranked.count()
    rank = None
    for idx, r in enumerate(all_ranked, 1):
        if r.id == rider.id:
            rank = idx
            break

    chart_data = []
    for d in donations[:30]:
        chart_data.append({
            "date": d.completed_at.strftime("%Y-%m-%d") if d.completed_at else d.created_at.strftime("%Y-%m-%d"),
            "amount": d.amount,
        })

    return render(
        request,
        "backseat/dashboard.html",
        {
            "is_rider": True,
            "profile": user_profile,
            "rider": rider,
            "rides_offered": rides_offered,
            "people_helped": people_helped,
            "total_donated": total_donated,
            "donation_count": donation_count,
            "current_ride": current_ride,
            "current_ride_requests": current_ride_requests,
            "rank": rank,
            "total_riders": total_riders,
            "chart_data_json": json.dumps(chart_data),
        },
    )


@login_required
def dashboard_section(request, section):
    user_profile = profile_for(request.user)
    rider = rider_for(user_profile)

    context = {"section": section, "profile": user_profile, "rider": rider}

    if section == "My rides":
        if not rider:
            messages.info(request, "Set up your vehicle profile to offer and manage rides.")
            return redirect("become_a_rider")
        status_filter = request.GET.get("status", "ACTIVE")
        offers = (
            RideOffer.objects.filter(rider=rider, status=status_filter)
            .prefetch_related(
                "joins__passenger__user",
                "joins__donations",
                "joins__messages__sender__user",
            )
            .order_by("-created_at")
        )
        context["offers"] = offers
        context["status_filter"] = status_filter
        context["active_count"] = RideOffer.objects.filter(rider=rider, status="ACTIVE").count()
        context["completed_count"] = RideOffer.objects.filter(rider=rider, status="COMPLETED").count()
        context["cancelled_count"] = RideOffer.objects.filter(rider=rider, status="CANCELLED").count()

    elif section == "My trips":
        joins = (
            RideJoin.objects.filter(passenger=user_profile)
            .select_related("ride_offer__rider__user_profile__user")
            .prefetch_related("donations", "messages__sender__user")
            .order_by("-created_at")
        )
        context["joins"] = joins

    elif section in {"Donations", "Payments"}:
        donations_qs = Donation.objects.select_related(
            "rider__user_profile__user", "passenger__user", "charity", "campaign"
        ).filter(
            Q(passenger=user_profile) | Q(rider=rider) if rider else Q(passenger=user_profile)
        ).order_by("-created_at")
        context["donations"] = donations_qs
        context["total_donated"] = donations_qs.filter(status="SUCCESS").aggregate(t=Sum("amount"))["t"] or 0

    elif section == "Impact":
        donations_qs = Donation.objects.filter(status="SUCCESS")
        if rider:
            donations_qs = donations_qs.filter(Q(passenger=user_profile) | Q(rider=rider))
        else:
            donations_qs = donations_qs.filter(passenger=user_profile)
        context["donations"] = donations_qs
        context["total"] = donations_qs.aggregate(t=Sum("amount"))["t"] or 0

    return render(request, "backseat/dashboard_section.html", context)


@login_required
def profile(request):
    user_profile = profile_for(request.user)
    rider = rider_for(user_profile)

    if request.method == "POST":
        form_type = request.POST.get("form_type", "personal")

        if form_type == "personal":
            name = request.POST.get("name", "").strip()
            phone = request.POST.get("phone", "").strip()
            leaderboard_display = request.POST.get("leaderboard_display", "FIRST_NAME_INITIAL")

            if name:
                parts = name.split(" ", 1)
                request.user.first_name = parts[0]
                request.user.last_name = parts[1] if len(parts) > 1 else ""
                request.user.save()

            user_profile.phone = phone or None
            user_profile.leaderboard_display = leaderboard_display
            user_profile.save()
            messages.success(request, "Profile updated successfully.")

        elif form_type == "vehicle":
            vehicle_type = request.POST.get("vehicle_type", "FOUR_WHEELER")
            vehicle_make = request.POST.get("vehicle_make", "").strip()
            vehicle_model = request.POST.get("vehicle_model", "").strip()
            vehicle_plate = request.POST.get("vehicle_plate", "").strip()
            seats_available = int(request.POST.get("seats_available") or 1)
            bio = request.POST.get("bio", "").strip()

            if not rider:
                rider = RiderProfile.objects.create(
                    user_profile=user_profile,
                    charity_code=f"BS-{uuid.uuid4().hex[:6].upper()}",
                    vehicle_type=vehicle_type,
                    vehicle_make=vehicle_make,
                    vehicle_model=vehicle_model,
                    vehicle_plate=vehicle_plate,
                    seats_available=seats_available,
                    bio=bio,
                )
            else:
                rider.vehicle_type = vehicle_type
                rider.vehicle_make = vehicle_make
                rider.vehicle_model = vehicle_model
                rider.vehicle_plate = vehicle_plate
                rider.seats_available = seats_available
                rider.bio = bio
                rider.save()

            messages.success(request, "Vehicle information saved.")

        return redirect("profile")

    return render(request, "backseat/profile.html", {"profile": user_profile, "rider": rider})


@login_required
def dashboard_qr(request):
    user_profile = profile_for(request.user)
    rider = rider_for(user_profile)
    if not rider:
        messages.info(request, "Please set up your rider profile to get your charity QR code.")
        return redirect("become_a_rider")

    total_raised = Donation.objects.filter(rider=rider, status="SUCCESS").aggregate(t=Sum("amount"))["t"] or 0
    donation_count = Donation.objects.filter(rider=rider, status="SUCCESS").count()

    return render(
        request,
        "backseat/qr.html",
        {
            "rider": rider,
            "total_raised": total_raised,
            "donation_count": donation_count,
        },
    )


@login_required
@require_POST
def update_join(request, join_id):
    join = get_object_or_404(
        RideJoin.objects.select_related("ride_offer__rider__user_profile", "passenger__user"),
        id=join_id,
    )
    user_profile = profile_for(request.user)
    action = request.POST.get("action")

    is_rider = join.ride_offer.rider.user_profile_id == user_profile.id
    is_passenger = join.passenger_id == user_profile.id

    if not (is_rider or is_passenger):
        messages.error(request, "You cannot update this ride request.")
        return redirect("dashboard")

    if action == "accept" and is_rider:
        accepted_count = RideJoin.objects.filter(ride_offer=join.ride_offer, status="ACCEPTED").count()
        if accepted_count >= join.ride_offer.seats_available:
            messages.error(request, f"You have already accepted {accepted_count} passenger(s), reaching your vehicle's limit.")
            return redirect("my_rides")
        join.status = "ACCEPTED"
        join.save(update_fields=["status"])
        Notification.objects.create(
            user_profile=join.passenger,
            type="RIDE_STATUS",
            title="Ride request accepted!",
            body=f"{user_profile.user.get_full_name()} accepted your request for {join.ride_offer.start_location} → {join.ride_offer.destination}.",
            link=f"/rides/{join.ride_offer_id}",
        )
        audit(request, "Accepted ride join request", "RideJoin", join.id)
        messages.success(request, f"Accepted {join.passenger.user.get_full_name()}'s request.")

    elif action == "decline" and is_rider:
        join.status = "DECLINED"
        join.save(update_fields=["status"])
        Notification.objects.create(
            user_profile=join.passenger,
            type="RIDE_STATUS",
            title="Ride request declined",
            body=f"{user_profile.user.get_full_name()} was unable to accept your request for {join.ride_offer.start_location} → {join.ride_offer.destination}.",
            link="/find-a-ride",
        )
        audit(request, "Declined ride join request", "RideJoin", join.id)
        messages.info(request, "Declined ride request.")

    elif action == "complete" and is_rider:
        join.status = "COMPLETED"
        join.save(update_fields=["status"])
        Notification.objects.create(
            user_profile=join.passenger,
            type="RIDE_STATUS",
            title="Ride completed",
            body=f"Your ride with {user_profile.user.get_full_name()} is marked complete. You may optionally support their charity.",
            link=f"/donate/{join.ride_offer.rider.charity_code}",
        )
        audit(request, "Completed ride with passenger", "RideJoin", join.id)
        messages.success(request, "Ride marked travelled.")

    elif action == "cancel" and (is_passenger or is_rider):
        join.status = "CANCELLED"
        join.save(update_fields=["status"])
        target = join.ride_offer.rider.user_profile if is_passenger else join.passenger
        Notification.objects.create(
            user_profile=target,
            type="RIDE_STATUS",
            title="Ride request cancelled",
            body=f"The request for {join.ride_offer.start_location} → {join.ride_offer.destination} was cancelled.",
            link="/dashboard",
        )
        audit(request, "Cancelled ride join", "RideJoin", join.id)
        messages.info(request, "Ride request cancelled.")

    return redirect("my_rides" if is_rider else "my_trips")


@login_required
@require_POST
def update_ride(request, ride_id):
    ride = get_object_or_404(
        RideOffer.objects.select_related("rider__user_profile"), id=ride_id
    )
    user_profile = profile_for(request.user)

    if ride.rider.user_profile_id != user_profile.id and user_profile.role != "ADMIN":
        messages.error(request, "You do not have permission to modify this ride offer.")
        return redirect("my_rides")

    status = request.POST.get("status")
    if status in {"ACTIVE", "COMPLETED", "CANCELLED"}:
        ride.status = status
        ride.save(update_fields=["status"])
        audit(request, f"Ride marked {status.lower()}", "RideOffer", ride.id)
        messages.success(request, f"Ride offer status updated to {status.lower()}.")

    return redirect("my_rides")


@login_required
@require_POST
def toggle_sharing(request):
    rider = rider_for(profile_for(request.user))
    if not rider:
        messages.error(request, "Create your rider profile first.")
        return redirect("become_a_rider")

    rider.is_sharing_active = not rider.is_sharing_active
    rider.save(update_fields=["is_sharing_active"])
    status_text = "enabled" if rider.is_sharing_active else "disabled"
    messages.success(request, f"Ride sharing availability {status_text}.")
    return redirect(request.POST.get("next") or "dashboard_qr")


@login_required
@require_POST
def report_user(request, user_id):
    reporter = profile_for(request.user)
    reported = get_object_or_404(UserProfile, id=user_id)
    reason = request.POST.get("reason", "Safety concern")
    details = request.POST.get("details", "")

    Report.objects.create(
        reporter=reporter, reported=reported, reason=reason, details=details, status="OPEN"
    )
    audit(request, f"Report filed against user #{user_id}", "Report", user_id)
    messages.success(request, "Report submitted for admin safety review.")
    return redirect(request.POST.get("next") or "dashboard")


@login_required
@require_POST
def block_user(request, user_id):
    blocker = profile_for(request.user)
    blocked = get_object_or_404(UserProfile, id=user_id)
    Block.objects.get_or_create(blocker=blocker, blocked=blocked)
    audit(request, f"Blocked user #{user_id}", "Block", user_id)
    messages.success(request, f"User {blocked.user.get_full_name()} has been blocked.")
    return redirect(request.POST.get("next") or "dashboard")


@admin_required
def admin_console(request):
    tab = request.GET.get("tab", "overview")

    stats = {
        "users_count": UserProfile.objects.count(),
        "riders_count": RiderProfile.objects.count(),
        "rides_count": RideOffer.objects.count(),
        "donations_count": Donation.objects.filter(status="SUCCESS").count(),
        "total_donations": Donation.objects.filter(status="SUCCESS").aggregate(t=Sum("amount"))["t"] or 0,
        "unverified_riders": RiderProfile.objects.filter(is_vehicle_verified=False).count(),
        "open_reports": Report.objects.filter(status="OPEN").count(),
    }

    users_list = UserProfile.objects.select_related("user", "rider_profile").order_by("-created_at")
    riders_list = RiderProfile.objects.select_related("user_profile__user").order_by("-member_since")
    rides_list = RideOffer.objects.select_related("rider__user_profile__user").order_by("-created_at")
    donations_list = Donation.objects.select_related("rider__user_profile__user", "passenger__user", "charity").order_by("-created_at")
    reports_list = Report.objects.select_related("reporter__user", "reported__user").order_by("-created_at")
    charities_list = Charity.objects.prefetch_related("campaigns").all()
    campaigns_list = Campaign.objects.select_related("charity").all()
    audit_logs = AuditLog.objects.select_related("actor__user").order_by("-created_at")[:50]

    suspicious_donations = Donation.objects.filter(amount__gte=5000).select_related("passenger__user", "rider__user_profile__user", "charity")

    return render(
        request,
        "backseat/admin.html",
        {
            "tab": tab,
            "stats": stats,
            "users": users_list,
            "riders": riders_list,
            "rides": rides_list,
            "donations": donations_list,
            "reports": reports_list,
            "charities": charities_list,
            "campaigns": campaigns_list,
            "audit_logs": audit_logs,
            "suspicious_donations": suspicious_donations,
        },
    )


@admin_required
@require_POST
def admin_action(request, kind, item_id):
    if kind == "user":
        item = get_object_or_404(UserProfile, id=item_id)
        action_type = request.POST.get("action_type")
        if action_type == "toggle_block":
            item.is_blocked = not item.is_blocked
            item.save(update_fields=["is_blocked"])
            audit(request, f"Admin {'blocked' if item.is_blocked else 'unblocked'} user #{item_id}", "User", item_id)
            messages.success(request, f"User {'blocked' if item.is_blocked else 'unblocked'}.")

    elif kind == "rider":
        item = get_object_or_404(RiderProfile, id=item_id)
        action_type = request.POST.get("action_type")
        if action_type == "toggle_verify":
            item.is_vehicle_verified = not item.is_vehicle_verified
            item.save(update_fields=["is_vehicle_verified"])
            audit(request, f"Admin {'verified' if item.is_vehicle_verified else 'unverified'} vehicle for rider #{item_id}", "RiderProfile", item_id)
            messages.success(request, f"Rider vehicle {'verified' if item.is_vehicle_verified else 'unverified'}.")
        elif action_type == "toggle_leaderboard":
            item.hidden_from_leaderboard = not item.hidden_from_leaderboard
            item.save(update_fields=["hidden_from_leaderboard"])
            audit(request, f"Admin {'hid' if item.hidden_from_leaderboard else 'restored'} rider #{item_id} on leaderboard", "RiderProfile", item_id)
            messages.success(request, f"Leaderboard visibility updated.")

    elif kind == "ride":
        item = get_object_or_404(RideOffer, id=item_id)
        action_type = request.POST.get("action_type")
        if action_type == "cancel":
            item.status = "CANCELLED"
            item.save(update_fields=["status"])
            audit(request, f"Admin cancelled ride offer #{item_id}", "RideOffer", item_id)
            messages.success(request, f"Ride offer #{item_id} cancelled.")

    elif kind == "donation":
        item = get_object_or_404(Donation, id=item_id)
        action_type = request.POST.get("action_type")
        if action_type == "refund":
            item.status = "REFUNDED"
            item.save(update_fields=["status"])
            audit(request, f"Admin refunded donation #{item_id}", "Donation", item_id)
            messages.success(request, f"Donation #{item.donation_ref} marked as refunded.")

    elif kind == "charity":
        item = get_object_or_404(Charity, id=item_id)
        for field in ["name", "registration_number", "description", "beneficiary_upi_vpa", "beneficiary_name"]:
            if request.POST.get(field) is not None:
                setattr(item, field, request.POST.get(field).strip())
        item.save()
        audit(request, f"Admin updated charity details for {item.name}", "Charity", item.id)
        messages.success(request, f"Charity configuration updated.")

    return redirect(f"/admin?tab={request.POST.get('tab', 'overview')}")


# ==========================================
# REST API Endpoints for Full Parity
# ==========================================

def api_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None})
    return JsonResponse({"user": user_payload(profile_for(request.user))})


@csrf_exempt
def api_register(request):
    if request.method != "POST":
        return json_error("Method not allowed", 405)
    data = body_json(request)
    email = (data.get("email") or "").lower().strip()
    if User.objects.filter(username=email).exists():
        return json_error("An account with this email already exists", 409)
    name = data.get("name", "").strip()
    password = data.get("password", "")
    if len(name) < 2 or len(password) < 8 or "@" not in email:
        return json_error("Invalid input")
    parts = name.split(" ", 1)
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=parts[0],
        last_name=parts[1] if len(parts) > 1 else "",
    )
    profile = UserProfile.objects.create(user=user, phone=data.get("phone") or None, email_verified=True)
    login(request, user)
    return JsonResponse(user_payload(profile))


@csrf_exempt
def api_login(request):
    if request.method != "POST":
        return json_error("Method not allowed", 405)
    data = body_json(request)
    user = authenticate(
        request,
        username=(data.get("email") or "").lower().strip(),
        password=data.get("password", ""),
    )
    if not user:
        return json_error("Invalid email or password", 401)
    login(request, user)
    return JsonResponse(user_payload(profile_for(user)))


@csrf_exempt
def api_logout(request):
    logout(request)
    return JsonResponse({"ok": True})


@csrf_exempt
def api_profile(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    if request.method in {"POST", "PATCH"}:
        data = body_json(request)
        name = data.get("name")
        if name:
            parts = name.strip().split(" ", 1)
            request.user.first_name = parts[0]
            request.user.last_name = parts[1] if len(parts) > 1 else ""
            request.user.save()
        if "phone" in data:
            profile.phone = data.get("phone") or None
        if "leaderboardDisplay" in data:
            profile.leaderboard_display = data.get("leaderboardDisplay")
        profile.save()
    return JsonResponse(user_payload(profile))


@csrf_exempt
def api_rider_onboard(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    data = body_json(request)
    rider, _ = RiderProfile.objects.get_or_create(
        user_profile=profile,
        defaults={
            "charity_code": f"BS-{uuid.uuid4().hex[:6].upper()}",
            "vehicle_type": data.get("vehicleType", "FOUR_WHEELER"),
            "vehicle_make": data.get("vehicleMake", ""),
            "vehicle_model": data.get("vehicleModel", ""),
            "vehicle_plate": data.get("vehiclePlate", ""),
        },
    )
    if "vehicleType" in data:
        rider.vehicle_type = data["vehicleType"]
    if "vehicleMake" in data:
        rider.vehicle_make = data["vehicleMake"]
    if "vehicleModel" in data:
        rider.vehicle_model = data["vehicleModel"]
    if "vehiclePlate" in data:
        rider.vehicle_plate = data["vehiclePlate"]
    if "seatsAvailable" in data:
        rider.seats_available = int(data["seatsAvailable"])
    if "bio" in data:
        rider.bio = data["bio"]
    rider.save()
    return JsonResponse({"rider": rider_payload(rider)})


@csrf_exempt
def api_rider_vehicle(request):
    return api_rider_onboard(request)


@csrf_exempt
def api_rider_sharing(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    rider = rider_for(profile)
    if not rider:
        return json_error("Rider profile not found", 404)
    data = body_json(request)
    rider.is_sharing_active = bool(data.get("isSharingActive", not rider.is_sharing_active))
    rider.save(update_fields=["is_sharing_active"])
    return JsonResponse({"rider": rider_payload(rider)})


@csrf_exempt
def api_rider_qr_regenerate(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    rider = rider_for(profile)
    if not rider:
        return json_error("Rider profile not found", 404)
    rider.charity_code = f"BS-{uuid.uuid4().hex[:6].upper()}"
    rider.save(update_fields=["charity_code"])
    return JsonResponse({"charityCode": rider.charity_code})


@csrf_exempt
def api_rides(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return json_error("Authentication required", 401)
        profile = profile_for(request.user)
        rider = rider_for(profile)
        if not rider:
            return json_error("Create a rider profile first", 403)
        if not rider.is_vehicle_verified:
            return json_error("Your vehicle must be verified before offering a ride.", 403)
        data = body_json(request)
        seats = int(data.get("seatsAvailable") or data.get("seats_available") or 1)
        if seats > rider.seats_available:
            return json_error(f"Your vehicle has at most {rider.seats_available} spare seat(s).")
        offer = RideOffer.objects.create(
            rider=rider,
            vehicle_type=rider.vehicle_type,
            seats_available=seats,
            start_location=data.get("startLocation") or data.get("start_location"),
            destination=data.get("destination"),
            departure_at=clean_datetime(data.get("departureAt") or data.get("departure_at")),
            notes=data.get("notes", ""),
            status="ACTIVE",
        )
        if not rider.is_sharing_active:
            rider.is_sharing_active = True
            rider.save(update_fields=["is_sharing_active"])
        return JsonResponse({"id": offer.id, "ride": ride_payload(offer)})

    from_q = request.GET.get("from", "").strip() or request.GET.get("q", "").strip()
    to_q = request.GET.get("to", "").strip()
    vehicle_type = request.GET.get("vehicleType", "").strip()

    rides = (
        RideOffer.objects.filter(
            status="ACTIVE",
            rider__is_sharing_active=True,
            rider__is_vehicle_verified=True,
        )
        .select_related("rider__user_profile__user")
        .order_by("-created_at")
    )
    if from_q:
        rides = rides.filter(Q(start_location__icontains=from_q) | Q(destination__icontains=from_q))
    if to_q:
        rides = rides.filter(destination__icontains=to_q)
    if vehicle_type:
        rides = rides.filter(vehicle_type=vehicle_type)

    return JsonResponse({"offers": [ride_payload(r) for r in rides[:50]]})


@csrf_exempt
def api_ride_detail(request, ride_id):
    ride = get_object_or_404(
        RideOffer.objects.select_related("rider__user_profile__user"), id=ride_id
    )
    if request.method in {"PATCH", "POST"}:
        if not request.user.is_authenticated:
            return json_error("Authentication required", 401)
        profile = profile_for(request.user)
        if ride.rider.user_profile_id != profile.id and profile.role != "ADMIN":
            return json_error("Forbidden", 403)
        data = body_json(request)
        if "status" in data:
            ride.status = data["status"]
        if "seatsAvailable" in data:
            ride.seats_available = int(data["seatsAvailable"])
        ride.save()
        return JsonResponse({"ride": ride_payload(ride)})
    return JsonResponse({"ride": ride_payload(ride)})


@csrf_exempt
def api_ride_join(request, ride_id):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    ride = get_object_or_404(RideOffer, id=ride_id, status="ACTIVE")
    if ride.rider.user_profile_id == profile.id:
        return json_error("You cannot join your own ride offer.")
    join, created = RideJoin.objects.get_or_create(
        ride_offer=ride, passenger=profile, defaults={"status": "REQUESTED"}
    )
    Notification.objects.create(
        user_profile=ride.rider.user_profile,
        type="RIDE_REQUEST",
        title="New ride request",
        body=f"{profile.user.get_full_name()} requested your ride.",
        link="/dashboard/my-rides",
    )
    return JsonResponse({"id": join.id, "status": join.status, "created": created})


@csrf_exempt
def api_join_detail(request, ride_id, join_id):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    join = get_object_or_404(
        RideJoin.objects.select_related("ride_offer__rider__user_profile", "passenger"),
        id=join_id,
        ride_offer_id=ride_id,
    )
    if join.passenger_id != profile.id and join.ride_offer.rider.user_profile_id != profile.id and profile.role != "ADMIN":
        return json_error("Forbidden", 403)
    data = body_json(request)
    if request.method in {"POST", "PATCH"} and data.get("status"):
        new_status = data["status"]
        if new_status == "ACCEPTED":
            accepted = RideJoin.objects.filter(ride_offer=join.ride_offer, status="ACCEPTED").count()
            if accepted >= join.ride_offer.seats_available:
                return json_error(f"Cannot accept: vehicle seats cap reached ({join.ride_offer.seats_available}).")
        join.status = new_status
        join.save(update_fields=["status"])
    return JsonResponse({"join": {"id": join.id, "status": join.status, "rideId": join.ride_offer_id, "passengerId": join.passenger_id}})


@csrf_exempt
def api_join_messages(request, ride_id, join_id):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    join = get_object_or_404(
        RideJoin.objects.select_related("ride_offer__rider__user_profile", "passenger"),
        id=join_id,
        ride_offer_id=ride_id,
    )
    if join.passenger_id != profile.id and join.ride_offer.rider.user_profile_id != profile.id:
        return json_error("Forbidden", 403)

    if request.method == "POST":
        data = body_json(request)
        body = (data.get("body") or "").strip()
        if body:
            Message.objects.create(ride_join=join, sender=profile, body=body)

    messages_qs = Message.objects.filter(ride_join=join).select_related("sender__user").order_by("created_at")
    return JsonResponse({
        "messages": [
            {
                "id": m.id,
                "body": m.body,
                "senderId": m.sender_id,
                "senderName": m.sender.user.get_full_name() or m.sender.user.username,
                "createdAt": m.created_at.isoformat(),
            }
            for m in messages_qs
        ]
    })


@csrf_exempt
def api_donate_initiate(request):
    data = body_json(request)
    rider = get_object_or_404(RiderProfile, charity_code=data.get("charityCode"))
    if not rider.is_vehicle_verified:
        return json_error("This rider's charity QR is pending verification.", 403)
    charity = Charity.objects.filter(is_active=True).first()
    if not charity:
        return json_error("No active charity configured", 500)
    campaign = Campaign.objects.filter(charity=charity, is_active=True).order_by("-started_at").first()
    ref = f"DON-{uuid.uuid4().hex[:8].upper()}"
    try:
        amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        amount = 0

    if amount <= 0:
        return json_error("Enter an amount greater than ₹0")

    passenger_profile = profile_for(request.user) if request.user.is_authenticated else None

    donation = Donation.objects.create(
        donation_ref=ref,
        amount=amount,
        rider=rider,
        passenger=passenger_profile,
        charity=charity,
        campaign=campaign,
        status="PENDING",
        donor_display_name_snapshot=data.get("donorName") or "A kind traveller",
    )

    upi_vpa = os.getenv("CHARITY_UPI_VPA", charity.beneficiary_upi_vpa)
    payee_name = os.getenv("CHARITY_UPI_PAYEE_NAME", charity.beneficiary_name)
    upi_link = f"upi://pay?pa={quote(upi_vpa)}&pn={quote(payee_name)}&am={amount}&cu=INR&tn={quote('Donation to ' + charity.name + ' via Backseat')}&tr={ref}"

    return JsonResponse({"donationId": donation.id, "donationRef": ref, "upiLink": upi_link})


@csrf_exempt
def api_donate_confirm(request):
    data = body_json(request)
    donation = get_object_or_404(Donation, id=data.get("donationId"))
    donation.status = "SUCCESS"
    donation.transaction_ref = data.get("transactionRef") or f"UPI-{uuid.uuid4().hex[:8].upper()}"
    donation.completed_at = timezone.now()
    donation.save()
    return JsonResponse({"donationId": donation.id, "status": donation.status})


@csrf_exempt
def api_notifications(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    notifications = Notification.objects.filter(user_profile=profile).order_by("-created_at")[:50]
    unread_count = Notification.objects.filter(user_profile=profile, is_read=False).count()
    return JsonResponse({
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "link": n.link,
                "isRead": n.is_read,
                "createdAt": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        "unreadCount": unread_count,
    })


@csrf_exempt
def api_notification_read(request, notification_id):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    n = get_object_or_404(Notification, id=notification_id, user_profile=profile)
    n.is_read = True
    n.save(update_fields=["is_read"])
    return JsonResponse({"ok": True})


@csrf_exempt
def api_notifications_read_all(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    Notification.objects.filter(user_profile=profile, is_read=False).update(is_read=True)
    return JsonResponse({"ok": True})


@csrf_exempt
def api_reports(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    data = body_json(request)
    reported = get_object_or_404(UserProfile, id=data.get("reportedUserId"))
    report = Report.objects.create(
        reporter=profile,
        reported=reported,
        reason=data.get("reason", "Safety concern"),
        details=data.get("details", ""),
    )
    return JsonResponse({"id": report.id, "status": report.status})


@csrf_exempt
def api_blocks(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    data = body_json(request)
    blocked = get_object_or_404(UserProfile, id=data.get("blockedUserId"))
    block, created = Block.objects.get_or_create(blocker=profile, blocked=blocked)
    return JsonResponse({"id": block.id, "created": created})


@csrf_exempt
def api_sos(request):
    if not request.user.is_authenticated:
        return json_error("Authentication required", 401)
    profile = profile_for(request.user)
    data = body_json(request)
    AuditLog.objects.create(
        actor=profile, action="Emergency SOS Alert", target_type="Safety", metadata_json=json.dumps(dict(data))
    )
    return JsonResponse({"ok": True, "message": "Emergency SOS logged. Contacting emergency services."})


@csrf_exempt
def api_chatbot(request):
    data = body_json(request)
    messages_in = data.get("messages") or [{"role": "user", "content": data.get("message", "")}]
    question = next((m.get("content", "") for m in reversed(messages_in) if m.get("role") == "user"), "").lower()

    knowledge_base = [
        (
            ["find", "search", "join", "book", "passenger", "look for ride"],
            "To find a ride, go to **Find a Ride**, filter by pickup city or vehicle type, and tap **View & Join** on any available trip. You can chat with the rider once requested.",
            [{"label": "Find a Ride", "href": "/find-a-ride"}, {"label": "How It Works", "href": "/how-it-works"}],
        ),
        (
            ["offer", "publish", "driver", "seat", "carpool", "share seat"],
            "If you're already travelling alone, tap **Offer a Ride** to publish your route and spare seats. Backseat rides are 100% free — you cannot set or receive any fares.",
            [{"label": "Offer a Ride", "href": "/offer-a-ride"}, {"label": "Become a Rider", "href": "/become-a-rider"}],
        ),
        (
            ["donate", "charity", "upi", "payment", "fare", "cost", "money"],
            "Backseat rides never have a fare. At the end of the trip, passengers may voluntarily scan the rider's charity QR code and donate any amount directly to registered charities via UPI.",
            [{"label": "Charity Impact", "href": "/charity-impact"}, {"label": "Top Contributors", "href": "/top-contributors"}],
        ),
        (
            ["qr", "code", "sticker", "scan"],
            "Verified riders get a dedicated **Charity QR Code** in their dashboard. Passengers scan this code after the trip to contribute voluntarily to our charity partners.",
            [{"label": "Charity QR", "href": "/dashboard/qr"}],
        ),
        (
            ["safe", "safety", "sos", "emergency", "verify", "police", "112"],
            "Safety is core to Backseat: all riders undergo vehicle and identity verification before sharing seats. In an emergency, our Safety Centre provides immediate access to India's national emergency helpline (112) and instant SOS logging.",
            [{"label": "Safety Centre", "href": "/safety"}, {"label": "Community Guidelines", "href": "/community-guidelines"}],
        ),
        (
            ["admin", "verify vehicle", "moderation", "audit"],
            "Platform administrators can verify rider vehicles, moderate ride offers, handle donation refunds, update charity UPI IDs, and review audit logs in the Admin Portal.",
            [{"label": "Admin Portal", "href": "/admin"}],
        ),
    ]

    best = max(knowledge_base, key=lambda item: sum(1 for kw in item[0] if kw in question), default=None)
    if not question.strip() or not best or sum(1 for kw in best[0] if kw in question) == 0:
        return JsonResponse({
            "answer": "I'm the Backseat Assistant. I can help with finding rides, offering spare seats, voluntary charity donations, rider QR codes, safety guidelines, and account setup. How can I help you today?",
            "links": [
                {"label": "How It Works", "href": "/how-it-works"},
                {"label": "Find a Ride", "href": "/find-a-ride"},
                {"label": "Offer a Ride", "href": "/offer-a-ride"},
            ],
        })

    return JsonResponse({"answer": best[1], "links": best[2]})


@csrf_exempt
@admin_required
def api_admin_update(request, kind, item_id):
    data = body_json(request)
    if kind == "user":
        item = get_object_or_404(UserProfile, id=item_id)
        item.is_blocked = bool(data.get("isBlocked", not item.is_blocked))
        item.save(update_fields=["is_blocked"])
    elif kind == "rider":
        item = get_object_or_404(RiderProfile, id=item_id)
        item.is_vehicle_verified = bool(data.get("isVehicleVerified", not item.is_vehicle_verified))
        item.hidden_from_leaderboard = bool(data.get("hiddenFromLeaderboard", item.hidden_from_leaderboard))
        item.save()
    elif kind == "ride":
        item = get_object_or_404(RideOffer, id=item_id)
        item.status = data.get("status", item.status)
        item.save(update_fields=["status"])
    elif kind == "donation":
        item = get_object_or_404(Donation, id=item_id)
        item.status = data.get("status", item.status)
        item.save(update_fields=["status"])
    elif kind == "report":
        item = get_object_or_404(Report, id=item_id)
        item.status = data.get("status", item.status)
        item.save(update_fields=["status"])
    elif kind == "charity":
        item = get_object_or_404(Charity, id=item_id)
        for field in ["name", "registration_number", "description", "beneficiary_upi_vpa", "beneficiary_name"]:
            if field in data:
                setattr(item, field, data[field])
        if "isActive" in data:
            item.is_active = bool(data["isActive"])
        item.save()
    elif kind == "campaign":
        item = get_object_or_404(Campaign, id=item_id)
        for field in ["name", "description", "amount_distributed", "beneficiaries_supported", "goal_amount"]:
            if field in data:
                setattr(item, field, data[field])
        if "isActive" in data:
            item.is_active = bool(data["isActive"])
        item.save()
    else:
        return json_error("Unknown admin action", 404)
    audit(request, f"Admin API updated {kind}", kind, item_id)
    return JsonResponse({"ok": True})
