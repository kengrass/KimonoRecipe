/**
 * 管理ユーザーの書き込み（ブラウザから同オリジン `/api/admin/...`）。
 * LIVE: spike／本番 API。モック: 画面状態のみ返す（永続しない）。
 * @see ./README.md
 */

import { ADMIN_USES_LIVE_API } from "@/lib/admin/admin-fetch";
import type { AdminUser, AdminUserStatus } from "@/lib/admin/types";

export type AdminUserPatch = {
  email?: string;
  name?: string;
  status?: AdminUserStatus;
  adminNote?: string;
  mailRejected?: boolean;
  premiumId?: string | null;
};

export async function saveAdminUser(
  id: string,
  patch: AdminUserPatch,
): Promise<AdminUser> {
  if (!ADMIN_USES_LIVE_API) {
    // モック: 画面状態のみ（永続しない）
    return {
      id,
      premiumId: patch.premiumId ?? null,
      email: patch.email ?? "",
      mailRejected: patch.mailRejected ?? false,
      name: patch.name ?? "",
      status: patch.status ?? "active",
      adminNote: patch.adminNote ?? "",
      publicCoordinateCount: 0,
      privateCoordinateCount: 0,
      tempCoordinateCount: 0,
      publicItemCount: 0,
      privateItemCount: 0,
      attachmentRate: 0,
      imageCount: 0,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
  }
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`admin_user_save_failed:${res.status}`);
  const json = (await res.json()) as { data: AdminUser };
  return json.data;
}

export async function resetAdminUserPassword(id: string): Promise<{
  temporaryPassword?: string;
}> {
  if (!ADMIN_USES_LIVE_API) {
    return { temporaryPassword: "mock-reset-pass" };
  }
  const res = await fetch(
    `/api/admin/users/${encodeURIComponent(id)}/password-reset`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!res.ok) throw new Error(`admin_password_reset_failed:${res.status}`);
  return (await res.json()) as { temporaryPassword?: string };
}
