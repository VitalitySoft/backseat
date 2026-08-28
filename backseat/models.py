from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=40, unique=True, null=True, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    role = models.CharField(max_length=20, default="USER")
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    leaderboard_display = models.CharField(max_length=40, default="FIRST_NAME_INITIAL")
    is_blocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return self.user.get_full_name() or self.user.username

class RiderProfile(models.Model):
    user_profile = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name="rider_profile")
    vehicle_type = models.CharField(max_length=30)
    vehicle_make = models.CharField(max_length=80)
    vehicle_model = models.CharField(max_length=80)
    vehicle_plate = models.CharField(max_length=40)
    seats_available = models.PositiveIntegerField(default=1)
    is_vehicle_verified = models.BooleanField(default=False)
    is_sharing_active = models.BooleanField(default=False)
    hidden_from_leaderboard = models.BooleanField(default=False)
    charity_code = models.CharField(max_length=40, unique=True)
    bio = models.TextField(blank=True)
    member_since = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.user_profile} - {self.vehicle_make} {self.vehicle_model}"

class Charity(models.Model):
    name = models.CharField(max_length=160)
    registration_number = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    beneficiary_upi_vpa = models.CharField(max_length=160)
    beneficiary_name = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class Campaign(models.Model):
    charity = models.ForeignKey(Charity, on_delete=models.CASCADE, related_name="campaigns")
    name = models.CharField(max_length=160)
    description = models.TextField()
    goal_amount = models.FloatField(null=True, blank=True)
    amount_distributed = models.FloatField(default=0)
    beneficiaries_supported = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)

class RideOffer(models.Model):
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name="ride_offers")
    vehicle_type = models.CharField(max_length=30)
    seats_available = models.PositiveIntegerField()
    start_location = models.CharField(max_length=180)
    destination = models.CharField(max_length=180)
    departure_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=30, default="ACTIVE")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.start_location} to {self.destination}"

class RideJoin(models.Model):
    ride_offer = models.ForeignKey(RideOffer, on_delete=models.CASCADE, related_name="joins")
    passenger = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="ride_joins")
    status = models.CharField(max_length=30, default="REQUESTED")
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    ride_join = models.ForeignKey(RideJoin, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="messages_sent")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Donation(models.Model):
    donation_ref = models.CharField(max_length=40, unique=True)
    amount = models.FloatField()
    rider = models.ForeignKey(RiderProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="donations")
    passenger = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="donations_made")
    ride_join = models.ForeignKey(RideJoin, on_delete=models.SET_NULL, null=True, blank=True, related_name="donations")
    charity = models.ForeignKey(Charity, on_delete=models.PROTECT, related_name="donations")
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name="donations")
    status = models.CharField(max_length=30, default="PENDING")
    payment_method = models.CharField(max_length=30, default="UPI")
    transaction_ref = models.CharField(max_length=80, unique=True, null=True, blank=True)
    donor_display_name_snapshot = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

class Report(models.Model):
    reporter = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="reports_filed")
    reported = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="reports_against")
    reason = models.CharField(max_length=200)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=30, default="OPEN")
    created_at = models.DateTimeField(auto_now_add=True)

class Block(models.Model):
    blocker = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="blocks_made")
    blocked = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="blocks_against")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: constraints = [models.UniqueConstraint(fields=["blocker", "blocked"], name="unique_block_pair")]

class Notification(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=60)
    title = models.CharField(max_length=160)
    body = models.TextField()
    link = models.CharField(max_length=300, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    actor = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=160)
    target_type = models.CharField(max_length=80, blank=True)
    target_id = models.CharField(max_length=80, blank=True)
    metadata_json = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# status: NEW | REVIEWED | ADDED_TO_FAQ | DISMISSED
class ChatbotUnknownQuestion(models.Model):
    question = models.TextField()
    normalized_text = models.TextField()
    fallback_answer = models.TextField(blank=True)
    user_profile = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="chatbot_unknown_questions"
    )
    status = models.CharField(max_length=30, default="NEW")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.question[:80]


class ChatbotDocument(models.Model):
    file_name = models.CharField(max_length=260)
    content_type = models.CharField(max_length=120)
    content = models.TextField()
    uploaded_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="chatbot_documents"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.file_name


class ChatbotDocumentChunk(models.Model):
    document = models.ForeignKey(
        ChatbotDocument, on_delete=models.CASCADE, related_name="chunks"
    )
    content = models.TextField()
    position = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position"]
        indexes = [
            models.Index(fields=["document"]),
        ]

    def __str__(self):
        return f"Chunk {self.position} of {self.document.file_name}"
