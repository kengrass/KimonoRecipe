"use client";

import { useCallback, useState } from "react";

export type AdminFlashTone = "ok" | "error";

type FlashDensity = "compact" | "comfortable";

type FlashState = {
  message: string;
  tone: AdminFlashTone;
};

/**
 * 管理の一時メッセージ（状態のみ）。
 * 描画は `<AdminFlashBanner message={flash} />` に渡す。
 */
export function useAdminFlash() {
  const [flash, setFlash] = useState<FlashState | null>(null);

  const showFlash = useCallback(
    (message: string, ms = 2500, tone: AdminFlashTone = "ok") => {
      setFlash({ message, tone });
      window.setTimeout(() => setFlash(null), ms);
    },
    [],
  );

  return { flash, showFlash };
}

/** flash 状態の描画。hook とは分離（引き継ぎで追いやすい） */
export function AdminFlashBanner({
  flash,
  density = "compact",
}: {
  flash: FlashState | null;
  density?: FlashDensity;
}) {
  if (!flash) return null;
  const ok = flash.tone === "ok";
  const pad =
    density === "comfortable"
      ? "rounded-md border px-3 py-2 text-[15px]"
      : "rounded border px-3 py-2 text-sm";
  const toneClass = ok
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-red-200 bg-red-50 text-red-900";
  return <p className={`${pad} ${toneClass}`}>{flash.message}</p>;
}
