import { prisma } from "@/lib/prisma";
import { AdminActionButton } from "@/components/admin-action-button";

export const metadata = { title: "Admin — Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { riderProfile: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Users</h1>
      <p className="mt-1 text-sm text-text-soft">{users.length} account(s)</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-paper-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-dim/50 text-xs uppercase tracking-wide text-text-soft">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                <td className="px-4 py-3 text-text-soft">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.riderProfile ? "Rider" : "Passenger"}</td>
                <td className="px-4 py-3">
                  <span className={u.isBlocked ? "text-rose-deep" : "text-banyan-deep"}>
                    {u.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role !== "ADMIN" && (
                    <AdminActionButton
                      url={`/api/admin/users/${u.id}`}
                      body={{ isBlocked: !u.isBlocked }}
                      label={u.isBlocked ? "Unblock" : "Block"}
                      tone={u.isBlocked ? "success" : "danger"}
                      confirmMessage={u.isBlocked ? undefined : "Block this user from the platform?"}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
