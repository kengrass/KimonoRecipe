"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import { APP_ROUTES, LARAVEL } from "@/lib/laravel-urls";
import { userProfilePath } from "@/lib/mypage-data";
import {
  INPUT_LIMITS,
  sanitizePlainLine,
  safeInternalPath,
} from "@/lib/safe-input";
import { refreshSpikeAuthUser } from "@/lib/spike-auth";

type Mode = "login" | "regist";

type Props = {
  mode: Mode;
};

function safeNextPath(raw: string | null): string | null {
  return safeInternalPath(raw);
}

/** ログイン／新規登録フォーム（spike は API、モックはデモ会員へ切替） */
export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const { setAuthMode, isLoggedIn, currentUser } = useMockAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoggedIn && currentUser) {
    return (
      <div className="rounded border border-kr-border bg-white px-4 py-6 text-center">
        <p className="text-sm text-kr-text">
          {currentUser.name} としてログイン中です。
        </p>
        <Link
          href={userProfilePath(currentUser.id)}
          className="mt-4 inline-flex rounded bg-kr-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          マイページへ
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (USE_SPIKE_API) {
        const path =
          mode === "login" ? "/api/auth/login" : "/api/auth/register";
        const safeName =
          mode === "regist"
            ? sanitizePlainLine(name, INPUT_LIMITS.name)
            : "";
        if (mode === "regist" && (safeName == null || !safeName)) {
          setError(
            safeName == null
              ? "表示名に使用できない文字が含まれています。"
              : "表示名を入力してください。",
          );
          return;
        }
        const body =
          mode === "login"
            ? { email: email.trim(), password }
            : { name: safeName, email: email.trim(), password };
        const res = await fetch(path, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 409) {
          setError("このメールアドレスはすでに登録されています。");
          return;
        }
        if (!res.ok) {
          setError(
            mode === "login"
              ? "メールまたはパスワードが違います。"
              : "登録に失敗しました。入力内容を確認してください。",
          );
          return;
        }
        const user = await refreshSpikeAuthUser();
        router.replace(
          nextPath ??
            (user?.id ? userProfilePath(user.id) : APP_ROUTES.home),
        );
        router.refresh();
        return;
      }

      // モック: 任意入力で会員にする（上部モックバーと同じ系統）
      setAuthMode("member");
      router.replace(nextPath ?? APP_ROUTES.home);
      router.refresh();
    } catch {
      setError("通信エラーです。しばらくしてから再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded border border-kr-border bg-white px-4 py-5"
    >
      {mode === "regist" ? (
        <label className="block">
          <span className="text-xs font-medium text-kr-muted">表示名</span>
          <input
            type="text"
            required
            maxLength={INPUT_LIMITS.name}
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-kr-border px-3 py-2 text-sm text-kr-text outline-none focus:border-kr-navy"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-xs font-medium text-kr-muted">メールアドレス</span>
        <input
          type="email"
          required
          maxLength={INPUT_LIMITS.email}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-kr-border px-3 py-2 text-sm text-kr-text outline-none focus:border-kr-navy"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-kr-muted">パスワード</span>
        <input
          type="password"
          required
          minLength={USE_SPIKE_API ? 6 : 1}
          maxLength={INPUT_LIMITS.password}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-kr-border px-3 py-2 text-sm text-kr-text outline-none focus:border-kr-navy"
        />
      </label>

      {mode === "regist" ? (
        <p className="text-xs leading-relaxed text-kr-muted">
          登録すると、
          <a
            href={LARAVEL.terms}
            target="_blank"
            rel="noreferrer"
            className="text-kr-link hover:underline"
          >
            利用規約
          </a>
          および
          <a
            href={LARAVEL.privacy}
            target="_blank"
            rel="noreferrer"
            className="text-kr-link hover:underline"
          >
            プライバシーポリシー
          </a>
          に同意したものとみなします。
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded bg-kr-navy px-3 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {busy
          ? "送信中…"
          : mode === "login"
            ? "ログイン"
            : "メンバー登録"}
      </button>

      <p className="text-center text-xs text-kr-muted">
        {mode === "login" ? (
          <>
            アカウントをお持ちでない方は{" "}
            <Link
              href={
                nextPath
                  ? `${APP_ROUTES.regist}?next=${encodeURIComponent(nextPath)}`
                  : APP_ROUTES.regist
              }
              className="text-kr-link hover:underline"
            >
              新規登録
            </Link>
          </>
        ) : (
          <>
            すでにアカウントがある方は{" "}
            <Link
              href={
                nextPath
                  ? `${APP_ROUTES.login}?next=${encodeURIComponent(nextPath)}`
                  : APP_ROUTES.login
              }
              className="text-kr-link hover:underline"
            >
              ログイン
            </Link>
          </>
        )}
      </p>

      {USE_SPIKE_API && mode === "login" ? (
        <p className="text-center text-[11px] text-kr-muted">
          デモ: demo@example.com / demo-pass
        </p>
      ) : null}
    </form>
  );
}
