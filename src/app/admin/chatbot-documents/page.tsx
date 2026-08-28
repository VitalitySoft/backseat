import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ChatbotDocumentUploadForm, DeleteDocumentButton } from "./upload-form";

export const metadata = { title: "Admin — Chatbot Documents" };
export const dynamic = "force-dynamic";

export default async function AdminChatbotDocumentsPage() {
  const documents = await prisma.chatbotDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } }, uploadedBy: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Chatbot Documents</h1>
      <p className="mt-1 max-w-xl text-sm text-text-soft">
        Upload functional documents as TXT, Markdown, JSON, CSV, PDF, DOCX, XLS, or XLSX. The assistant searches these documents when FAQ answers do not match.
      </p>

      <ChatbotDocumentUploadForm />

      <div className="mt-6 space-y-3">
        {documents.map((document) => (
          <div key={document.id} className="rounded-2xl border border-paper-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marigold-pale text-ink">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-ink">{document.fileName}</h2>
                  <p className="mt-1 text-xs text-text-soft">
                    {document._count.chunks} chunks · {document.contentType} · uploaded {document.createdAt.toLocaleString("en-IN")}
                    {document.uploadedBy ? ` by ${document.uploadedBy.name}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-banyan-pale px-3 py-1 text-xs font-semibold text-banyan-deep">
                  Searchable
                </span>
                <DeleteDocumentButton id={document.id} fileName={document.fileName} />
              </div>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-paper-line bg-white p-8 text-center text-sm text-text-soft">
            No chatbot documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
