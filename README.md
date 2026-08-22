# Backseat

A charity ride-sharing platform. If you're already travelling alone, offer your spare seat to
someone going the same way — for free. If they'd like to, they can support a registered charity
with a voluntary donation afterwards. Riders never set a fare; donation amounts are chosen
entirely by the passenger.

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion
- **Database:** Prisma + SQLite (dev)
- **Auth:** iron-session (encrypted cookie sessions)
- **Charts:** Recharts · **QR:** qrcode.react

## Getting started

```bash
npm install
cp .env.example .env      # then edit SESSION_SECRET etc.
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seeded accounts (password `Demo@123` / admin `Admin@123`)

| Role | Email |
|---|---|
| Admin | `admin@backseat.app` |
| Demo rider | `demo.rider@backseat.app` |
| Demo passenger | `demo.passenger@backseat.app` |

## Notes

- The donation payment step uses a UPI deep link with a **simulated** confirmation step in place
  of a live payment gateway — swap in real gateway credentials before processing real money.
- Legal/compliance copy (`/terms`, `/privacy`, `/disclaimers`) is a starting point and should be
  reviewed by qualified counsel before a real launch.
