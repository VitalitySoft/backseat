import { NextResponse } from "next/server";
import { z } from "zod";
import { answerBackseatQuestion } from "@/lib/chatbot";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { answerFromChatbotDocuments } from "@/lib/chatbot-documents";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(1000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(12),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please send a valid question." },
      { status: 400 },
    );
  }

  const latestQuestion = [...parsed.data.messages]
    .reverse()
    .find((message) => message.role === "user")
    ?.content.trim() ?? "";

  const documentResult = latestQuestion
    ? await answerFromChatbotDocuments(latestQuestion)
    : null;

  if (documentResult) {
    return NextResponse.json(documentResult);
  }

  const result = answerBackseatQuestion(parsed.data.messages);

  if (latestQuestion && !result.found) {
    const session = await getSession();

    await prisma.chatbotUnknownQuestion.create({
      data: {
        question: latestQuestion,
        normalizedText: latestQuestion.toLowerCase(),
        fallbackAnswer: result.answer,
        userId: session.userId,
      },
    }).catch((error) => {
      console.error("Failed to log unknown chatbot question", error);
    });
  }

  return NextResponse.json(result);
}
