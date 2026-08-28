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
    keywords: ["home", "homepage", "landing page", "main page", "start page"],
    answer:
      "The homepage introduces Backseat, shows live platform stats, explains that rides are free, and points people toward finding a ride, offering a ride, and learning how donations work.",
    links: [{ label: "Home", href: "/" }],
  },
  {
    keywords: ["navigation", "menu", "navbar", "header", "footer", "where can i go", "pages"],
    answer:
      "The main navigation links to Find a Ride, Offer a Ride, How It Works, Charity Impact, Top Contributors, and About Us. After login, users also get dashboard links for trips, rides, donations, payments, impact, profile, and QR tools.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["application flow", "app flow", "user flow", "workflow", "process in app", "full flow"],
    answer:
      "Backseat has two main flows. Passengers register, search for a matching route, send a join request, travel if accepted, then may donate voluntarily through the rider charity QR. Riders create a profile, submit vehicle details for admin verification, offer rides, manage join requests, and show their charity QR after a completed trip.",
    links: [{ label: "Find a Ride", href: "/find-a-ride" }, { label: "Offer a Ride", href: "/offer-a-ride" }],
  },
  {
    keywords: ["roles", "user roles", "passenger", "rider", "admin", "who can use"],
    answer:
      "The app supports passengers, riders, and admins. Passengers find rides, request seats, chat, donate, and manage trips. Riders offer verified rides, manage requests, maintain a charity QR, and track impact. Admins verify riders and vehicles, manage users, charities, rides, donations, reports, fraud flags, leaderboards, and audit logs.",
    links: [{ label: "Admin Portal", href: "/admin" }],
  },
  {
    keywords: ["features", "functionality", "what features", "modules", "what can app do"],
    answer:
      "Backseat includes registration, login, rider onboarding, vehicle verification, ride search, ride offers, join requests, ride chat, notifications, charity QR donations, receipts, impact tracking, payment history, rider profiles, reports, blocks, SOS alerts, leaderboard controls, and admin tools.",
    links: [{ label: "Safety Centre", href: "/safety" }],
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
