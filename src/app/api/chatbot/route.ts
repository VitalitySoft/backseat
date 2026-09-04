import { NextResponse } from "next/server";
import { z } from "zod";
import { answerBackseatQuestion } from "@/lib/chatbot";

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

  return NextResponse.json(answerBackseatQuestion(parsed.data.messages));
}
