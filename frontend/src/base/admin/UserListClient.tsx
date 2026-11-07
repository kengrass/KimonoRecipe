"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ADMIN_CONTROL,
  ADMIN_LINK_ACTION,
  ADMIN_TABLE_WRAP,
  ADMIN_THEAD,
  ADMIN_TR,
} from "@/base/admin/admin-form-styles";
import type { AdminUser } from "@/lib/admin/types";
import { formatDate, formatPercent, statusLabel } from "@/lib/admin/format";
import { userProfilePath } from "@/lib/mypage-data";

type SortKey =
  | "name"
  | "email"
  | "registeredAt"
  | "lastActiveAt"
  | "publicCoordinateCount"
  | "tempCoordinateCount"
  | "attachmentRate"
  | "imageCount"
  | "status";

type Props = {
  users: AdminUser[];
};

/**
 * ユーザー一覧。現状はサーバから受け取った配列をクライアントで絞り・ソート。
 * 件数増時は API の q／page に寄せる（全件取得を正にしない）。
 */
export function UserListClient({ users }: Props) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastActiveAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = users;
    if (needle) {
      list = users.filter(
        (u) =>
          u.id.toLowerCase().includes(needle) ||
          u.name.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle) ||
          (u.premiumId?.toLowerCase().includes(needle) ?? false),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), "ja") * dir;
    });
  }, [users, q, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "email" ? "asc" : "desc");
    }
  };

  const sortMark = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="名前・メール・uid"
          aria-label="名前・メール・uid で検索"
          className={`min-w-[12rem] max-w-md flex-1 ${ADMIN_CONTROL}`}
        />
        <p className="text-[13px] text-slate-600">
          {filtered.length} / {users.length} 件
        </p>
      </div>

      <div className={ADMIN_TABLE_WRAP}>
        <table className="min-w-[56rem] w-full text-left text-[15px] text-kr-text">
          <thead className={ADMIN_THEAD}>
            <tr>
              <th className="px-3 py-2.5 font-medium">
                <button type="button" onClick={() => toggleSort("email")}>
                  メールアドレス{sortMark("email")}
                </button>
              </th>
              <th className="px-3 py-2.5 font-medium">
                <button type="button" onClick={() => toggleSort("name")}>
                  名前{sortMark("name")}
                </button>
              </th>
              <th className="px-2 py-2.5 text-right font-medium" title="公開コーデ">
                公C
              </th>
              <th className="px-2 py-2.5 text-right font-medium" title="非公開コーデ">
                非C
              </th>
              <th
                className="px-2 py-2.5 text-right font-medium"
                title="仮コーデ"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("tempCoordinateCount")}
                >
                  仮C{sortMark("tempCoordinateCount")}
                </button>
              </th>
              <th className="px-2 py-2.5 text-right font-medium" title="公開アイテム">
                公I
              </th>
              <th className="px-2 py-2.5 text-right font-medium" title="非公開アイテム">
                非I
              </th>
              <th
                className="px-2 py-2.5 text-right font-medium"
                title="本コーデのうちアイテムが1件以上付いている割合"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("attachmentRate")}
                >
                  紐付率{sortMark("attachmentRate")}
                </button>
              </th>
              <th className="px-2 py-2.5 text-right font-medium" title="画像数">
                <button type="button" onClick={() => toggleSort("imageCount")}>
                  画像{sortMark("imageCount")}
                </button>
              </th>
              <th className="px-3 py-2.5 font-medium">
                <button type="button" onClick={() => toggleSort("registeredAt")}>
                  会員登録日{sortMark("registeredAt")}
                </button>
              </th>
              <th className="px-3 py-2.5 font-medium">
                <button type="button" onClick={() => toggleSort("lastActiveAt")}>
                  最終利用{sortMark("lastActiveAt")}
                </button>
              </th>
              <th className="px-3 py-2.5 font-medium">
                <button type="button" onClick={() => toggleSort("status")}>
                  状態{sortMark("status")}
                </button>
              </th>
              <th className="px-3 py-2.5 font-medium">編集</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className={ADMIN_TR}>
                <td className="px-3 py-2 text-[14px]">{u.email}</td>
                <td className="px-3 py-2">
                  <Link
                    href={userProfilePath(u.id)}
                    className="font-medium text-kr-navy underline-offset-2 hover:underline"
                    title="サービス側マイページへ"
                  >
                    {u.name}
                  </Link>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {u.publicCoordinateCount}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {u.privateCoordinateCount}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {u.tempCoordinateCount}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {u.publicItemCount}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {u.privateItemCount}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-[14px]">
                  {formatPercent(u.attachmentRate)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {u.imageCount}
                </td>
                <td className="px-3 py-2 text-[14px] tabular-nums">
                  {formatDate(u.registeredAt)}
                </td>
                <td className="px-3 py-2 text-[14px] tabular-nums">
                  {formatDate(u.lastActiveAt)}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={u.status} />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className={ADMIN_LINK_ACTION}
                  >
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: AdminUser["status"] }) {
  const tone =
    status === "active"
      ? "bg-emerald-50 text-emerald-800"
      : status === "suspended"
        ? "bg-amber-50 text-amber-900"
        : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}
