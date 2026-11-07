"use client";

import { useEffect, useState } from "react";
import { useMockAuth } from "@/lib/auth";
import { USE_SPIKE_API } from "@/lib/config";
import {
  isFollowingUser,
  subscribeFollowChange,
  writeFollowing,
} from "@/lib/follow-state";
import {
  spikeCheckFollow,
  spikeToggleFollow,
} from "@/lib/spike-write";
import { AuthRequiredDialog } from "./AuthRequiredDialog";

type Props = {
  /** フォロー対象ユーザー ID */
  userId: string;
  /** プロフィールなど横幅いっぱい */
  fullWidth?: boolean;
  /**
   * default: 「フォローする／フォロー中」
   * compact: 「フォロー／フォロー中」（詳細・リスト向けの短文）
   */
  variant?: "default" | "compact";
  className?: string;
};

/**
 * フォローする／フォロー中。未ログインは会員誘導。
 * spike 時はサーバ、モック時は sessionStorage。
 */
export function FollowButton({
  userId,
  fullWidth = false,
  variant = "default",
  className = "",
}: Props) {
  const resolved = variant;
  const { isLoggedIn, currentUser } = useMockAuth();
  const [following, setFollowing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (USE_SPIKE_API) {
      if (!isLoggedIn) {
        setFollowing(false);
        return;
      }
      let cancelled = false;
      void spikeCheckFollow(userId)
        .then((status) => {
          if (cancelled || !status) return;
          setFollowing(status.following);
        })
        .catch(() => {
          /* ignore */
        });
      return () => {
        cancelled = true;
      };
    }

    const sync = () => {
      if (!isLoggedIn) {
        setFollowing(false);
        return;
      }
      setFollowing(isFollowingUser(userId));
    };
    sync();
    return subscribeFollowChange(sync);
  }, [userId, isLoggedIn]);

  if (currentUser?.id === userId) return null;

  const active = isLoggedIn && following;

  const toggle = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }

    if (USE_SPIKE_API) {
      if (busy) return;
      setBusy(true);
      void spikeToggleFollow(userId)
        .then((result) => {
          setFollowing(result.following);
        })
        .catch(() => {
          /* ignore */
        })
        .finally(() => setBusy(false));
      return;
    }

    setFollowing((prev) => {
      const next = !prev;
      writeFollowing(userId, next);
      return next;
    });
  };

  const label =
    resolved === "compact"
      ? active
        ? "フォロー中"
        : "フォロー"
      : active
        ? "フォロー中"
        : "フォローする";

  const sizeClass =
    resolved === "compact" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={active}
        className={`rounded border font-medium transition ${sizeClass} ${
          fullWidth ? "w-full" : ""
        } ${
          active
            ? "border-kr-border bg-neutral-50 text-kr-muted"
            : "border-kr-border text-kr-navy hover:bg-neutral-50"
        } ${className}`.trim()}
      >
        {label}
      </button>
      <AuthRequiredDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="follow"
      />
    </>
  );
}
