"use client";

import { useCallback } from "react";
import type { AdminFlashTone } from "@/base/admin/useAdminFlash";
import { mapRowsWithUploadedUrls } from "@/lib/admin/spike-media";

type PersistOpts<T> = {
  getUrl: (row: T) => string;
  withUrl: (row: T, url: string) => T;
  /** LIVE 失敗時は throw。成功時は保存後配列を返すとそれを setRows に使う */
  save: (rows: T[]) => void | Promise<void | T[]>;
  setRows: (rows: T[]) => void;
  showFlash: (message: string, ms?: number, tone?: AdminFlashTone) => void;
};

/** 広告／協賛共通: blob アップロード → 保存 → 返ってきた配列で setRows → flash */
export function useAdminPersistRows<T>(opts: PersistOpts<T>) {
  const { getUrl, withUrl, save, setRows, showFlash } = opts;

  return useCallback(
    async (next: T[], message: string) => {
      try {
        const rowsToSave = await mapRowsWithUploadedUrls(next, getUrl, withUrl);
        const saved = await save(rowsToSave);
        setRows(saved ?? rowsToSave);
        showFlash(message);
      } catch (err) {
        const detail =
          err instanceof Error && err.message && !err.message.includes("_failed")
            ? err.message
            : "保存に失敗しました";
        showFlash(detail, 3500, "error");
      }
    },
    [getUrl, withUrl, save, setRows, showFlash],
  );
}
