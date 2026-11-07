import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/base/admin/AdminShell";
import { UserDetailClient } from "@/base/admin/UserDetailClient";
import { loadAdminUser } from "@/lib/admin/admin-data";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const loaded = await loadAdminUser(id);
  return { title: loaded ? `${loaded.user.name} | ユーザー` : "ユーザー" };
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const loaded = await loadAdminUser(id);
  if (!loaded) notFound();

  return (
    <AdminShell>
      <UserDetailClient user={loaded.user} />
    </AdminShell>
  );
}
