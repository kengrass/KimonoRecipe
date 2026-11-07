"use client";

import { useEffect, useRef, useState } from "react";

/**
 * モック操作のフィードバック用トースト。
 * fixed: 画面中央付近。inline: 呼び出し位置。
 */
export function useMockFlash(options?: {
  placement?: "inline" | "fixed";
}) {
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const flash = (message: string) => {
    setToast(message);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), 2400);
  };
  const mockSave = (label: string) =>
    flash(`${label}（モックのため保存しません）`);
  const fixed = options?.placement === "fixed";
  const Toast = toast ? (
    <p
      role="status"
      className={
        fixed
          ? "fixed left-1/2 top-1/2 z-[70] w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-kr-border bg-white px-4 py-3.5 text-center text-sm font-medium text-kr-text shadow-lg"
          : "rounded-lg border border-kr-border bg-white px-3.5 py-2.5 text-xs text-kr-muted"
      }
    >
      {toast}
    </p>
  ) : null;
  return { flash, mockSave, Toast };
}
