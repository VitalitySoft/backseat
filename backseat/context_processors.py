from .models import UserProfile


def nav_profile(request):
    if not request.user.is_authenticated:
        return {"nav_profile": None}
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={"role": "ADMIN" if request.user.is_superuser else "USER"},
    )
    return {"nav_profile": profile}
