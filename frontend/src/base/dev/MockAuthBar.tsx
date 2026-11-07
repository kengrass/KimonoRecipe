"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMockAuth } from "@/lib/auth";
import { SHOW_MOCK_DEV_CHROME } from "@/lib/config";
import { APP_ROUTES } from "@/lib/laravel-urls";
import type { MockAuthMode } from "@/lib/types";

const AUTH_OPTIONS: {
  value: MockAuthMode;
  label: string;
  shortLabel: string;
  hint: string;
}[] = [
  {
    value: "guest",
    label: "未ログイン",
    shortLabel: "未ログイン",
    hint: "公開のみ・いいねは会員誘導",
  },
  {
    value: "member",
    label: "ログイン・他者",
    shortLabel: "他者",
    hint: "いいね・フォルダ可／owner APIなし",
  },
  {
    value: "owner",
    label: "所有者",
    shortLabel: "所有者",
    hint: "編集・非公開メモ表示（Phase3）",
  },
];

/**
 * 開発用モックバー（`SHOW_MOCK_DEV_CHROME` 時のみ。実 API 接続後は出さない）。
 * ログイン状態の切替 ＋ 運営管理への動線。
 */
export function MockAuthBar() {
  // ビルド定数。実 API 接続時は親もマウントしないが、二重防御。
  if (!SHOW_MOCK_DEV_CHROME) return null;

  const { authMode, setAuthMode } = useMockAuth();
  const router = useRouter();

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-sm text-amber-950">
      <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="shrink-0 text-xs font-medium text-amber-800 sm:text-sm">
            ログイン状態
          </p>
          <div className="flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
            {AUTH_OPTIONS.map((opt) => {
              const active = authMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setAuthMode(opt.value);
                    router.refresh();
                  }}
                  className={`rounded border px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm ${
                    active
                      ? "border-amber-600 bg-amber-600 text-white"
                      : "border-amber-300 bg-white hover:border-amber-500"
                  }`}
                  title={opt.hint}
                >
                  <span className="sm:hidden">{opt.shortLabel}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <Link
          href={APP_ROUTES.admin}
          className="inline-flex w-fit shrink-0 items-center rounded border border-amber-300 bg-white px-2.5 py-1.5 text-xs transition hover:border-amber-500 sm:px-3 sm:text-sm"
        >
          運営管理
        </Link>
      </div>
    </div>
  );
}
