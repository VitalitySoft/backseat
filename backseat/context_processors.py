from .models import Notification, RiderProfile, UserProfile


def nav_profile(request):
    if not request.user.is_authenticated:
        return {
            "nav_user": None,
            "nav_profile": None,
            "nav_rider": None,
            "unread_count": 0,
            "recent_notifications": [],
        }

    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={"role": "ADMIN" if request.user.is_superuser else "USER"},
    )
    rider = None
    try:
        rider = profile.rider_profile
    except RiderProfile.DoesNotExist:
        rider = None

    unread_count = Notification.objects.filter(user_profile=profile, is_read=False).count()
    recent_notifications = Notification.objects.filter(user_profile=profile).order_by("-created_at")[:5]

    return {
        "nav_user": request.user,
        "nav_profile": profile,
        "nav_rider": rider,
        "unread_count": unread_count,
        "recent_notifications": recent_notifications,
        "is_admin": profile.role == "ADMIN" or request.user.is_superuser,
    }
