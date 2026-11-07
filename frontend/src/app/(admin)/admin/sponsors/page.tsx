import type { Metadata } from "next";
import { AdminShell } from "@/base/admin/AdminShell";
import { AdsSection } from "@/base/admin/AdsSection";

export const metadata: Metadata = {
  title: "スポンサー",
};

export default function AdminSponsorsPage() {
  return (
    <AdminShell>
      <AdsSection />
    </AdminShell>
  );
}
