export type ChatbotMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatbotTopic = {
  keywords: string[];
  answer: string;
  links?: { label: string; href: string }[];
};

const TOPICS: ChatbotTopic[] = [
  {
    keywords: ["find", "search", "passenger", "join", "book", "available rides"],
    answer:
      "You can search available rides by pickup, destination, date, and seats. Open a ride, review the rider details, then send a join request. The rider can accept or decline the request from their dashboard.",
    links: [{ label: "Find a Ride", href: "/find-a-ride" }],
  },
  {
    keywords: ["offer", "driver", "rider", "publish", "vehicle", "seat", "offer a ride"],
    answer:
      "To offer a ride, create an account, add your vehicle details, and publish your route with available seats. Backseat rides are free; riders do not set fares.",
    links: [
      { label: "Offer a Ride", href: "/offer-a-ride" },
      { label: "Become a Rider", href: "/become-a-rider" },
    ],
  },
  {
    keywords: ["donate", "donation", "upi", "charity", "payment", "receipt"],
    answer:
      "Donations are voluntary and chosen by the passenger after the ride. The current demo flow uses a UPI deep link and simulated confirmation, so real payment gateway credentials should be added before production use.",
    links: [{ label: "Charity Impact", href: "/charity-impact" }],
  },
  {
    keywords: ["safe", "safety", "sos", "report", "block", "trust"],
    answer:
      "Backseat includes rider profiles, reporting, blocking, SOS access, and admin review workflows. For a safe trip, review the rider details, share your trip, and report any suspicious behavior.",
    links: [
      { label: "Safety", href: "/safety" },
      { label: "Community Guidelines", href: "/community-guidelines" },
    ],
  },
  {
    keywords: ["qr", "code", "scan", "rider profile"],
    answer:
      "Verified riders can use a charity QR page from their dashboard. Passengers can scan the rider QR to open the donation flow tied to that rider.",
    links: [{ label: "Dashboard QR", href: "/dashboard/qr" }],
  },
  {
    keywords: ["login", "register", "account", "password", "profile"],
    answer:
      "Create an account from Register, then use Login to access your dashboard. From the dashboard you can manage profile details, vehicle information, rides, trips, and donations.",
    links: [
      { label: "Login", href: "/login" },
      { label: "Register", href: "/register" },
    ],
  },
  {
    keywords: ["admin", "approve", "verify", "fraud", "dashboard", "manage"],
    answer:
      "Admins can review users, riders, rides, donations, reports, fraud signals, charities, campaigns, audit logs, and leaderboard visibility from the admin portal.",
    links: [{ label: "Admin Portal", href: "/admin" }],
  },
  {
    keywords: ["fare", "price", "charge", "cost", "free"],
    answer:
      "Backseat rides are not fare-based. A rider offers an empty seat for free, and a passenger may optionally donate any amount to charity after the ride.",
    links: [{ label: "How It Works", href: "/how-it-works" }],
  },
];

const FALLBACK_ANSWER =
  'I can help with finding rides, offering rides, rider QR codes, donations, safety, accounts, and admin workflows. Try asking something like "How do I offer a ride?" or "How do donations work?"';

export function answerBackseatQuestion(messages: ChatbotMessage[]) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const normalized = latestQuestion.toLowerCase();
  const scoredTopics = TOPICS.map((topic) => ({
    topic,
    score: topic.keywords.reduce((score, keyword) => score + (normalized.includes(keyword) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score);

  const match = scoredTopics[0];
  if (!latestQuestion.trim()) {
    return { answer: FALLBACK_ANSWER, links: [] };
  }

  if (!match || match.score === 0) {
    return { answer: FALLBACK_ANSWER, links: [] };
  }

  return {
    answer: match.topic.answer,
    links: match.topic.links ?? [],
  };
}
