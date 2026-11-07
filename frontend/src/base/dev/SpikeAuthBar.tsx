"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { userProfilePath } from "@/lib/mypage-data";
import {
  refreshSpikeAuthUser,
  setSpikeAuthUser,
} from "@/lib/spike-auth";

/**
 * spike API 接続時の簡易ログイン（デモ用）。
 * Cookie `kr_spike_session` は Next rewrite 経由で同オリジンに付く。
 */
export function SpikeAuthBar() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useMockAuth();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo-pass");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // パスワードマネージャが空で上書きすることがあるので、空なら戻す
    if (!password) setPassword("demo-pass");
  }, [password]);

  if (!USE_SPIKE_API) return null;

  async function login() {
    setBusy(true);
    setStatus(null);
    const pass = password || "demo-pass";
    if (!password) setPassword(pass);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        setStatus(`ログイン失敗 (${res.status})`);
        return;
      }
      const user = await refreshSpikeAuthUser();
      setStatus(`OK: ${user?.name ?? "logged in"}`);
      router.refresh();
    } catch {
      setStatus("通信エラー");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setSpikeAuthUser(null);
      setStatus("ログアウト");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-sky-200 bg-sky-50 text-sm text-sky-950">
      <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <p className="shrink-0 text-xs font-medium text-sky-800 sm:text-sm">
          spike API
        </p>
        {isLoggedIn && currentUser ? (
          <Link
            href={userProfilePath(currentUser.id)}
            className="rounded border border-sky-400 bg-white px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
          >
            マイページ（{currentUser.name}）
          </Link>
        ) : null}
        <label className="flex items-center gap-1 text-xs">
          <span className="sr-only">email</span>
          <input
            className="w-44 rounded border border-sky-300 bg-white px-2 py-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="flex items-center gap-1 text-xs">
          <span className="sr-only">password</span>
          <input
            type="password"
            className="w-28 rounded border border-sky-300 bg-white px-2 py-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void login()}
          className="rounded border border-sky-600 bg-sky-600 px-2.5 py-1 text-xs text-white disabled:opacity-50"
        >
          ログイン
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void logout()}
          className="rounded border border-sky-300 bg-white px-2.5 py-1 text-xs disabled:opacity-50"
        >
          ログアウト
        </button>
        {status ? (
          <span className="text-xs text-sky-800">{status}</span>
        ) : isLoggedIn && currentUser ? (
          <span className="text-xs text-sky-800">ログイン中: {currentUser.name}</span>
        ) : null}
        <Link
          href={APP_ROUTES.admin}
          className="inline-flex w-fit shrink-0 items-center rounded border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100 sm:ml-auto"
        >
          運営管理
        </Link>
      </div>
    </div>
  );
}
