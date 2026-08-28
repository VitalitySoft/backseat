"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

export function ChatbotDocumentUploadForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/chatbot-documents", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Upload failed");
        return;
      }

      setMessage(`Uploaded ${data.fileName} with ${data.chunkCount} searchable chunks.`);
      form.reset();
      router.refresh();
    } catch {
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReindex() {
    setMessage("");
    setReindexing(true);

    try {
      const response = await fetch("/api/admin/chatbot-documents", {
        method: "PATCH",
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Re-index failed");
        return;
      }

      setMessage(`Re-indexed ${data.documentCount} document(s) into ${data.totalChunks} chunks.`);
      router.refresh();
    } catch {
      setMessage("Re-index failed. Please try again.");
    } finally {
      setReindexing(false);
    }
  }

  async function handleRestoreDefault() {
    setMessage("");
    setReindexing(true);

    try {
      const response = await fetch("/api/admin/chatbot-documents", {
        method: "PUT",
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Failed to restore default documents");
        return;
      }

      setMessage(`Default functional guide restored (${data.chunkCount} searchable chunks).`);
      router.refresh();
    } catch {
      setMessage("Failed to restore default documents. Please try again.");
    } finally {
      setReindexing(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-paper-line bg-white p-6">
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-ink" htmlFor="chatbot-document">
          Functional document
        </label>
        <input
          id="chatbot-document"
          name="file"
          type="file"
          accept=".txt,.md,.markdown,.json,.csv,.pdf,.docx,.xlsx,.xls"
          required
          className="mt-3 block w-full rounded-xl border border-paper-line bg-paper px-4 py-3 text-sm text-text file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-ink"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || reindexing}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-on-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4" />
            {loading ? "Uploading..." : "Upload document"}
          </button>
          <button
            type="button"
            onClick={handleReindex}
            disabled={loading || reindexing}
            className="inline-flex items-center gap-2 rounded-full border border-paper-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink hover:border-marigold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reindexing ? "Re-indexing..." : "Re-index All Documents"}
          </button>
          <button
            type="button"
            onClick={handleRestoreDefault}
            disabled={loading || reindexing}
            className="inline-flex items-center gap-2 rounded-full border border-paper-line bg-marigold-pale/40 px-4 py-2.5 text-sm font-semibold text-marigold-deep hover:bg-marigold-pale disabled:cursor-not-allowed disabled:opacity-60"
          >
            Restore Default Knowledge
          </button>
          {message && <p className="text-sm text-text-soft">{message}</p>}
        </div>
      </form>
    </div>
  );
}

export function DeleteDocumentButton({ id, fileName }: { id: string; fileName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/chatbot-documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error ?? "Failed to delete document");
      }
    } catch {
      alert("Failed to delete document");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-full border border-paper-line px-3 py-1 text-xs font-semibold text-coral hover:bg-coral-pale hover:border-coral disabled:opacity-50"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}

