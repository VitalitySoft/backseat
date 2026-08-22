import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "./admin-sidebar";

export const metadata = { title: "Admin Portal — Backseat" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1 px-5 py-8 md:px-8">{children}</div>
    </div>
  );
}
