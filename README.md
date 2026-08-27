# Backseat Django

A Python/Django conversion of the Backseat charity ride-sharing platform.

Backseat lets riders offer spare seats for free and lets passengers optionally support a registered charity after the ride. This branch keeps the same product areas as the original Next.js app: public pages, authentication, rider profiles, ride offers and requests, QR-linked donation flow, receipts, user dashboard, and admin overview pages.

## Stack

- **Framework:** Django + Django templates
- **Language:** Python
- **Database:** Django ORM with PostgreSQL via `psycopg`
- **Auth:** Django authentication and sessions
- **QR:** `qrcode[pil]`
- **Styling:** Tailwind utility classes with the original Backseat paper/ink/marigold theme, plus small static CSS helpers

## Getting started

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
createdb backseat
createuser backseat_app
psql -d backseat -c "ALTER USER backseat_app WITH PASSWORD 'change-me';"
copy .env.example .env
python manage.py migrate --run-syncdb
python manage.py seed_demo
python manage.py runserver
```

Open [http://localhost:8000](http://localhost:8000).

The app requires PostgreSQL. `DATABASE_URL` in `.env` must point to your local PostgreSQL database, for example:

```env
DATABASE_URL="postgresql://backseat_app:change-me@localhost:5432/backseat"
```

## Seeded accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@backseat.app` | `Admin@123` |
| Demo rider | `demo.rider@backseat.app` | `Demo@123` |
| Demo passenger | `demo.passenger@backseat.app` | `Demo@123` |

## Notes

- The UPI donation step is still simulated and must be replaced with a real payment gateway before production use.
- Legal, privacy, safety, and compliance copy remains starter material and should be reviewed before launch.
