import faqData from "./faq.json";

export type ChatbotMessage = {
  role: "user" | "assistant";
  content: string;
};

type FaqEntry = {
  keywords: string[];
  answer: string;
  links?: { label: string; href: string }[];
};

const TOPICS: FaqEntry[] = faqData as FaqEntry[];

const FALLBACK_ANSWER =
  'I can help with finding rides, offering rides, rider QR codes, donations, safety, accounts, and admin workflows. Try asking something like "How do I offer a ride?" or "How do donations work?"';

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
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function toStem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ing")) return word.slice(0, -3);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function extractMeaningfulWords(text: string): string[] {
  return tokenize(text).filter((w) => !STOP_WORDS.has(w));
}

function singleMatch(questionStems: Set<string>, questionWords: Set<string>, keyword: string): boolean {
  const stem = toStem(keyword);
  return questionWords.has(keyword) || questionStems.has(stem);
}

function multiMatch(questionStems: Set<string>, questionWords: Set<string>, keyword: string): boolean {
  const parts = keyword.split(/\s+/).filter((p) => !STOP_WORDS.has(p));
  if (parts.length === 0) return false;
  return parts.every((part) => singleMatch(questionStems, questionWords, part));
}

function computeScore(question: string, keywords: string[]): { total: number; multi: number } {
  const qWords = extractMeaningfulWords(question);
  const qStems = new Set(qWords.map(toStem));
  const qWordSet = new Set(qWords);

  let total = 0;
  let multi = 0;

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase().trim();
    const isMulti = kw.includes(" ");
    const matched = isMulti ? multiMatch(qStems, qWordSet, kw) : singleMatch(qStems, qWordSet, kw);
    if (matched) {
      total += isMulti ? 3 : 1;
      if (isMulti) multi += 1;
    }
  }

  return { total, multi };
}

export function answerBackseatQuestion(messages: ChatbotMessage[]) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";

  if (!latestQuestion.trim()) {
    return { answer: FALLBACK_ANSWER, links: [] };
  }

  const normalized = latestQuestion.toLowerCase().trim();

  // Exact-phrase high-priority intents that are hard to capture with token matching
  if (/how (does|it|do|to).*(work|works)/.test(normalized) && !/(donat|upi|qr|offer|find)/.test(normalized)) {
    const hi = TOPICS.find((t) => t.answer.startsWith("For riders:"));
    if (hi) {
      return { answer: hi.answer, links: hi.links ?? [] };
    }
  }

  // "who built this app" style questions
  if (/\b(built|developed|created|made|developed) by\b/.test(normalized) || /who built|by whom|which company/.test(normalized)) {
    const by = TOPICS.find((t) => t.answer.includes("VitalitySoft"));
    if (by) {
      return { answer: by.answer, links: by.links ?? [] };
    }
  }

  // Track per-topic score with the keywords that matched, to break ties by specificity
  const scoredTopics = TOPICS.map((topic) => {
    const { total, multi } = computeScore(normalized, topic.keywords);
    return { topic, total, multi };
  })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total || b.multi - a.multi);

  if (scoredTopics.length === 0) {
    return { answer: FALLBACK_ANSWER, links: [] };
  }

  const best = scoredTopics[0];
  const second = scoredTopics[1];

  const unique =
    !second ||
    best.total > second.total ||
    (best.total === second.total && best.multi > second.multi);

  if (!unique) {
    return { answer: FALLBACK_ANSWER, links: [] };
  }

  return {
    answer: best.topic.answer,
    links: best.topic.links ?? [],
  };
}
