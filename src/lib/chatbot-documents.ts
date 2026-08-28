import { prisma } from "@/lib/prisma";

const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
  "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her",
  "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs",
  "themselves", "what", "which", "who", "whom", "this", "that", "these", "those",
  "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if",
  "or", "because", "as", "until", "while", "of", "at", "by", "for", "with",
  "about", "against", "between", "into", "through", "during", "before", "after",
  "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over",
  "under", "again", "further", "then", "once", "here", "there", "when", "where",
  "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
  "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "s", "t", "can", "will", "just", "don", "should", "now",
]);

export function normalizeWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("ing")) return w.slice(0, -3);
  if (w.endsWith("ed")) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

export function extractPhrases(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const phrases: string[] = [];

  for (let i = 0; i < words.length; i += 1) {
    if (i + 1 < words.length) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
    if (i + 2 < words.length) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  return phrases;
}

type StructuredKnowledgeItem = {
  keywords?: string[] | string;
  question?: string;
  topic?: string;
  title?: string;
  answer?: string;
  content?: string;
  description?: string;
  text?: string;
  links?: { label: string; href: string }[];
  [key: string]: unknown;
};

/**
 * Parses JSON content into logical string chunks.
 */
function chunkJsonContent(jsonStr: string): string[] {
  try {
    const data = JSON.parse(jsonStr);

    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return JSON.stringify(item);
          }
          return String(item).trim();
        })
        .filter(Boolean);
    }

    if (typeof data === "object" && data !== null) {
      const chunks: string[] = [];

      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "object" && item !== null) {
              chunks.push(JSON.stringify({ section: key, ...item }));
            } else {
              chunks.push(`### ${key}\n${String(item)}`);
            }
          }
        } else if (typeof value === "object" && value !== null) {
          chunks.push(JSON.stringify({ section: key, ...value }));
        } else {
          chunks.push(`### ${key}\n${String(value)}`);
        }
      }

      if (chunks.length > 0) return chunks;
    }
  } catch {
    // If not valid JSON, fallback to text chunking
  }

  return [];
}

/**
 * Splits CSV content into row-based chunks.
 */
function chunkCsvContent(csvStr: string): string[] {
  const lines = csvStr.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return lines;

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
  const chunks: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
    const rowDetails = headers
      .map((header, idx) => `${header}: ${values[idx] ?? ""}`)
      .filter((line) => !line.endsWith(": "))
      .join("\n");

    if (rowDetails) {
      chunks.push(rowDetails);
    }
  }

  return chunks.length > 0 ? chunks : lines;
}

function chunkMarkdownContent(mdStr: string): string[] {
  const normalized = mdStr.replace(/\r\n/g, "\n").trim();
  const sections = normalized.split(/\n(?=#{1,6}\s+)/).map((s) => s.trim()).filter(Boolean);
  if (sections.length === 0) return [];

  const chunks: string[] = [];
  let docTitle = "";

  for (let i = 0; i < sections.length; i += 1) {
    const sec = sections[i];
    const lines = sec.split("\n").map((l) => l.trim()).filter(Boolean);
    // If the very first section is just a document title (e.g. # Backseat Functional Document) with no body
    if (lines.length === 1 && lines[0].startsWith("#") && sections.length > 1 && i === 0) {
      docTitle = lines[0].replace(/^#+\s*/, "").trim();
      continue;
    }
    chunks.push(sec);
  }

  return chunks.length > 0 ? chunks : [normalized];
}

/**
 * Splits text/markdown into structured chunks.
 */
export function splitDocumentIntoChunks(content: string, fileName?: string): string[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const ext = fileName?.split(".").pop()?.toLowerCase() ?? "";

  // 1. JSON parsing
  if (ext === "json" || normalized.startsWith("[") || normalized.startsWith("{")) {
    const jsonChunks = chunkJsonContent(normalized);
    if (jsonChunks.length > 0) return jsonChunks;
  }

  // 2. CSV parsing
  if (ext === "csv" && normalized.includes(",")) {
    const csvChunks = chunkCsvContent(normalized);
    if (csvChunks.length > 0) return csvChunks;
  }

  // 3. Markdown / Heading document chunking
  if (ext === "md" || ext === "markdown" || normalized.includes("# ")) {
    const mdChunks = chunkMarkdownContent(normalized);
    if (mdChunks.length > 0) return mdChunks;
  }

  // 4. Q&A pattern split (e.g. Q: ... or Question: ...)
  const qaSections = normalized.split(/\n(?=(?:Q|Question|FAQ)\s*[:#\d.-])/i).map((part) => part.trim()).filter(Boolean);
  if (qaSections.length > 1) {
    return qaSections;
  }

  // 5. Paragraph split
  const paragraphs = normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    return paragraphs;
  }

  // 6. Sentence/size chunking for very long unbroken documents
  if (normalized.length > 1000) {
    const sentences = normalized.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + " " + sentence).trim().length > 800) {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk = (currentChunk + " " + sentence).trim();
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    if (chunks.length > 1) return chunks;
  }

  return [normalized];
}

function cleanInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\x60([^\x60]+)\x60/g, "$1")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .trim();
}

function formatMarkdownTable(lines: string[]): string[] {
  const rows = lines
    .map((line) => line.trim())
    .filter((line) => /^\|.*\|$/.test(line))
    .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/.test(line))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cleanInlineMarkdown(cell)));
  const [header, ...body] = rows;
  if (!header || body.length === 0) return [];
  return body.map((row) => row.map((cell, index) => (header[index] ?? "Column " + (index + 1)) + ": " + cell).join("\n"));
}

export function formatDocumentContent(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (/^\|.*\|$/.test(line)) {
      const tableLines: string[] = [];
      while (index < lines.length && /^\|.*\|$/.test(lines[index].trim())) {
        tableLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      output.push(...formatMarkdownTable(tableLines));
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      output.push(cleanInlineMarkdown(heading[1]));
      continue;
    }

    output.push(cleanInlineMarkdown(line.replace(/^[-*+]\s+/, "")));
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

type ExtractedAnswer = {
  answer: string;
  links: { label: string; href: string }[];
  score: number;
};

/**
 * Computes match score and extracts clean answer & links from a single structured item.
 */
function scoreAndExtractStructuredItem(
  item: StructuredKnowledgeItem,
  question: string,
  qWords: string[],
  qWordSet: Set<string>,
): ExtractedAnswer {
  const normalizedQuestion = question.toLowerCase().trim();
  let score = 0;

  const rawKeywords = Array.isArray(item.keywords)
    ? item.keywords.map((k) => String(k).toLowerCase().trim())
    : typeof item.keywords === "string"
    ? [item.keywords.toLowerCase().trim()]
    : [];

  const rawQuestion = [item.question, item.topic, item.title, item.section].filter(Boolean).join(" ");
  const rawAnswer = [item.answer, item.content, item.description, item.text].filter(Boolean).join(" ") ||
    Object.entries(item)
      .filter(([k]) => !["keywords", "links", "question", "topic", "title", "section"].includes(k))
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("\n");

  // 1. Keyword array scoring
  for (const kw of rawKeywords) {
    if (!kw) continue;
    if (normalizedQuestion === kw) {
      score += 100;
    } else if (kw.length > 2 && normalizedQuestion.includes(kw)) {
      score += 40 + (kw.split(/\s+/).length * 10);
    } else if (normalizedQuestion.length > 2 && kw.includes(normalizedQuestion)) {
      score += 30;
    } else {
      const kwTokens = tokenize(kw);
      if (kwTokens.length > 0) {
        const matches = kwTokens.filter((w) => qWordSet.has(w)).length;
        if (matches === kwTokens.length) {
          score += 25 + (matches * 8);
        } else if (matches > 0) {
          score += matches * 6;
        }
      }
    }
  }

  // 2. Question/title/topic scoring
  const titleText = rawQuestion.toLowerCase().trim();
  if (titleText) {
    if (normalizedQuestion === titleText) {
      score += 80;
    } else if (titleText.length > 2 && normalizedQuestion.includes(titleText)) {
      score += 35 + (titleText.split(/\s+/).length * 8);
    } else if (normalizedQuestion.length > 2 && titleText.includes(normalizedQuestion)) {
      score += 25;
    } else {
      const titleTokens = tokenize(titleText);
      const matches = titleTokens.filter((w) => qWordSet.has(w)).length;
      if (matches === titleTokens.length && titleTokens.length > 0) {
        score += 20 + (matches * 6);
      } else if (matches > 0) {
        score += matches * 5;
      }
    }
  }

  // 3. Answer body tokens scoring
  const answerWords = new Set(tokenize(rawAnswer));
  for (const qw of qWords) {
    if (answerWords.has(qw)) {
      score += 3;
    }
  }

  // Format clean links
  const links: { label: string; href: string }[] = [];
  if (Array.isArray(item.links)) {
    for (const link of item.links) {
      if (link && typeof link === "object" && typeof link.label === "string" && typeof link.href === "string") {
        links.push({ label: link.label, href: link.href });
      }
    }
  }

  const cleanAnswer = formatDocumentContent(rawAnswer || titleText);

  return {
    answer: cleanAnswer,
    links,
    score,
  };
}

const SYNONYMS: Record<string, string[]> = {
  hi: ["hello", "hey", "greeting", "greetings", "good morning", "good evening", "howdy"],
  hello: ["hi", "hey", "greeting", "greetings"],
  bye: ["goodbye", "bye", "see you", "exit", "quit", "thank you", "thanks"],
  "thank you": ["thanks", "thank", "bye", "appreciated"],
  thanks: ["thank you", "thank", "bye", "appreciated"],
  login: ["sign in", "signin", "log in", "log on", "authenticate", "credentials", "password"],
  register: ["sign up", "signup", "create account", "new account", "registration", "onboard"],
  admin: ["administrator", "platform admin", "portal", "management"],
  "seeded accounts": ["demo accounts", "test accounts", "sample accounts", "default accounts", "seeded credentials", "demo login", "admin login", "rider login", "passenger login", "logins", "credentials"],
  "demo accounts": ["seeded accounts", "test accounts", "sample accounts", "demo login", "logins", "credentials"],
  accounts: ["seeded accounts", "demo accounts", "credentials", "logins"],
  ride: ["trip", "travel", "journey", "carpool"],
  safety: ["emergency", "sos", "report", "block", "help"],
};

function getExpandedQuestionTokens(question: string, qWords: string[], qWordSet: Set<string>): Set<string> {
  const normalizedQuestion = question.toLowerCase().trim();
  const expanded = new Set(qWords);

  for (const [key, synList] of Object.entries(SYNONYMS)) {
    if (normalizedQuestion.includes(key) || qWordSet.has(key)) {
      synList.forEach((s) => {
        tokenize(s).forEach((st) => expanded.add(st));
      });
    }
    for (const syn of synList) {
      if (normalizedQuestion.includes(syn) || qWordSet.has(syn)) {
        expanded.add(key);
        tokenize(key).forEach((kt) => expanded.add(kt));
      }
    }
  }

  return expanded;
}

function detectActionLinks(text: string): { label: string; href: string }[] {
  const lower = text.toLowerCase();
  const links: { label: string; href: string }[] = [];

  if (lower.includes("find a ride") || lower.includes("search ride") || lower.includes("passenger")) {
    links.push({ label: "Find a Ride", href: "/find-a-ride" });
  }
  if (lower.includes("offer a ride") || lower.includes("vehicle verification") || lower.includes("rider")) {
    links.push({ label: "Offer a Ride", href: "/offer-a-ride" });
  }
  if (lower.includes("register") || lower.includes("create account") || lower.includes("sign up")) {
    links.push({ label: "Register", href: "/register" });
  }
  if (lower.includes("login") || lower.includes("seeded account") || lower.includes("demo account") || lower.includes("sign in")) {
    links.push({ label: "Login", href: "/login" });
  }
  if (lower.includes("donate") || lower.includes("charity") || lower.includes("campaign")) {
    links.push({ label: "Charity Impact", href: "/charity-impact" });
  }
  if (lower.includes("sos") || lower.includes("safety") || lower.includes("report")) {
    links.push({ label: "Safety & SOS", href: "/safety" });
  }
  if (lower.includes("admin")) {
    links.push({ label: "Admin Portal", href: "/admin" });
  }

  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  }).slice(0, 3);
}

/**
 * Scores a raw text / markdown chunk and extracts clean content.
 */
function scoreAndExtractTextChunk(
  content: string,
  question: string,
  qWords: string[],
  qWordSet: Set<string>,
): ExtractedAnswer {
  const normalizedQuestion = question.toLowerCase().trim();
  const expandedQ = getExpandedQuestionTokens(question, qWords, qWordSet);
  let score = 0;

  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const headingLine = lines.find((l) => l.startsWith("#")) || "";
  const headingText = headingLine.replace(/^#+\s*/, "").toLowerCase().trim();

  if (headingText) {
    if (normalizedQuestion === headingText) {
      score += 100;
    } else if (headingText.length > 2 && normalizedQuestion.includes(headingText)) {
      score += 45 + (headingText.split(/\s+/).length * 10);
    } else if (normalizedQuestion.length > 2 && headingText.includes(normalizedQuestion)) {
      score += 35;
    } else {
      const hWords = tokenize(headingText);
      const matches = hWords.filter((w) => expandedQ.has(w)).length;
      if (matches === hWords.length && hWords.length > 0) {
        score += 30 + (matches * 10);
      } else if (matches > 0) {
        score += matches * 8;
      }
    }
  }

  const bodyWords = new Set(tokenize(content));
  for (const qw of expandedQ) {
    if (bodyWords.has(qw)) {
      score += 3;
    }
  }

  const cleanAnswer = formatDocumentContent(content);
  const links = detectActionLinks(cleanAnswer);

  return {
    answer: cleanAnswer,
    links,
    score,
  };
}

/**
 * Inspects a database chunk and extracts the best answer (even if the chunk contains legacy raw JSON).
 */
function scoreAndExtractFromChunk(
  chunkContent: string,
  question: string,
  qWords: string[],
  qWordSet: Set<string>,
): ExtractedAnswer {
  const trimmed = chunkContent.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);

      // If legacy multi-item array in a single chunk
      if (Array.isArray(parsed)) {
        let bestItemResult: ExtractedAnswer = { answer: "", links: [], score: 0 };
        for (const item of parsed) {
          if (typeof item === "object" && item !== null) {
            const res = scoreAndExtractStructuredItem(item, question, qWords, qWordSet);
            if (res.score > bestItemResult.score) {
              bestItemResult = res;
            }
          }
        }
        if (bestItemResult.score > 0) {
          return bestItemResult;
        }
      } else if (typeof parsed === "object" && parsed !== null) {
        return scoreAndExtractStructuredItem(parsed, question, qWords, qWordSet);
      }
    } catch {
      // Ignore JSON parse error and fallback to text scoring
    }
  }

  return scoreAndExtractTextChunk(chunkContent, question, qWords, qWordSet);
}

export async function answerFromChatbotDocuments(question: string) {
  const qWords = tokenize(question);
  if (qWords.length === 0) return null;
  const qWordSet = new Set(qWords);

  let chunks = await prisma.chatbotDocumentChunk.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { document: { select: { fileName: true } } },
  });

  // If no chunks exist, auto-seed default functional documents
  if (chunks.length === 0) {
    await seedDefaultChatbotDocuments();
    chunks = await prisma.chatbotDocumentChunk.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { document: { select: { fileName: true } } },
    });
  }

  if (chunks.length === 0) return null;

  let bestMatch: ExtractedAnswer | null = null;
  let bestCreatedAt = 0;

  for (const chunk of chunks) {
    const extracted = scoreAndExtractFromChunk(chunk.content, question, qWords, qWordSet);

    if (extracted.score < 3 || !extracted.answer.trim()) continue;

    const createdAtTime = chunk.createdAt.getTime();
    if (
      !bestMatch ||
      extracted.score > bestMatch.score ||
      (extracted.score === bestMatch.score && createdAtTime > bestCreatedAt)
    ) {
      bestMatch = extracted;
      bestCreatedAt = createdAtTime;
    }
  }

  if (!bestMatch || bestMatch.score < 3) return null;

  return {
    answer: bestMatch.answer,
    links: bestMatch.links,
    found: true,
    source: "document" as const,
  };
}

const DEFAULT_FUNCTIONAL_GUIDE = `# Backseat Functional Guide

## Overview
Backseat is a non-commercial carpooling and ride-sharing platform across India where rides are always 100% free with no fares, booking fees, or price negotiations. Passengers may voluntarily support verified charity partners via rider QR codes.

## Register Account
Users can register with full name, email, optional phone number, and password. After registration, they can access the dashboard to find rides, offer rides, or view trips.

## Login
Users can log in using their registered email and password. Blocked accounts are prevented from logging in.

### Seeded accounts (password Demo@123 / admin Admin@123)
| Role | Email | Password |
|---|---|---|
| Admin | admin@backseat.app | Admin@123 |
| Demo rider | demo.rider@backseat.app | Demo@123 |
| Demo passenger | demo.passenger@backseat.app | Demo@123 |

## Find a Ride
Passengers can search available rides by entering pickup location, destination, and vehicle type (Two-Wheeler or Four-Wheeler). Only verified and active rider offers are shown.

## Offer a Ride
Riders can offer rides after their vehicle registration is verified by administrators. They specify pickup location, destination, departure time, and available spare seats.

## Charity Donations
After completing a ride, passengers can scan the rider's charity QR code to donate directly to registered charitable organizations via UPI. Riders never receive personal payments or fares.

## Safety & SOS
Backseat prioritizes safety with user reporting, user blocking, and a dedicated SOS button that immediately alerts platform moderators and connects to emergency number 112.

## Admin Portal
Administrators have access to manage users, verify riders and vehicles, review ride offers, inspect donations, configure charity partners, investigate fraud signals, review user reports, and manage chatbot functional documents.

## Hi
Hello! How can I help you today with Backseat? Ask me about finding rides, offering rides, safety, donations, or demo accounts.

### bye
Thank you for using Backseat! Have a safe and pleasant journey. Visit again!
`;

/**
 * Seeds or restores the default functional document in the database.
 */
export async function seedDefaultChatbotDocuments() {
  const existing = await prisma.chatbotDocument.findFirst({
    where: { fileName: "backseat-functional-guide.md" },
  });

  const content = DEFAULT_FUNCTIONAL_GUIDE;
  const chunks = splitDocumentIntoChunks(content, "backseat-functional-guide.md");

  let docId = existing?.id;

  if (existing) {
    await prisma.chatbotDocument.update({
      where: { id: existing.id },
      data: { content },
    });
  } else {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    const created = await prisma.chatbotDocument.create({
      data: {
        fileName: "backseat-functional-guide.md",
        contentType: "text/markdown",
        content,
        uploadedById: admin?.id,
      },
    });
    docId = created.id;
  }

  if (docId) {
    await prisma.$transaction([
      prisma.chatbotDocumentChunk.deleteMany({ where: { documentId: docId } }),
      prisma.chatbotDocumentChunk.createMany({
        data: chunks.map((chunk, position) => ({
          documentId: docId!,
          content: chunk,
          position,
        })),
      }),
    ]);
  }

  return {
    documentId: docId,
    chunkCount: chunks.length,
  };
}

/**
 * Re-chunks and re-indexes all documents in the database.
 */
export async function reindexChatbotDocuments() {
  const documents = await prisma.chatbotDocument.findMany({
    include: { chunks: true },
  });

  if (documents.length === 0) {
    const seeded = await seedDefaultChatbotDocuments();
    return {
      documentCount: 1,
      totalChunks: seeded.chunkCount,
    };
  }

  let totalChunksCreated = 0;

  for (const doc of documents) {
    const newChunks = splitDocumentIntoChunks(doc.content, doc.fileName);

    await prisma.$transaction([
      prisma.chatbotDocumentChunk.deleteMany({ where: { documentId: doc.id } }),
      prisma.chatbotDocumentChunk.createMany({
        data: newChunks.map((chunk, position) => ({
          documentId: doc.id,
          content: chunk,
          position,
        })),
      }),
    ]);

    totalChunksCreated += newChunks.length;
  }

  return {
    documentCount: documents.length,
    totalChunks: totalChunksCreated,
  };
}

