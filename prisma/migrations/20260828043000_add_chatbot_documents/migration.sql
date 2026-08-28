CREATE TABLE "ChatbotDocument" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatbotDocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotDocumentChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatbotDocument_createdAt_idx" ON "ChatbotDocument"("createdAt");
CREATE INDEX "ChatbotDocument_uploadedById_idx" ON "ChatbotDocument"("uploadedById");
CREATE INDEX "ChatbotDocumentChunk_documentId_idx" ON "ChatbotDocumentChunk"("documentId");

ALTER TABLE "ChatbotDocument" ADD CONSTRAINT "ChatbotDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatbotDocumentChunk" ADD CONSTRAINT "ChatbotDocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ChatbotDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
