# Backseat Admin Portal Features

## Overview Dashboard

The admin portal provides comprehensive platform monitoring and management capabilities.

### Key Statistics Displayed

**Real-time Platform Metrics:**
- **Total Users** - All registered users on the platform
- **Active Riders** - Verified riders ready to offer rides
- **Total Rides** - Completed ride offers (charity rides executed)
- **Total Raised** - Cumulative donation amount across all rides
- **People Helped** - Unique passengers who have completed rides
- **Today's Donations** - Donations collected in the current day
- **This Month's Donations** - Month-to-date donation total
- **Unverified Riders** - Riders pending vehicle verification

### Action Alerts

The overview displays immediate action items:
- **Pending Reports** - Shows count of open safety reports requiring review
- **Pending Verification** - Shows count of riders awaiting vehicle approval

## Admin Navigation Sidebar

Quick access tabs for all admin functions:

### 1. **Overview** (Default)
- Platform statistics dashboard
- Top 5 contributors leaderboard
- Action alerts for reports and verifications
- One-click navigation to management sections

### 2. **Users Management**
- View all registered users
- Display user name, email, and role
- Toggle user account blocks
- Track active/inactive status

### 3. **Riders & Verification**
- List all riders with vehicle information
- Vehicle make, model, plate number
- Verification status (Verified / Pending)
- Quick toggle to approve/revoke vehicle verification

### 4. **Ride Offers**
- Monitor all active and completed rides
- Route details (start location → destination)
- Rider information
- Cancel individual rides if needed

### 5. **Donations & Refunds**
- View all donation transactions
- Display reference number, amount, charity
- Track donation status (Pending / Success / Refunded)
- Refund individual donations if needed
- High-value donation flagging (>₹5000)

### 6. **Charities & Campaigns**
- Manage registered charity partners
- Edit charity details (name, UPI VPA, registration info)
- Create and modify campaigns
- Track beneficiaries and distribution amounts

### 7. **Verification** (Riders & Vehicles)
- Dedicated tab for rider verification workflow
- Batch approve/reject pending vehicle verifications
- View verification requirements

### 8. **Safety Reports**
- Review user-filed safety and community reports
- Track report status (Open / Reviewing / Resolved / Dismissed)
- View reporter and reported user information
- Report details and context

### 9. **Fraud & Suspicious Activity**
- Monitor high-value donations (>₹5000)
- Flag potential fraudulent transactions
- Review donation patterns
- Take refund action on suspicious transactions

### 10. **Leaderboard**
- View top verified riders by total donations
- Rank riders by charitable impact
- Toggle rider visibility on public leaderboard
- Hide/show riders from top contributors list

### 11. **Audit Log**
- Immutable transaction history
- Record of all admin actions
- Timestamp, actor (admin), action type, target
- Full compliance trail for auditing

### 12. **Chatbot Documents**
- Upload knowledge base documents for AI assistant
- Supported formats: TXT, MD, JSON, CSV, PDF, DOCX, XLSX, XLS
- Document management (upload, delete, re-index)
- View chunk counts and upload metadata
- Re-index all documents for optimization

## Admin Features by Action Type

### User Management
- ✅ Block/Unblock user accounts
- ✅ View user profile and registration date
- ✅ Track user engagement metrics

### Rider Management
- ✅ Verify rider vehicles
- ✅ Revoke vehicle verification
- ✅ Manage leaderboard visibility
- ✅ Track rider donations and impact
- ✅ View vehicle details and certification status

### Ride Management
- ✅ Cancel active rides
- ✅ Monitor ride statuses
- ✅ View route and rider information

### Donation Management
- ✅ Process refunds
- ✅ Track donation status
- ✅ Monitor fraud patterns
- ✅ View high-value transactions
- ✅ Charity routing confirmation

### Report Management
- ✅ Review safety reports
- ✅ Change report status
- ✅ View context and details
- ✅ Take moderation action

### Charity Management
- ✅ Add/edit charities
- ✅ Manage UPI payment details
- ✅ Update registration information
- ✅ Create campaigns
- ✅ Track distribution metrics

### Knowledge Base
- ✅ Upload documents for chatbot
- ✅ Delete documents
- ✅ Re-index for optimization
- ✅ Support multiple file formats

## Statistics Calculations

### Real-time Aggregations
All statistics are calculated in real-time from the database:

```python
# User stats
total_users = UserProfile.objects.count()
active_riders = RiderProfile.objects.filter(is_vehicle_verified=True).count()

# Ride stats
total_rides = RideJoin.objects.filter(status="COMPLETED").count()
people_helped = RideJoin.objects.filter(status__in=["ACCEPTED", "COMPLETED"]).values("passenger").distinct().count()

# Donation stats
total_donated = Donation.objects.filter(status="SUCCESS").aggregate(Sum("amount"))
today_donated = Donation.objects.filter(status="SUCCESS", created_at__date=today).aggregate(Sum("amount"))
month_donated = Donation.objects.filter(status="SUCCESS", created_at__date__gte=month_start).aggregate(Sum("amount"))

# Action items
open_reports = Report.objects.filter(status="OPEN").count()
pending_verification = RiderProfile.objects.filter(is_vehicle_verified=False).count()
```

## Top Contributors Leaderboard

### Ranking Algorithm
- Riders ranked by total charitable donations received
- Only verified riders eligible
- Riders can opt-out of public leaderboard display
- Updated in real-time as donations are recorded
- Shows top 5 contributors on overview dashboard

### Leaderboard Tab Features
- Full list of all verified riders with donation totals
- Individual toggle to hide/show each rider
- Rank position display
- Total donation amount per rider

## VitalitySoft Branding

The admin portal proudly displays VitalitySoft branding:
- **Footer Logo** - VitalitySoft logo with text "Crafted with care by"
- **Attribution** - Clear recognition of development team
- **Professional Presentation** - Polished UI with brand consistency

## Access Control

### Authentication Requirements
- Admin users only (role = "ADMIN")
- Redirects non-admin users to dashboard
- Requires active login session

### Security Features
- CSRF protection on all forms
- Audit logging of all admin actions
- Permission checks before each operation
- Immutable audit trail for compliance

## Performance Considerations

### Optimizations
- Database select_related() for reduced queries
- Prefetch_related() for related objects
- Indexed fields for fast filtering
- Pagination ready for large datasets

### Scalability
- Handles growing user base
- Efficient aggregation queries
- Real-time stat calculations without caching
- Supports multiple concurrent admins

## Future Enhancements

Potential features for future versions:
- Admin role granularity (permissions per action)
- Export functionality (CSV, PDF reports)
- Advanced filtering and search
- Dashboard customization
- Email notifications for action items
- Batch operations on multiple items
- Analytics dashboard with charts
- A/B testing controls
- Content moderation queue
