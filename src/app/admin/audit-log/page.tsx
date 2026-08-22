import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin — Audit Log" };
export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Audit Log</h1>
      <p className="mt-1 text-sm text-text-soft">Every administrative and account-level action, most recent first.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-paper-line bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-dim/50 text-xs uppercase tracking-wide text-text-soft">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-xs text-text-soft">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-text-soft">{l.actor?.name ?? "System"}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink">{l.action}</td>
                <td className="px-4 py-3 text-xs text-text-soft">{l.targetType ? `${l.targetType}:${l.targetId?.slice(0, 8)}` : "—"}</td>
                <td className="px-4 py-3 max-w-[240px] truncate text-xs text-text-soft">{l.metadata ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
