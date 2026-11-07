import type { Metadata } from "next";
import { AdminShell } from "@/base/admin/AdminShell";
import { UserListClient } from "@/base/admin/UserListClient";
import { loadAdminUsers } from "@/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "ユーザー",
};

export default async function AdminUsersPage() {
  const { users, liveError } = await loadAdminUsers();

  return (
    <AdminShell>
      {liveError ? (
        <p className="mb-3 text-[13px] text-amber-800">{liveError}</p>
      ) : null}
      <UserListClient users={users} />
    </AdminShell>
  );
}
