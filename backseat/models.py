from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    phone = db.Column(db.String(40), unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(500))
    role = db.Column(db.String(20), default='USER')
    email_verified = db.Column(db.Boolean, default=False)
    phone_verified = db.Column(db.Boolean, default=False)
    leaderboard_display = db.Column(db.String(40), default='FIRST_NAME_INITIAL')
    is_blocked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    rider_profile = db.relationship('RiderProfile', back_populates='user', uselist=False)

class RiderProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    vehicle_type = db.Column(db.String(30), nullable=False)
    vehicle_make = db.Column(db.String(80), nullable=False)
    vehicle_model = db.Column(db.String(80), nullable=False)
    vehicle_plate = db.Column(db.String(40), nullable=False)
    seats_available = db.Column(db.Integer, default=1)
    is_vehicle_verified = db.Column(db.Boolean, default=False)
    is_sharing_active = db.Column(db.Boolean, default=False)
    hidden_from_leaderboard = db.Column(db.Boolean, default=False)
    charity_code = db.Column(db.String(40), unique=True, nullable=False)
    bio = db.Column(db.Text)
    member_since = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', back_populates='rider_profile')
    ride_offers = db.relationship('RideOffer', back_populates='rider')

class Charity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    registration_number = db.Column(db.String(100))
    description = db.Column(db.Text, nullable=False)
    beneficiary_upi_vpa = db.Column(db.String(160), nullable=False)
    beneficiary_name = db.Column(db.String(160), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    charity_id = db.Column(db.Integer, db.ForeignKey('charity.id'), nullable=False)
    name = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    goal_amount = db.Column(db.Float)
    amount_distributed = db.Column(db.Float, default=0)
    beneficiaries_supported = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    charity = db.relationship('Charity', backref='campaigns')

class RideOffer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rider_id = db.Column(db.Integer, db.ForeignKey('rider_profile.id'), nullable=False)
    vehicle_type = db.Column(db.String(30), nullable=False)
    seats_available = db.Column(db.Integer, nullable=False)
    start_location = db.Column(db.String(180), nullable=False)
    destination = db.Column(db.String(180), nullable=False)
    departure_at = db.Column(db.DateTime)
    status = db.Column(db.String(30), default='ACTIVE')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    rider = db.relationship('RiderProfile', back_populates='ride_offers')

class RideJoin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ride_offer_id = db.Column(db.Integer, db.ForeignKey('ride_offer.id'), nullable=False)
    passenger_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(30), default='REQUESTED')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ride_offer = db.relationship('RideOffer', backref='joins')
    passenger = db.relationship('User', backref='ride_joins')

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ride_join_id = db.Column(db.Integer, db.ForeignKey('ride_join.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    donation_ref = db.Column(db.String(40), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    rider_id = db.Column(db.Integer, db.ForeignKey('rider_profile.id'))
    passenger_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    ride_join_id = db.Column(db.Integer, db.ForeignKey('ride_join.id'))
    charity_id = db.Column(db.Integer, db.ForeignKey('charity.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'))
    status = db.Column(db.String(30), default='PENDING')
    payment_method = db.Column(db.String(30), default='UPI')
    transaction_ref = db.Column(db.String(80), unique=True)
    donor_display_name_snapshot = db.Column(db.String(160))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reported_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.String(200), nullable=False)
    details = db.Column(db.Text)
    status = db.Column(db.String(30), default='OPEN')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Block(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    blocked_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(60), nullable=False)
    title = db.Column(db.String(160), nullable=False)
    body = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(300))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    action = db.Column(db.String(160), nullable=False)
    target_type = db.Column(db.String(80))
    target_id = db.Column(db.String(80))
    metadata = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def seed_demo_data():
    if User.query.first():
        return
    admin = User(name='Backseat Admin', email='admin@backseat.app', role='ADMIN', password_hash=generate_password_hash('Admin@123'), email_verified=True)
    rider_user = User(name='Aarav Rider', email='demo.rider@backseat.app', phone='+919900001111', password_hash=generate_password_hash('Demo@123'), email_verified=True, phone_verified=True)
    passenger = User(name='Mira Passenger', email='demo.passenger@backseat.app', phone='+919900002222', password_hash=generate_password_hash('Demo@123'), email_verified=True)
    db.session.add_all([admin, rider_user, passenger]); db.session.flush()
    charity = Charity(name='Backseat Charitable Trust', registration_number='BCT-2026', description='Supporting verified local causes through voluntary ride-linked donations.', beneficiary_upi_vpa='backseat.charity@upi', beneficiary_name='Backseat Charitable Trust')
    db.session.add(charity); db.session.flush()
    campaign = Campaign(charity_id=charity.id, name='Meals for Children', description='Funding nutritious meals for children after school.', goal_amount=50000, amount_distributed=12400, beneficiaries_supported=248)
    profile = RiderProfile(user_id=rider_user.id, vehicle_type='FOUR_WHEELER', vehicle_make='Hyundai', vehicle_model='i20', vehicle_plate='KA 01 AB 2026', seats_available=2, is_vehicle_verified=True, is_sharing_active=True, charity_code='AARAV2026', bio='Daily commuter happy to share a spare seat.')
    db.session.add_all([campaign, profile]); db.session.flush()
    ride = RideOffer(rider_id=profile.id, vehicle_type=profile.vehicle_type, seats_available=2, start_location='Indiranagar', destination='Electronic City', status='ACTIVE', notes='Office route, weekday mornings.')
    db.session.add(ride); db.session.flush()
    db.session.add(Donation(donation_ref='DON-DEMO-001', amount=250, rider_id=profile.id, passenger_id=passenger.id, charity_id=charity.id, campaign_id=campaign.id, status='SUCCESS', transaction_ref='UPI-DEMO-001', donor_display_name_snapshot='Mira P.', completed_at=datetime.utcnow()))
    db.session.commit()
