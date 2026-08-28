export type ChatbotMessage = {
  role: "user" | "assistant";
  content: string;
};

type AppKnowledgeEntry = {
  keywords: string[];
  answer: string;
  links?: { label: string; href: string }[];
};

const FALLBACK_ANSWER =
  "I do not have a clear answer for that yet, but I have saved the question for review so the Backseat team can add it to the assistant.";

const APPLICATION_KNOWLEDGE: AppKnowledgeEntry[] = [
  {
    keywords: ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "howdy", "start"],
    answer:
      "Hello! Welcome to Backseat. I can help you with finding rides, offering rides, vehicle verification, voluntary charity donations, safety tools, and demo account access.",
    links: [{ label: "Find a Ride", href: "/find-a-ride" }, { label: "Offer a Ride", href: "/offer-a-ride" }],
  },
  {
    keywords: ["bye", "goodbye", "see you", "thank you", "thanks", "thank you so much", "exit"],
    answer:
      "Thank you for using Backseat! Wishing you safe, kind, and pleasant journeys. Feel free to reach out anytime if you need help.",
    links: [{ label: "Home", href: "/" }],
  },
  {
    keywords: ["how do i offer a ride", "offer a ride", "post a ride", "publish ride", "offer ride", "give a ride", "rider", "driver", "share seat"],
    answer:
      "To offer a ride on Backseat:\n1. Create a free account or log in.\n2. Register your vehicle under Become a Rider.\n3. Once our team verifies your vehicle, go to 'Offer a Ride'.\n4. Enter your pickup location, destination, departure time, and number of spare seats.\n5. When passengers request to join, you can accept them and connect via in-app chat.",
    links: [{ label: "Offer a Ride", href: "/offer-a-ride" }, { label: "Become a Rider", href: "/become-a-rider" }],
  },
  {
    keywords: ["how can i find a ride", "find a ride", "search ride", "look for ride", "find ride", "join ride", "request ride", "passenger", "need a ride"],
    answer:
      "To find and join a ride:\n1. Go to 'Find a Ride'.\n2. Enter your starting point and destination.\n3. Filter by vehicle type (Two-Wheeler or Four-Wheeler) if desired.\n4. Click 'View & Join' on any verified ride offer to send a join request.\n5. Once the rider accepts, you'll be notified and can view trip details in 'My Trips'.",
    links: [{ label: "Find a Ride", href: "/find-a-ride" }, { label: "My Trips", href: "/dashboard/my-trips" }],
  },
  {
    keywords: ["how do donations work", "donations", "donate", "charity", "upi", "qr code", "charity qr", "fare", "price", "is it free", "cost", "payment"],
    answer:
      "Every ride on Backseat is 100% free — riders can never charge a fare or booking fee.\n\nAfter a completed journey, passengers can voluntarily scan the rider's Charity QR code to make a direct donation to registered charity partners via UPI. 100% of donations go directly to the charity trust.",
    links: [{ label: "Charity Impact", href: "/charity-impact" }, { label: "Top Contributors", href: "/top-contributors" }],
  },
  {
    keywords: ["seeded accounts", "demo accounts", "test accounts", "sample accounts", "demo logins", "credentials", "login details", "passwords", "test users"],
    answer:
      "Here are the default demo accounts available on Backseat:\n\n• Admin: admin@backseat.app (Password: Admin@123)\n• Demo Rider: demo.rider@backseat.app (Password: Demo@123)\n• Demo Passenger: demo.passenger@backseat.app (Password: Demo@123)",
    links: [{ label: "Login", href: "/login" }],
  },
  {
    keywords: ["how to login", "login", "log in", "sign in", "signin", "authenticate", "access account"],
    answer:
      "You can log in to Backseat using your registered email and password. If you are an administrator, logging in will automatically direct you to the Admin Portal. If you are a passenger or rider, you'll be directed to your dashboard.",
    links: [{ label: "Login", href: "/login" }, { label: "Register", href: "/register" }],
  },
  {
    keywords: ["how to register", "register", "sign up", "signup", "create account", "new account", "join backseat"],
    answer:
      "To create an account:\n1. Click 'Get Started' or visit '/register'.\n2. Enter your full name, email address, optional phone number, and a secure password (min 8 characters).\n3. Click 'Create account' to instantly access your dashboard.",
    links: [{ label: "Register", href: "/register" }],
  },
  {
    keywords: ["safety", "sos", "emergency", "report", "block", "police", "help", "danger", "emergency number", "112"],
    answer:
      "Your safety is our top priority:\n• Verified Riders: Vehicles and plates are checked before ride sharing goes live.\n• SOS Button: Instantly alerts platform moderators with your trip context and connects to India Emergency (112).\n• User Controls: You can report or block users at any time from your trip and profile pages.",
    links: [{ label: "Safety & SOS", href: "/safety" }],
  },
  {
    keywords: ["admin", "admin portal", "verification queue", "fraud", "moderator", "manage platform"],
    answer:
      "The Admin Portal allows platform moderators to:\n• Verify rider vehicle details & license plates.\n• Review ride offers, bookings, and donation transactions.\n• Manage active charity partners & beneficiary UPI details.\n• Investigate automated fraud signals & user reports.\n• Upload and manage chatbot knowledge documents.",
    links: [{ label: "Admin Portal", href: "/admin" }],
  },
  {
    keywords: ["home", "homepage", "landing page", "main page", "start page"],
    answer:
      "The homepage introduces Backseat, shows live platform impact metrics, and provides quick navigation for finding rides, offering rides, and exploring charity contributions.",
    links: [{ label: "Home", href: "/" }],
  },
  {
    keywords: ["navigation", "menu", "navbar", "header", "footer", "where can i go", "pages"],
    answer:
      "The main navigation links to Find a Ride, Offer a Ride, How It Works, Charity Impact, Top Contributors, and About Us. After login, members access My Trips, My Rides, Donations, Payments, Impact, and Profile.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["how it works", "what is backseat", "about backseat", "carpooling", "ridesharing"],
    answer:
      "Backseat connects drivers and two-wheeler riders who have empty seats with passengers travelling in the same direction. Rides are free, safe, and community-driven, giving passengers the option to turn saved commute costs into charitable giving.",
    links: [{ label: "How It Works", href: "/how-it-works" }, { label: "About Us", href: "/about" }],
  },
];

const STOP_WORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "about", "this",
  "that", "these", "those", "am", "not", "no", "nor", "or", "but",
  "if", "then", "than", "too", "very", "just", "also", "now", "and",
  "so", "up", "out", "all", "any", "each", "every", "some", "such",
  "what", "which", "who", "whom", "how", "when", "where", "why",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function toStem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ing")) return word.slice(0, -3);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function computeScore(question: string, keywords: string[]) {
  const qWords = tokenize(question);
  const qStems = new Set(qWords.map(toStem));
  const qWordSet = new Set(qWords);
  let total = 0;
  let multi = 0;

  for (const keyword of keywords) {
    const parts = keyword.toLowerCase().trim().split(/\s+/).filter((part) => !STOP_WORDS.has(part));
    const matched = parts.length > 0 && parts.every((part) => qWordSet.has(part) || qStems.has(toStem(part)));
    if (matched) {
      total += parts.length > 1 ? 3 : 1;
      if (parts.length > 1) multi += 1;
    }
  }

  return { total, multi };
}

function findBestAppAnswer(question: string) {
  return APPLICATION_KNOWLEDGE.map((topic) => ({ topic, ...computeScore(question, topic.keywords) }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total || b.multi - a.multi)[0]?.topic ?? null;
}

export function answerBackseatQuestion(messages: ChatbotMessage[]) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (!latestQuestion.trim()) return { answer: FALLBACK_ANSWER, links: [], found: false, source: "fallback" as const };

  const appTopic = findBestAppAnswer(latestQuestion);
  return appTopic
    ? { answer: appTopic.answer, links: appTopic.links ?? [], found: true, source: "application" as const }
    : { answer: FALLBACK_ANSWER, links: [], found: false, source: "fallback" as const };
}
