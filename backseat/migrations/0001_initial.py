import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Charity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("registration_number", models.CharField(blank=True, max_length=100)),
                ("description", models.TextField()),
                ("beneficiary_upi_vpa", models.CharField(max_length=160)),
                ("beneficiary_name", models.CharField(max_length=160)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(blank=True, max_length=40, null=True, unique=True)),
                ("avatar_url", models.URLField(blank=True, max_length=500)),
                ("role", models.CharField(default="USER", max_length=20)),
                ("email_verified", models.BooleanField(default=False)),
                ("phone_verified", models.BooleanField(default=False)),
                ("leaderboard_display", models.CharField(default="FIRST_NAME_INITIAL", max_length=40)),
                ("is_blocked", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Campaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("description", models.TextField()),
                ("goal_amount", models.FloatField(blank=True, null=True)),
                ("amount_distributed", models.FloatField(default=0)),
                ("beneficiaries_supported", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("charity", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="campaigns", to="backseat.charity")),
            ],
        ),
        migrations.CreateModel(
            name="RiderProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vehicle_type", models.CharField(max_length=30)),
                ("vehicle_make", models.CharField(max_length=80)),
                ("vehicle_model", models.CharField(max_length=80)),
                ("vehicle_plate", models.CharField(max_length=40)),
                ("seats_available", models.PositiveIntegerField(default=1)),
                ("is_vehicle_verified", models.BooleanField(default=False)),
                ("is_sharing_active", models.BooleanField(default=False)),
                ("hidden_from_leaderboard", models.BooleanField(default=False)),
                ("charity_code", models.CharField(max_length=40, unique=True)),
                ("bio", models.TextField(blank=True)),
                ("member_since", models.DateTimeField(auto_now_add=True)),
                ("user_profile", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="rider_profile", to="backseat.userprofile")),
            ],
        ),
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(max_length=160)),
                ("target_type", models.CharField(blank=True, max_length=80)),
                ("target_id", models.CharField(blank=True, max_length=80)),
                ("metadata_json", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to="backseat.userprofile")),
            ],
        ),
        migrations.CreateModel(
            name="Block",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("blocked", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocks_against", to="backseat.userprofile")),
                ("blocker", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocks_made", to="backseat.userprofile")),
            ],
            options={"constraints": [models.UniqueConstraint(fields=("blocker", "blocked"), name="unique_block_pair")]},
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(max_length=60)),
                ("title", models.CharField(max_length=160)),
                ("body", models.TextField()),
                ("link", models.CharField(blank=True, max_length=300)),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user_profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="backseat.userprofile")),
            ],
        ),
        migrations.CreateModel(
            name="Report",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reason", models.CharField(max_length=200)),
                ("details", models.TextField(blank=True)),
                ("status", models.CharField(default="OPEN", max_length=30)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("reported", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reports_against", to="backseat.userprofile")),
                ("reporter", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reports_filed", to="backseat.userprofile")),
            ],
        ),
        migrations.CreateModel(
            name="RideOffer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vehicle_type", models.CharField(max_length=30)),
                ("seats_available", models.PositiveIntegerField()),
                ("start_location", models.CharField(max_length=180)),
                ("destination", models.CharField(max_length=180)),
                ("departure_at", models.DateTimeField(blank=True, null=True)),
                ("status", models.CharField(default="ACTIVE", max_length=30)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("rider", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ride_offers", to="backseat.riderprofile")),
            ],
        ),
        migrations.CreateModel(
            name="RideJoin",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(default="REQUESTED", max_length=30)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("passenger", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ride_joins", to="backseat.userprofile")),
                ("ride_offer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="joins", to="backseat.rideoffer")),
            ],
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("body", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("ride_join", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="backseat.ridejoin")),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages_sent", to="backseat.userprofile")),
            ],
        ),
        migrations.CreateModel(
            name="Donation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("donation_ref", models.CharField(max_length=40, unique=True)),
                ("amount", models.FloatField()),
                ("status", models.CharField(default="PENDING", max_length=30)),
                ("payment_method", models.CharField(default="UPI", max_length=30)),
                ("transaction_ref", models.CharField(blank=True, max_length=80, null=True, unique=True)),
                ("donor_display_name_snapshot", models.CharField(blank=True, max_length=160)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("campaign", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="donations", to="backseat.campaign")),
                ("charity", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="donations", to="backseat.charity")),
                ("passenger", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="donations_made", to="backseat.userprofile")),
                ("ride_join", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="donations", to="backseat.ridejoin")),
                ("rider", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="donations", to="backseat.riderprofile")),
            ],
        ),
    ]
