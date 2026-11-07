"use client";

import { useEffect, useState } from "react";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import {
  spikeCheckFavorite,
  spikeToggleFavorite,
} from "@/lib/spike-write";
import { AuthRequiredDialog } from "./AuthRequiredDialog";
import { useMockFlash } from "./useMockFlash";

type Props = {
  initialCount: number;
  /** sessionStorage 用キー（投稿 ID）。`i:` / `c:` 接頭辞 */
  storageKey: string;
  /**
   * false のとき押せない（非公開など。公開投稿のみいいね可）。
   * 省略時は true。
   */
  enabled?: boolean;
};

function parseInteractionKey(
  storageKey: string,
): { kind: "items" | "coordinates"; id: string } | null {
  if (storageKey.startsWith("i:") && storageKey.length > 2) {
    return { kind: "items", id: storageKey.slice(2) };
  }
  if (storageKey.startsWith("c:") && storageKey.length > 2) {
    return { kind: "coordinates", id: storageKey.slice(2) };
  }
  return null;
}

/**
 * いいね。未ログインは会員誘導、ログイン中はトグル。
 * spike 時はサーバ、モック時は sessionStorage。
 * 非公開投稿は enabled=false（API も公開のみ）。
 */
export function LikeButton({
  initialCount,
  storageKey,
  enabled = true,
}: Props) {
  const { isLoggedIn } = useMockAuth();
  const { flash, Toast } = useMockFlash();
  const key = `kr-like:${storageKey}`;
  const target = parseInteractionKey(storageKey);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (USE_SPIKE_API) {
      setLiked(false);
      setCount(initialCount);
      if (!enabled || !isLoggedIn || !target) return;
      let cancelled = false;
      void spikeCheckFavorite(target.kind, target.id)
        .then((status) => {
          if (cancelled || !status) return;
          setLiked(status.liked);
          setCount(status.like_count);
        })
        .catch(() => {
          /* 初期同期失敗は静かに無視 */
        });
      return () => {
        cancelled = true;
      };
    }

    try {
      if (sessionStorage.getItem(key) === "1") {
        setLiked(true);
        setCount(initialCount + 1);
      } else {
        setLiked(false);
        setCount(initialCount);
      }
    } catch {
      setLiked(false);
      setCount(initialCount);
    }
  }, [key, initialCount, isLoggedIn, enabled, target?.kind, target?.id]);

  const toggle = () => {
    if (!enabled) {
      flash("この投稿にはいいねできません");
      return;
    }
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }

    if (USE_SPIKE_API) {
      if (!target || busy) return;
      setBusy(true);
      void spikeToggleFavorite(target.kind, target.id)
        .then((result) => {
          setLiked(result.liked);
          setCount(result.like_count);
        })
        .catch(() => {
          flash("いいねを更新できませんでした");
        })
        .finally(() => setBusy(false));
      return;
    }

    setLiked((prev) => {
      const next = !prev;
      setCount(initialCount + (next ? 1 : 0));
      try {
        if (next) sessionStorage.setItem(key, "1");
        else sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <>
      {Toast}
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-disabled={!enabled}
        title={enabled ? undefined : "この投稿にはいいねできません"}
        className={`inline-flex h-8 items-center gap-1.5 text-sm transition ${
          !enabled
            ? "cursor-not-allowed text-kr-muted/50"
            : liked
              ? "text-rose-500"
              : "text-kr-muted hover:text-kr-text"
        } disabled:opacity-60`}
        aria-pressed={liked}
        aria-label={
          !enabled
            ? "いいねできません"
            : liked
              ? `いいね済み ${count}`
              : `いいね ${count}`
        }
      >
        <HeartIcon filled={liked} />
        <span className="min-w-[1ch] tabular-nums">{count}</span>
      </button>
      <AuthRequiredDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="like"
      />
    </>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
        <path
          fill="currentColor"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
