from django.contrib import admin
from .models import AuditLog, Campaign, Charity, Donation, Report, RideJoin, RideOffer, RiderProfile, UserProfile

admin.site.register([UserProfile, RiderProfile, Charity, Campaign, RideOffer, RideJoin, Donation, Report, AuditLog])
