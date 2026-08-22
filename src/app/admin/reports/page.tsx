import { prisma } from "@/lib/prisma";
import { AdminActionButton } from "@/components/admin-action-button";

export const metadata = { title: "Admin — Reports" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "text-rose-deep",
  REVIEWING: "text-marigold-deep",
  RESOLVED: "text-banyan-deep",
  DISMISSED: "text-text-soft",
};

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    include: { reporter: true, reported: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Reports &amp; Complaints</h1>
      <p className="mt-1 text-sm text-text-soft">{reports.length} report(s) filed</p>

      <div className="mt-6 space-y-4">
        {reports.length === 0 && (
          <p className="rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
            No reports filed.
          </p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-paper-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink">
                <strong>{r.reporter.name}</strong> reported <strong>{r.reported.name}</strong>
              </p>
              <span className={`text-xs font-semibold ${STATUS_STYLES[r.status]}`}>{r.status}</span>
            </div>
            <p className="mt-2 text-sm text-text-soft">Reason: {r.reason}</p>
            {r.details && <p className="mt-1 text-sm text-text-soft">&ldquo;{r.details}&rdquo;</p>}
            <p className="mt-1 text-xs text-text-soft">{new Date(r.createdAt).toLocaleString("en-IN")}</p>

            {r.status !== "RESOLVED" && r.status !== "DISMISSED" && (
              <div className="mt-3 flex gap-2">
                <AdminActionButton
                  url={`/api/admin/reports/${r.id}`}
                  body={{ status: "REVIEWING" }}
                  label="Mark reviewing"
                />
                <AdminActionButton
                  url={`/api/admin/reports/${r.id}`}
                  body={{ status: "RESOLVED" }}
                  label="Resolve"
                  tone="success"
                />
                <AdminActionButton
                  url={`/api/admin/reports/${r.id}`}
                  body={{ status: "DISMISSED" }}
                  label="Dismiss"
                  tone="danger"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
