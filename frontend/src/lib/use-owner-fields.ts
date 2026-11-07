"use client";

import { useEffect, useState } from "react";
import { useMockAuth } from "@/lib/auth";
import type { MockAuthMode } from "@/lib/types";

type FetchOwnerFields<T> = (
  id: string,
  authMode: MockAuthMode,
) => Promise<T | null>;

type Options = {
  /** false のとき取得しない（サーバで ownerFields 済みの Next 向け） */
  enabled?: boolean;
};

/**
 * 所有者向けフィールド（owner API）。
 * ログイン中かつ「この投稿の user.id === 自分」のときだけ取得する。
 * Next 詳細は RSC で渡すため enabled:false 推奨。
 */
export function useOwnerFields<T>(
  id: string,
  contentOwnerUserId: string,
  fetchOwnerFields: FetchOwnerFields<T>,
  options: Options = {},
): T | null {
  const { enabled = true } = options;
  const { authMode, currentUser } = useMockAuth();
  const [fields, setFields] = useState<T | null>(null);
  const isContentOwner = Boolean(
    currentUser && currentUser.id === contentOwnerUserId,
  );

  useEffect(() => {
    if (!enabled || !isContentOwner) {
      setFields(null);
      return;
    }
    let cancelled = false;
    void fetchOwnerFields(id, authMode).then((data) => {
      if (!cancelled) setFields(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id, authMode, fetchOwnerFields, isContentOwner, enabled]);

  return fields;
}
