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

## Chatbot Knowledge Base & Document Formats

Admins can upload functional documents to enhance the chatbot's answers via the Admin Portal at `/admin/chatbot-documents`. The system automatically parses, chunks, and indexes documents into searchable semantic units.

**Supported File Formats:** `.json`, `.md`, `.markdown`, `.csv`, `.txt`, `.docx`, `.pdf`, `.xlsx`, `.xls`  
**Max File Size:** 5 MB

---

### 1. JSON (`.json`) — Recommended for Rich Q&A with Links

JSON is best for structured knowledge and interactive chat buttons.

```json
[
  {
    "keywords": ["about backseat", "what is backseat", "platform", "charity ride sharing"],
    "question": "What is Backseat?",
    "answer": "Backseat is a charity ride-sharing platform. Riders offer spare seats freely, and passengers can optionally make voluntary donations to registered charities.",
    "links": [
      { "label": "About Backseat", "href": "/about" },
      { "label": "How It Works", "href": "/how-it-works" }
    ]
  },
  {
    "keywords": ["find ride", "search rides", "book ride"],
    "question": "How do I find a ride?",
    "answer": "Go to the Find a Ride page, enter your pickup location, destination, and vehicle preference to view available verified rides.",
    "links": [
      { "label": "Find a Ride", "href": "/find-a-ride" }
    ]
  }
]
```

*Nested section objects are also supported (e.g. `{ "faqs": [...], "policies": { ... } }`).*

---

### 2. Markdown (`.md`, `.markdown`)

Use Markdown headings (`#`, `##`, `###`) to separate sections. Markdown tables and bullet lists are automatically formatted.

```markdown
# Backseat Functional Guide

## How to Offer a Ride
Riders with verified vehicles can offer a ride by specifying the start location, destination, departure time, and available spare seats.

## Voluntary Donations
Passengers may voluntarily scan the rider's charity QR code after a completed ride to donate directly to registered partner charities via UPI. Riders never receive cash or fares.
```

---

### 3. CSV & Spreadsheets (`.csv`, `.xlsx`, `.xls`)

Include column headers on the first row. You can use standard `Question,Answer` headers or general tabular columns.

```csv
Question,Answer
"How do I register?","Click Sign Up on the top navigation bar and enter your name, email, and password."
"What is the SOS button?","The SOS button alerts admins and connects you immediately to emergency services (112)."
```

---

### 4. Plain Text (`.txt`)

Separate topics or Q&A pairs using double line breaks (`\n\n`) or standard `Q:` / `Question:` prefixes.

```text
Q: How do vehicle verifications work?
A: An admin reviews vehicle registration details, plate number, and driver credentials before approving ride offers.

Q: Can riders set fares?
A: No. Backseat is 100% fare-free. All rider seats are shared freely, and any optional contribution goes directly to charity.
```

---

### 5. Word (`.docx`) & PDF (`.pdf`)

Upload policy handbooks, user manuals, or FAQ documents. Text and headings are extracted and chunked automatically.

---

## Notes

- The donation payment step uses a UPI deep link with a **simulated** confirmation step in place
  of a live payment gateway — swap in real gateway credentials before processing real money.
- Legal/compliance copy (`/terms`, `/privacy`, `/disclaimers`) is a starting point and should be
  reviewed by qualified counsel before a real launch.

