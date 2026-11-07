"use client";

import { useEffect, useState } from "react";
import type { AdminFlashTone } from "@/base/admin/useAdminFlash";
import { useAdminPersistRows } from "@/base/admin/useAdminPersistRows";

type ShowFlash = (message: string, ms?: number, tone?: AdminFlashTone) => void;

type Opts<T> = {
  load: () => Promise<T[]>;
  save: (rows: T[]) => void | Promise<void | T[]>;
  getUrl: (row: T) => string;
  withUrl: (row: T, url: string) => T;
  loadErrorMessage: string;
  showFlash: ShowFlash;
};

/**
 * 広告／協賛の管理画面用: 一覧 state + 初回 load + persist。
 * 更新は load／save の戻り値だけで行う（Event 購読しない）。
 * 公開側（SponsorAd 等）は別途 store.subscribe を使ってよい。
 */
export function useAdminRowResource<T extends { id: string }>(opts: Opts<T>) {
  const { load, save, getUrl, withUrl, loadErrorMessage, showFlash } = opts;

  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    void load()
      .then((data) => setRows(data))
      .catch(() => {
        setRows([]);
        showFlash(loadErrorMessage, 3500, "error");
      });
    // load はモジュール定数想定
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store 関数は安定
  }, [showFlash, loadErrorMessage]);

  const persist = useAdminPersistRows<T>({
    getUrl,
    withUrl,
    save,
    setRows,
    showFlash,
  });

  const removeById = (id: string, deletedMessage: string) => {
    const target = rows.find((r) => r.id === id);
    if (target) {
      const url = getUrl(target);
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    }
    void persist(
      rows.filter((r) => r.id !== id),
      deletedMessage,
    );
  };

  return { rows, setRows, persist, removeById };
}
