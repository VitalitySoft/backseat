import io, os, uuid
from datetime import datetime
from functools import wraps
from urllib.parse import quote
import qrcode
from flask import Blueprint, flash, redirect, render_template, request, send_file, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash
from .models import AuditLog, Campaign, Charity, Donation, Report, RideJoin, RideOffer, RiderProfile, User, db, seed_demo_data

bp = Blueprint('main', __name__)

def current_user():
    return db.session.get(User, session.get('user_id')) if session.get('user_id') else None

@bp.app_context_processor
def inject_globals():
    return {'current_user': current_user(), 'year': datetime.utcnow().year}

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user():
            flash('Please log in to continue.')
            return redirect(url_for('main.login'))
        return fn(*args, **kwargs)
    return wrapper

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user or user.role != 'ADMIN':
            flash('Admin access required.')
            return redirect(url_for('main.login'))
        return fn(*args, **kwargs)
    return wrapper

@bp.cli.command('init-db')
def init_db():
    db.create_all(); seed_demo_data(); print('Database initialized with demo data.')

@bp.route('/')
def home():
    total = db.session.query(db.func.coalesce(db.func.sum(Donation.amount), 0)).filter_by(status='SUCCESS').scalar()
    return render_template('home.html', total_donations=total, active_rides=RideOffer.query.filter_by(status='ACTIVE').count(), riders=RiderProfile.query.filter_by(is_sharing_active=True).count())

@bp.route('/about')
@bp.route('/how-it-works')
@bp.route('/safety')
@bp.route('/community-guidelines')
@bp.route('/terms')
@bp.route('/privacy')
@bp.route('/disclaimers')
@bp.route('/become-a-rider')
def static_page():
    pages = {
        'about': ('About Backseat', 'Backseat helps people share empty seats for free while giving passengers an optional way to support registered charities.'),
        'how-it-works': ('How it works', 'Riders publish spare-seat trips, passengers request a ride, and any donation after the trip is voluntary.'),
        'safety': ('Safety', 'Verified profiles, reporting, blocking, clear ride status, and community checks keep trust at the center.'),
        'community-guidelines': ('Community guidelines', 'Be respectful, do not set fares, keep routes accurate, and report unsafe behavior quickly.'),
        'terms': ('Terms', 'Backseat is a free seat-sharing coordination tool. Donation and legal copy should be reviewed before launch.'),
        'privacy': ('Privacy', 'Only collect the profile, ride, messaging, verification, and donation data needed to run the service.'),
        'disclaimers': ('Disclaimers', 'The donation confirmation flow is simulated and must be replaced before processing real payments.'),
        'become-a-rider': ('Become a rider', 'Create a rider profile, verify your vehicle details, and start sharing spare seats for free.'),
    }
    title, body = pages[request.path.strip('/')]
    return render_template('page.html', title=title, body=body)

@bp.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        email = request.form['email'].lower()
        if User.query.filter_by(email=email).first():
            flash('An account already exists for that email.'); return redirect('/register')
        user = User(name=request.form['name'], email=email, phone=request.form.get('phone'), password_hash=generate_password_hash(request.form['password']))
        db.session.add(user); db.session.commit(); session['user_id'] = user.id
        return redirect('/dashboard')
    return render_template('auth.html', mode='register')

@bp.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(email=request.form['email'].lower()).first()
        if not user or not check_password_hash(user.password_hash, request.form['password']):
            flash('Invalid email or password.'); return redirect('/login')
        session['user_id'] = user.id; return redirect('/dashboard')
    return render_template('auth.html', mode='login')

@bp.route('/logout', methods=['POST'])
def logout():
    session.clear(); return redirect('/')

@bp.route('/find-a-ride')
def find_a_ride():
    q = request.args.get('q', '')
    rides = RideOffer.query.filter_by(status='ACTIVE')
    if q:
        like = f'%{q}%'; rides = rides.filter(db.or_(RideOffer.start_location.ilike(like), RideOffer.destination.ilike(like)))
    return render_template('rides.html', rides=rides.all(), q=q)

@bp.route('/rides/<int:ride_id>', methods=['GET','POST'])
@login_required
def ride_detail(ride_id):
    ride = db.session.get(RideOffer, ride_id)
    if request.method == 'POST':
        db.session.add(RideJoin(ride_offer_id=ride.id, passenger_id=current_user().id, status='REQUESTED')); db.session.commit(); flash('Ride request sent.'); return redirect('/dashboard/my-trips')
    extra = f'<p>{ride.notes or "No notes provided."}</p><p>Rider: <a href="/rider/{ride.rider.id}">{ride.rider.user.name}</a></p><form method="post"><button class="button">Request this ride</button></form>'
    return render_template('page.html', title=f'{ride.start_location} to {ride.destination}', body='', extra=extra)

@bp.route('/offer-a-ride', methods=['GET','POST'])
@login_required
def offer_a_ride():
    user = current_user()
    if request.method == 'POST':
        profile = user.rider_profile or RiderProfile(user_id=user.id, charity_code=f'{user.name.split()[0].upper()}{uuid.uuid4().hex[:6]}', vehicle_type=request.form['vehicle_type'], vehicle_make=request.form['vehicle_make'], vehicle_model=request.form['vehicle_model'], vehicle_plate=request.form['vehicle_plate'])
        profile.seats_available = int(request.form['seats_available']); profile.is_sharing_active = True
        db.session.add(profile); db.session.flush()
        db.session.add(RideOffer(rider_id=profile.id, vehicle_type=profile.vehicle_type, seats_available=profile.seats_available, start_location=request.form['start_location'], destination=request.form['destination'], notes=request.form.get('notes')))
        db.session.commit(); flash('Ride offer published.'); return redirect('/dashboard/my-rides')
    form = '<form method="post" class="form"><label>Vehicle type<select name="vehicle_type"><option>FOUR_WHEELER</option><option>TWO_WHEELER</option></select></label><label>Make<input name="vehicle_make" required></label><label>Model<input name="vehicle_model" required></label><label>Plate<input name="vehicle_plate" required></label><label>Seats<input type="number" name="seats_available" min="1" value="1"></label><label>Start<input name="start_location" required></label><label>Destination<input name="destination" required></label><label>Notes<textarea name="notes"></textarea></label><button class="button">Publish ride</button></form>'
    return render_template('form.html', title='Offer a ride', form=form)

@bp.route('/rider/<int:rider_id>')
def rider_profile(rider_id):
    rider = db.session.get(RiderProfile, rider_id)
    extra = f'<p>{rider.bio or ""}</p><p>{rider.vehicle_make} {rider.vehicle_model} · {rider.seats_available} seats</p><img class="qr" src="/qr/{rider.charity_code}.png" alt="Donation QR"><p><a class="button" href="/donate/{rider.charity_code}">Donate to charity</a></p>'
    return render_template('page.html', title=rider.user.name, body='', extra=extra)

@bp.route('/donate/<code>', methods=['GET','POST'])
def donate(code):
    rider = RiderProfile.query.filter_by(charity_code=code).first_or_404(); charity = Charity.query.filter_by(is_active=True).first_or_404()
    if request.method == 'POST':
        donation = Donation(donation_ref=f'DON-{uuid.uuid4().hex[:8].upper()}', amount=float(request.form['amount']), rider_id=rider.id, passenger_id=session.get('user_id'), charity_id=charity.id, status='SUCCESS', transaction_ref=f'UPI-{uuid.uuid4().hex[:8].upper()}', donor_display_name_snapshot=request.form.get('display_name') or 'Anonymous', completed_at=datetime.utcnow())
        db.session.add(donation); db.session.commit(); return redirect(f'/donate/receipt/{donation.id}')
    upi = f"upi://pay?pa={quote(os.getenv('CHARITY_UPI_VPA', charity.beneficiary_upi_vpa))}&pn={quote(os.getenv('CHARITY_UPI_PAYEE_NAME', charity.beneficiary_name))}&cu=INR"
    form = f'<p>Donation for a ride shared by {rider.user.name}. Payment is simulated for demo use.</p><p><a href="{upi}" class="button secondary">Open UPI app</a></p><form method="post" class="form"><label>Amount<input type="number" name="amount" min="1" value="100"></label><label>Display name<input name="display_name" placeholder="Anonymous"></label><button class="button">Confirm donation</button></form>'
    return render_template('form.html', title=f'Support {charity.name}', form=form)

@bp.route('/donate/receipt/<int:donation_id>')
def receipt(donation_id):
    d = db.session.get(Donation, donation_id); return render_template('page.html', title=d.donation_ref, body=f'₹{d.amount:.0f} · {d.status} · {d.payment_method}', extra='<button class="button" onclick="window.print()">Print receipt</button>')

@bp.route('/qr/<code>.png')
def qr_png(code):
    img = qrcode.make(url_for('main.donate', code=code, _external=True)); buf = io.BytesIO(); img.save(buf, 'PNG'); buf.seek(0); return send_file(buf, mimetype='image/png')

@bp.route('/top-contributors')
@bp.route('/charity-impact')
def impact():
    donations = Donation.query.filter_by(status='SUCCESS').order_by(Donation.amount.desc()).all(); total = sum(d.amount for d in donations)
    cards = ''.join([f'<article><h3>{d.donor_display_name_snapshot or "Anonymous"}</h3><p>₹{d.amount:.0f} · {d.donation_ref}</p></article>' for d in donations])
    return render_template('page.html', title='Charity impact', body=f'₹{total:.0f} total successful donations recorded.', extra=f'<section class="grid">{cards}</section>')

@bp.route('/dashboard')
@login_required
def dashboard():
    user = current_user(); extra = '<div class="actions"><a class="button secondary" href="/dashboard/my-rides">My rides</a><a class="button secondary" href="/dashboard/my-trips">My trips</a><a class="button secondary" href="/dashboard/profile">Profile</a><a class="button secondary" href="/dashboard/qr">QR</a></div>'
    return render_template('page.html', title='Dashboard', body=f'Welcome, {user.name}.', extra=extra)

@bp.route('/dashboard/my-rides')
@bp.route('/dashboard/my-trips')
@bp.route('/dashboard/donations')
@bp.route('/dashboard/payments')
@bp.route('/dashboard/impact')
@bp.route('/dashboard/profile', methods=['GET','POST'])
@bp.route('/dashboard/qr')
@login_required
def dashboard_section():
    user = current_user(); path = request.path
    if path.endswith('/profile') and request.method == 'POST':
        user.name = request.form['name']; user.phone = request.form.get('phone'); db.session.commit(); flash('Profile updated.')
    if path.endswith('/profile'):
        form = f'<form method="post" class="form"><label>Name<input name="name" value="{user.name}"></label><label>Phone<input name="phone" value="{user.phone or ""}"></label><button class="button">Save</button></form>'; return render_template('form.html', title='Profile', form=form)
    if path.endswith('/qr'):
        p = user.rider_profile; extra = f'<img class="qr" src="/qr/{p.charity_code}.png"><p>/donate/{p.charity_code}</p>' if p else '<p>Create a rider profile first.</p>'; return render_template('page.html', title='Donation QR', body='', extra=extra)
    return render_template('page.html', title=path.rsplit('/',1)[-1].replace('-', ' ').title(), body='Your Backseat activity appears here.')

@bp.route('/admin')
@bp.route('/admin/users')
@bp.route('/admin/riders')
@bp.route('/admin/rides')
@bp.route('/admin/donations')
@bp.route('/admin/reports')
@bp.route('/admin/verification')
@bp.route('/admin/fraud')
@bp.route('/admin/leaderboard')
@bp.route('/admin/audit-log')
@bp.route('/admin/charities')
@admin_required
def admin():
    stats = {'users': User.query.count(), 'riders': RiderProfile.query.count(), 'rides': RideOffer.query.count(), 'donations': Donation.query.count(), 'reports': Report.query.count(), 'audits': AuditLog.query.order_by(AuditLog.created_at.desc()).limit(20).all()}
    return render_template('admin.html', stats=stats, users=User.query.all(), rides=RideOffer.query.all(), donations=Donation.query.all(), charities=Charity.query.all())
