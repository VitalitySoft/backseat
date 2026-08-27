# Backseat Python

A Python/Flask conversion of the Backseat charity ride-sharing platform.

Backseat lets riders offer spare seats for free and lets passengers optionally support a registered charity after the ride. This branch keeps the same product areas as the original Next.js app: public pages, authentication, rider profiles, ride offers and requests, QR-linked donation flow, receipts, user dashboard, and admin overview pages.

## Stack

- **Framework:** Flask + Jinja templates
- **Language:** Python
- **Database:** SQLAlchemy with PostgreSQL via `psycopg`
- **Migrations:** Flask-Migrate / Alembic
- **Auth:** Flask signed-cookie session with Werkzeug password hashing
- **QR:** `qrcode[pil]`
- **Styling:** Custom CSS in `backseat/static/styles.css`

## Getting started

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask --app run.py init-db
flask --app run.py run
```

Open [http://localhost:5000](http://localhost:5000).

## Seeded accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@backseat.app` | `Admin@123` |
| Demo rider | `demo.rider@backseat.app` | `Demo@123` |
| Demo passenger | `demo.passenger@backseat.app` | `Demo@123` |

## Notes

- The UPI donation step is still simulated and must be replaced with a real payment gateway before production use.
- Legal, privacy, safety, and compliance copy remains starter material and should be reviewed before launch.
