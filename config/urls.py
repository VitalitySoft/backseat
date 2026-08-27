from django.contrib import admin
from django.urls import path
from backseat import views

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("", views.home, name="home"),
    path("about", views.static_page, {"slug": "about"}, name="about"),
    path("how-it-works", views.static_page, {"slug": "how-it-works"}, name="how_it_works"),
    path("safety", views.static_page, {"slug": "safety"}, name="safety"),
    path("community-guidelines", views.static_page, {"slug": "community-guidelines"}, name="community_guidelines"),
    path("terms", views.static_page, {"slug": "terms"}, name="terms"),
    path("privacy", views.static_page, {"slug": "privacy"}, name="privacy"),
    path("disclaimers", views.static_page, {"slug": "disclaimers"}, name="disclaimers"),
    path("become-a-rider", views.static_page, {"slug": "become-a-rider"}, name="become_a_rider"),
    path("register", views.register_view, name="register"), path("login", views.login_view, name="login"), path("logout", views.logout_view, name="logout"),
    path("find-a-ride", views.find_a_ride, name="find_a_ride"), path("offer-a-ride", views.offer_a_ride, name="offer_a_ride"), path("rides/<int:ride_id>", views.ride_detail, name="ride_detail"), path("rider/<int:rider_id>", views.rider_profile, name="rider_profile"),
    path("donate/<str:code>", views.donate, name="donate"), path("donate/receipt/<int:donation_id>", views.receipt, name="receipt"), path("qr/<str:code>.png", views.qr_png, name="qr_png"), path("top-contributors", views.impact, name="top_contributors"), path("charity-impact", views.impact, name="charity_impact"),
    path("dashboard", views.dashboard, name="dashboard"), path("dashboard/my-rides", views.dashboard_section, {"section": "My rides"}, name="my_rides"), path("dashboard/my-trips", views.dashboard_section, {"section": "My trips"}, name="my_trips"), path("dashboard/donations", views.dashboard_section, {"section": "Donations"}, name="donations"), path("dashboard/payments", views.dashboard_section, {"section": "Payments"}, name="payments"), path("dashboard/impact", views.dashboard_section, {"section": "Impact"}, name="dashboard_impact"), path("dashboard/profile", views.profile, name="profile"), path("dashboard/qr", views.dashboard_qr, name="dashboard_qr"),
    path("admin", views.admin_console, name="admin_console"), path("admin/users", views.admin_console, name="admin_users"), path("admin/riders", views.admin_console, name="admin_riders"), path("admin/rides", views.admin_console, name="admin_rides"), path("admin/donations", views.admin_console, name="admin_donations"), path("admin/reports", views.admin_console, name="admin_reports"), path("admin/verification", views.admin_console, name="admin_verification"), path("admin/fraud", views.admin_console, name="admin_fraud"), path("admin/leaderboard", views.admin_console, name="admin_leaderboard"), path("admin/audit-log", views.admin_console, name="admin_audit_log"), path("admin/charities", views.admin_console, name="admin_charities"),
]
