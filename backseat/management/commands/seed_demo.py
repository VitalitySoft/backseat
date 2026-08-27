from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from backseat.models import Campaign, Charity, Donation, RideOffer, RiderProfile, UserProfile

class Command(BaseCommand):
    help = "Seed Backseat demo users, charity, campaign, ride, and donation."
    def handle(self, *args, **options):
        if User.objects.filter(username="admin@backseat.app").exists():
            self.stdout.write(self.style.WARNING("Demo data already exists.")); return
        admin = User.objects.create_user(username="admin@backseat.app", email="admin@backseat.app", password="Admin@123", first_name="Backseat", last_name="Admin", is_staff=True, is_superuser=True)
        rider_user = User.objects.create_user(username="demo.rider@backseat.app", email="demo.rider@backseat.app", password="Demo@123", first_name="Aarav", last_name="Rider")
        passenger_user = User.objects.create_user(username="demo.passenger@backseat.app", email="demo.passenger@backseat.app", password="Demo@123", first_name="Mira", last_name="Passenger")
        UserProfile.objects.create(user=admin, role="ADMIN", email_verified=True)
        rider_profile_user = UserProfile.objects.create(user=rider_user, phone="+919900001111", email_verified=True, phone_verified=True)
        passenger_profile = UserProfile.objects.create(user=passenger_user, phone="+919900002222", email_verified=True)
        charity = Charity.objects.create(name="Backseat Charitable Trust", registration_number="BCT-2026", description="Supporting verified local causes through voluntary ride-linked donations.", beneficiary_upi_vpa="backseat.charity@upi", beneficiary_name="Backseat Charitable Trust")
        campaign = Campaign.objects.create(charity=charity, name="Meals for Children", description="Funding nutritious meals for children after school.", goal_amount=50000, amount_distributed=12400, beneficiaries_supported=248)
        rider = RiderProfile.objects.create(user_profile=rider_profile_user, vehicle_type="FOUR_WHEELER", vehicle_make="Hyundai", vehicle_model="i20", vehicle_plate="KA 01 AB 2026", seats_available=2, is_vehicle_verified=True, is_sharing_active=True, charity_code="AARAV2026", bio="Daily commuter happy to share a spare seat.")
        RideOffer.objects.create(rider=rider, vehicle_type=rider.vehicle_type, seats_available=2, start_location="Indiranagar", destination="Electronic City", status="ACTIVE", notes="Office route, weekday mornings.")
        Donation.objects.create(donation_ref="DON-DEMO-001", amount=250, rider=rider, passenger=passenger_profile, charity=charity, campaign=campaign, status="SUCCESS", transaction_ref="UPI-DEMO-001", donor_display_name_snapshot="Mira P.", completed_at=timezone.now())
        self.stdout.write(self.style.SUCCESS("Seeded demo data."))
