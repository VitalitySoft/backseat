import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { splitDocumentIntoChunks } from "@/lib/chatbot-documents";

const ACCEPTED_TYPES = new Set(["txt", "md", "markdown", "json", "csv", "pdf", "docx", "xlsx", "xls"]);
const TEXT_TYPES = new Set(["txt", "md", "markdown", "json", "csv"]);
const SPREADSHEET_TYPES = new Set(["xlsx", "xls"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function extensionFor(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

async function extractText(file: File, extension: string) {
  if (TEXT_TYPES.has(extension)) return file.text();

  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  if (SPREADSHEET_TYPES.has(extension)) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return [sheetName, csv].filter(Boolean).join("\n");
    }).join("\n\n");
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a document file." }, { status: 400 });
    }

    const extension = extensionFor(file.name);
    if (!ACCEPTED_TYPES.has(extension)) {
      return NextResponse.json(
        { error: "Upload TXT, MD, JSON, CSV, PDF, DOCX, XLS, or XLSX." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Document must be 5 MB or smaller." }, { status: 400 });
    }

    const content = (await extractText(file, extension)).trim();
    if (content.length < 20) {
      return NextResponse.json({ error: "Document does not contain enough readable text to search." }, { status: 400 });
    }

    const chunks = splitDocumentIntoChunks(content, file.name);
    const document = await prisma.chatbotDocument.create({
      data: {
        fileName: file.name,
        contentType: file.type || extension,
        content,
        uploadedById: admin.id,
        chunks: {
          create: chunks.map((chunk, index) => ({ content: chunk, position: index })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CHATBOT_DOCUMENT_UPLOADED",
        targetType: "ChatbotDocument",
        targetId: document.id,
        metadata: JSON.stringify({ fileName: file.name, chunkCount: chunks.length, extension }),
      },
    });

    return NextResponse.json({ id: document.id, fileName: document.fileName, chunkCount: chunks.length });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("Chatbot document upload failed", error);
    return NextResponse.json({ error: "Could not read this document. Try exporting it as DOCX, PDF, or Markdown." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
    }

    const document = await prisma.chatbotDocument.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await prisma.chatbotDocument.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CHATBOT_DOCUMENT_DELETED",
        targetType: "ChatbotDocument",
        targetId: id,
        metadata: JSON.stringify({ fileName: document.fileName }),
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("Chatbot document delete failed", error);
    return NextResponse.json({ error: "Could not delete document." }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const admin = await requireAdmin();
    const { reindexChatbotDocuments } = await import("@/lib/chatbot-documents");
    const result = await reindexChatbotDocuments();

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CHATBOT_DOCUMENTS_REINDEXED",
        targetType: "ChatbotDocument",
        metadata: JSON.stringify(result),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("Chatbot documents re-index failed", error);
    return NextResponse.json({ error: "Could not re-index documents." }, { status: 500 });
  }
}

