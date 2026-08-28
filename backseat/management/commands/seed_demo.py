import random
import uuid
from datetime import timedelta
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone
from backseat.models import (
    AuditLog,
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


class Command(BaseCommand):
    help = "Seed rich Backseat demo accounts, rides, charities, and donations."

    def handle(self, *args, **options):
        # Clear existing demo data to ensure a clean, accurate state
        Donation.objects.all().delete()
        Message.objects.all().delete()
        RideJoin.objects.all().delete()
        RideOffer.objects.all().delete()
        Report.objects.all().delete()
        Notification.objects.all().delete()
        AuditLog.objects.all().delete()
        RiderProfile.objects.all().delete()
        UserProfile.objects.all().delete()
        Campaign.objects.all().delete()
        Charity.objects.all().delete()
        User.objects.filter(email__contains="@").delete()

        now = timezone.now()

        # ---- 1. Charities & Campaigns ----
        charity_pratham = Charity.objects.create(
            name="Pratham Education Foundation",
            registration_number="BCT-80G-2024/991",
            description="Providing high-quality early education and literacy programs to underprivileged children across 21 Indian states.",
            beneficiary_upi_vpa="pratham.education@upi",
            beneficiary_name="Pratham Education Foundation",
            is_active=True,
        )
        campaign_edu = Campaign.objects.create(
            charity=charity_pratham,
            name="Teach India Rural Literacy Drive",
            description="Empowering village primary schools with digital learning kits and trained educators.",
            goal_amount=1000000,
            amount_distributed=316900,
            beneficiaries_supported=410,
            is_active=True,
            started_at=now - timedelta(days=180),
        )

        charity_goonj = Charity.objects.create(
            name="Goonj Community Care",
            registration_number="BCT-80G-2023/452",
            description="Turning urban surplus into rural disaster relief, clean clothing, and community infrastructure.",
            beneficiary_upi_vpa="goonj.relief@upi",
            beneficiary_name="Goonj Trust",
            is_active=True,
        )
        campaign_relief = Campaign.objects.create(
            charity=charity_goonj,
            name="Rahat Rural Care Initiative",
            description="Delivering emergency medical aid and essential supplies to remote tribal hamlets.",
            goal_amount=750000,
            amount_distributed=184500,
            beneficiaries_supported=295,
            is_active=True,
            started_at=now - timedelta(days=120),
        )

        # ---- 2. Admin User ----
        admin_user = User.objects.create_user(
            username="admin@backseat.app",
            email="admin@backseat.app",
            password="Admin@123",
            first_name="Platform",
            last_name="Admin",
            is_staff=True,
            is_superuser=True,
        )
        admin_profile = UserProfile.objects.create(
            user=admin_user,
            phone="+919810000000",
            role="ADMIN",
            email_verified=True,
            phone_verified=True,
        )

        # ---- 3. Riders (5 Verified Riders across major Indian cities) ----
        rider_configs = [
            {
                "first": "Ravi",
                "last": "Kumar",
                "email": "demo.rider@backseat.app",
                "phone": "+919810000001",
                "vehicle_type": "FOUR_WHEELER",
                "make": "Maruti Suzuki",
                "model": "Ertiga",
                "plate": "KA 05 MJ 4471",
                "seats": 3,
                "start": "Koramangala, Bengaluru",
                "dest": "Whitefield, Bengaluru",
                "code": "BS-RAVIKUMAR",
                "target_donations": 25450,
            },
            {
                "first": "Suresh",
                "last": "Patil",
                "email": "suresh@example.com",
                "phone": "+919810000002",
                "vehicle_type": "FOUR_WHEELER",
                "make": "Hyundai",
                "model": "i20",
                "plate": "MH 12 AB 8823",
                "seats": 2,
                "start": "Andheri East, Mumbai",
                "dest": "Bandra Kurla Complex, Mumbai",
                "code": "BS-SURESHP",
                "target_donations": 18200,
            },
            {
                "first": "Priya",
                "last": "Sharma",
                "email": "priya@example.com",
                "phone": "+919810000003",
                "vehicle_type": "TWO_WHEELER",
                "make": "TVS",
                "model": "Jupiter",
                "plate": "DL 3S CA 9012",
                "seats": 1,
                "start": "Connaught Place, Delhi",
                "dest": "Karol Bagh, Delhi",
                "code": "BS-PRIYAS",
                "target_donations": 15750,
            },
            {
                "first": "Anil",
                "last": "Reddy",
                "email": "anil@example.com",
                "phone": "+919810000004",
                "vehicle_type": "TWO_WHEELER",
                "make": "Honda",
                "model": "Activa",
                "plate": "TS 09 EQ 5541",
                "seats": 1,
                "start": "Gachibowli, Hyderabad",
                "dest": "Hitech City, Hyderabad",
                "code": "BS-ANILR",
                "target_donations": 12400,
            },
            {
                "first": "Meena",
                "last": "Iyer",
                "email": "meena@example.com",
                "phone": "+919810000005",
                "vehicle_type": "FOUR_WHEELER",
                "make": "Tata",
                "model": "Nexon",
                "plate": "TN 07 CZ 3390",
                "seats": 3,
                "start": "Adyar, Chennai",
                "dest": "OMR, Chennai",
                "code": "BS-MEENAI",
                "target_donations": 6300,
            },
        ]

        rider_records = []
        for rc in rider_configs:
            u = User.objects.create_user(
                username=rc["email"],
                email=rc["email"],
                password="Demo@123",
                first_name=rc["first"],
                last_name=rc["last"],
            )
            up = UserProfile.objects.create(
                user=u,
                phone=rc["phone"],
                role="USER",
                email_verified=True,
                phone_verified=True,
                leaderboard_display="FULL_NAME",
            )
            rp = RiderProfile.objects.create(
                user_profile=up,
                vehicle_type=rc["vehicle_type"],
                vehicle_make=rc["make"],
                vehicle_model=rc["model"],
                vehicle_plate=rc["plate"],
                seats_available=rc["seats"],
                is_vehicle_verified=True,
                is_sharing_active=True,
                charity_code=rc["code"],
                bio=f"Travels {rc['start']} → {rc['dest']} regularly and loves good conversation.",
                member_since=now - timedelta(days=90),
            )
            rider_records.append({
                "rider_profile": rp,
                "user_profile": up,
                "config": rc,
            })

        # ---- 4. Passengers ----
        passenger_configs = [
            {"first": "Demo", "last": "Passenger", "email": "demo.passenger@backseat.app", "phone": "+919900000001"},
            {"first": "Kavya", "last": "Nair", "email": "kavya@example.com", "phone": "+919900000002"},
            {"first": "Rahul", "last": "Verma", "email": "rahul@example.com", "phone": "+919900000003"},
            {"first": "Ayesha", "last": "Khan", "email": "ayesha@example.com", "phone": "+919900000004"},
        ]

        passenger_records = []
        for pc in passenger_configs:
            u = User.objects.create_user(
                username=pc["email"],
                email=pc["email"],
                password="Demo@123",
                first_name=pc["first"],
                last_name=pc["last"],
            )
            up = UserProfile.objects.create(
                user=u,
                phone=pc["phone"],
                role="USER",
                email_verified=True,
                phone_verified=True,
                leaderboard_display="FIRST_NAME_INITIAL",
            )
            passenger_records.append(up)

        # ---- 5. Active Ride Offers & Joins ----
        for idx, item in enumerate(rider_records, 1):
            rp = item["rider_profile"]
            rc = item["config"]
            offer = RideOffer.objects.create(
                rider=rp,
                vehicle_type=rc["vehicle_type"],
                seats_available=rc["seats"],
                start_location=rc["start"],
                destination=rc["dest"],
                departure_at=now + timedelta(hours=idx * 6 + 2),
                status="ACTIVE",
                notes="Daily office commute. Happy to pick up near main junction.",
            )

            # Add requests/joins
            for p_idx, pass_up in enumerate(passenger_records):
                if p_idx == 0:
                    status = "REQUESTED"
                elif p_idx == 1:
                    status = "ACCEPTED"
                else:
                    status = "COMPLETED"

                join = RideJoin.objects.create(
                    ride_offer=offer,
                    passenger=pass_up,
                    status=status,
                    created_at=now - timedelta(days=p_idx * 5 + 1),
                )

                if status in {"REQUESTED", "ACCEPTED"}:
                    Message.objects.create(
                        ride_join=join,
                        sender=pass_up,
                        body="Hi, can I join near the metro pillar 42?",
                        created_at=now - timedelta(hours=3),
                    )
                    Message.objects.create(
                        ride_join=join,
                        sender=item["user_profile"],
                        body="Sure, see you there at the scheduled time!",
                        created_at=now - timedelta(hours=2),
                    )

        # ---- 6. Donations to populate Leaderboard & Charts ----
        for item in rider_records:
            rp = item["rider_profile"]
            target = item["config"]["target_donations"]
            remaining = target

            while remaining > 150:
                amount = min(remaining, random.choice([250, 500, 750, 1000, 1500]))
                remaining -= amount
                days_ago = random.randint(1, 120)
                donor = random.choice(passenger_records)
                charity_choice = random.choice([charity_pratham, charity_goonj])
                campaign_choice = campaign_edu if charity_choice == charity_pratham else campaign_relief

                don_date = now - timedelta(days=days_ago)

                Donation.objects.create(
                    donation_ref=f"DON-{uuid.uuid4().hex[:8].upper()}",
                    amount=amount,
                    rider=rp,
                    passenger=donor,
                    charity=charity_choice,
                    campaign=campaign_choice,
                    status="SUCCESS",
                    payment_method="UPI",
                    transaction_ref=f"UPI-{uuid.uuid4().hex[:8].upper()}",
                    donor_display_name_snapshot=donor.user.get_full_name(),
                    created_at=don_date,
                    completed_at=don_date,
                )

        # A couple of pending and refunded donations for admin test
        first_rp = rider_records[0]["rider_profile"]
        Donation.objects.create(
            donation_ref=f"DON-PENDING-001",
            amount=500,
            rider=first_rp,
            passenger=passenger_records[0],
            charity=charity_pratham,
            campaign=campaign_edu,
            status="PENDING",
            payment_method="UPI",
            donor_display_name_snapshot="Awaiting Confirmation",
            created_at=now - timedelta(hours=1),
        )

        # Seed reports and audit logs
        Report.objects.create(
            reporter=passenger_records[0],
            reported=rider_records[1]["user_profile"],
            reason="Driver was 20 minutes late without notice.",
            details="Seeded for admin workflow verification.",
            status="OPEN",
        )

        AuditLog.objects.create(
            actor=admin_profile,
            action="System seeded demo platform state",
            target_type="Platform",
            target_id="0",
        )

        self.stdout.write(self.style.SUCCESS("[OK] Backseat demo data successfully seeded!"))
        self.stdout.write("Admin: admin@backseat.app / Admin@123")
        self.stdout.write("Demo Rider: demo.rider@backseat.app / Demo@123 (#1 Ravi Kumar)")
        self.stdout.write("Demo Passenger: demo.passenger@backseat.app / Demo@123")
