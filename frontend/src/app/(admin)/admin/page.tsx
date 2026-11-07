import type { Metadata } from "next";
import { AdminShell } from "@/base/admin/AdminShell";
import { StatsDashboard } from "@/base/admin/StatsDashboard";
import { loadAdminStats } from "@/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "統計",
};

export default async function AdminStatsPage() {
  const stats = await loadAdminStats();

  return (
    <AdminShell>
      <StatsDashboard
        source={stats.source}
        kpis={stats.kpis}
        activity={stats.activity}
        usage={stats.usage}
        liveError={stats.liveError}
      />
    </AdminShell>
  );
}
