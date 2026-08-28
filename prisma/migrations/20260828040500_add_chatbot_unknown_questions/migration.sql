CREATE TABLE "ChatbotUnknownQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "fallbackAnswer" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotUnknownQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatbotUnknownQuestion_status_idx" ON "ChatbotUnknownQuestion"("status");
CREATE INDEX "ChatbotUnknownQuestion_createdAt_idx" ON "ChatbotUnknownQuestion"("createdAt");
CREATE INDEX "ChatbotUnknownQuestion_userId_idx" ON "ChatbotUnknownQuestion"("userId");

ALTER TABLE "ChatbotUnknownQuestion" ADD CONSTRAINT "ChatbotUnknownQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
