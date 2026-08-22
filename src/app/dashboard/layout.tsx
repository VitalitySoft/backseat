import { DashboardTabs } from "./dashboard-tabs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DashboardTabs />
      {children}
    </div>
  );
}
