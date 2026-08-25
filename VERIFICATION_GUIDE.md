# Backseat — Manual Verification Guide

Server: **http://localhost:3000**

Login details (all seeded accounts use password `Demo@123`, admin uses `Admin@123`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@backseat.app` | `Admin@123` |
| Demo rider (Ravi Kumar, #1 on leaderboard) | `demo.rider@backseat.app` | `Demo@123` |
| Demo passenger | `demo.passenger@backseat.app` | `Demo@123` |
| Other seeded riders | `suresh@example.com`, `priya@example.com`, `anil@example.com`, `meena@example.com` | `Demo@123` |

If the server isn't running, start it with `npm run dev` from the project folder, or ask me to restart it.

---

## 1. Public pages (no login needed)

1. Open `/` — hero loads, "Offer a Ride" / "Find a Ride" buttons, animated impact counters, leaderboard preview, "How it works" steps.
2. Open `/how-it-works`, `/charity-impact`, `/top-contributors`, `/about`, `/safety`, `/community-guidelines`, `/terms`, `/privacy`, `/disclaimers` — each should load without errors.
3. Open `/find-a-ride` — you should see 5 active ride cards (Bengaluru, Mumbai, Delhi, Hyderabad, Chennai routes). Try the search box (From/To/vehicle type filter).

## 2. Register a brand-new account

1. Go to `/register`, sign up with any email/password (8+ chars).
2. You should land on `/dashboard` as a **passenger** (no rider profile yet) — it shows "Rides joined", "Total donated", and a "Become a Charity Rider" prompt.
3. Log out (avatar menu, top right) and log back in with the same credentials at `/login` to confirm the account persisted.

## 3. Become a rider and offer a ride

1. Log in as a fresh account (or use one you just registered).
2. Click **Become a Charity Rider** → fill in vehicle type, make, model, plate, seats → submit.
3. Notice: there is **no field anywhere to set a fare, price, or fee** — that's intentional.
4. You'll land on `/dashboard`. Your vehicle starts **unverified** — sharing/QR stay off until an admin verifies you (step 6 below).
5. Go to `/offer-a-ride` and try publishing a ride — it should block with "vehicle must be verified" until verified.

## 4. Log in as the demo rider (already verified)

1. Log out, log in as `demo.rider@backseat.app` / `Demo@123`.
2. `/dashboard` — check the 6 stat cards (Rides offered, People helped, Total donations, Charity impact, Current ride status, Top contributor rank = **#1**) and the donation history chart (toggle Day/Week/Month/Year).
3. `/dashboard/my-rides` — see the active ride, its 2 requests; try **Accept**/**Decline** on the pending one.
4. `/dashboard/qr` — a large QR code should render, pointing to a `/donate/BS-xxxxxxxx` link. Try **Copy link**.
5. `/dashboard/donations` — list of past donations received.
6. `/dashboard/profile` — change your leaderboard display preference (full name / initial / anonymous) and save; check it reflects on `/top-contributors` after saving.

## 5. Full donation flow (the core feature)

1. While **not** logged in (or logged in as a passenger), open the rider's QR link from step 4.4 — e.g. `/donate/BS-xxxxxxxx`.
2. Read the framing: *"Your ride was offered freely... contribute any amount you wish."* — no minimum, no suggested/mandatory amount.
3. Tap a quick amount (₹50/₹100/₹250/₹500) or type any custom amount → **Continue to Payment**.
4. You'll see a **Pay via UPI App** button (a real `upi://pay...` deep link pointing at the *charity's* account, never the rider's) and an **"I've completed this payment"** confirmation button (this stands in for a real payment gateway webhook, since no live UPI merchant account is connected).
5. Click **I've completed this payment** → you land on a receipt page: amount, receipt ID, transaction ID, date/time, charity, campaign, status "Successful", plus Download/Print and Share buttons.
6. Go back to `/top-contributors` or the rider's `/dashboard` — the new donation should now be reflected in their total.

## 6. Find a ride and join one

1. Log in as a passenger account (e.g. `demo.passenger@backseat.app`).
2. `/find-a-ride` → open any ride → **Request to Join**.
3. Log in as that ride's rider → `/dashboard/my-rides` → **Accept** the request, then **Mark travelled** once accepted.
4. Log back in as the passenger → `/dashboard/my-trips` → the completed ride shows a **"Support this rider's charity"** button, linking into the donation flow from step 5.

## 7. Admin portal

1. Log in as `admin@backseat.app` / `Admin@123` → go to `/admin`.
2. **Overview** — platform-wide stats (total users, active riders, today's/month's donations, top contributors).
3. **Users** — block/unblock any non-admin user (confirmation dialog will pop up — click OK).
4. **Riders & Vehicles** / **Verification** — verify or hide a rider from the public leaderboard.
5. **Ride Offers** — force-cancel a ride.
6. **Donations** — mark a successful donation as refunded, and confirm it disappears from `/top-contributors` afterwards.
7. **Charities & Campaigns** — this is the *only* place the donation beneficiary UPI ID can be edited (riders never have access to this).
8. **Fraud & Suspicious** — heuristic flags for high-value or rapid repeat donations.
9. **Leaderboard** — same hide/show control as the riders page.
10. **Audit Log** — every admin action you just took should appear here with a timestamp.

## 8. Safety features

1. On any rider's public profile (`/rider/[id]`, reachable from the leaderboard), try **Report this user** and **Block**.
2. On `/safety`, try the **SOS** button — it logs an alert to the admin team and shows India's emergency number (112) as a real fallback; it does not pretend to dispatch real help.

## 9. Mobile check

1. Shrink your browser window to phone width (or open dev tools device toolbar, ~375px).
2. Confirm the bottom navigation bar appears (Home / Find / QR / Dashboard / Profile for riders), the hamburger menu works on the top nav, and pages don't overflow horizontally.

---

### What to expect vs. what's simulated

- **Real and enforced:** account auth, ride matching, donation amount always chosen by the passenger, donations always routed to the charity's UPI ID (never the rider's), leaderboard/stats excluding failed or refunded donations, full admin audit trail.
- **Simulated (by design, since there's no live payment gateway account):** the UPI payment confirmation step — real money never moves; clicking "I've completed this payment" is what a signed gateway webhook would normally do.