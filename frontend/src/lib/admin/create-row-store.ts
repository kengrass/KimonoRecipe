"use client";

import { ADMIN_USES_LIVE_API } from "@/lib/admin/admin-fetch";
import {
  dispatchAdminEvent,
  subscribeAdminEvent,
} from "@/lib/admin/admin-window-events";

type RowStoreConfig<T> = {
  changeEvent: string;
  apiPath: string;
  loadErrorCode: string;
  saveErrorCode: string;
  getCache: () => T[] | null;
  setCache: (rows: T[] | null) => void;
  cloneRows: (rows: T[]) => T[];
  /** モック時の一覧 */
  listFallback: () => T[];
  /** モック時の保存 */
  saveFallback: (rows: T[]) => void;
  /** LIVE PUT 直前の正規化（任意） */
  prepareSave?: (rows: T[]) => T[];
};

/**
 * 管理の配列リソース（広告／協賛）向け。
 *
 * - LIVE（ADMIN_USES_LIVE_API）: GET/PUT + メモリキャッシュ。save は失敗時 throw。
 * - モック: listFallback / saveFallback（Storage 等）。
 * - 画面同期: changeEvent（admin-window-events）
 *
 * @see ./README.md
 */
export function createAdminRowStore<T>(cfg: RowStoreConfig<T>) {
  function notify() {
    dispatchAdminEvent(cfg.changeEvent);
  }

  function list(): T[] {
    if (ADMIN_USES_LIVE_API) {
      const cached = cfg.getCache();
      return cached ? cfg.cloneRows(cached) : [];
    }
    return cfg.listFallback();
  }

  async function loadFromApi(): Promise<T[]> {
    if (!ADMIN_USES_LIVE_API) return list();
    const res = await fetch(cfg.apiPath, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${cfg.loadErrorCode}:${res.status}`);
    const json = (await res.json()) as { data?: T[] };
    cfg.setCache(Array.isArray(json.data) ? json.data : []);
    notify();
    return list();
  }

  /**
   * LIVE 失敗時は throw（呼び出し側で flash）。キャッシュは元に戻す。
   * 成功時は保存後の配列を返す（管理画面はこれで setRows すれば Event 購読不要）。
   * notify は公開側（SponsorAd 等）向けに残す。
   */
  async function save(rows: T[]): Promise<T[]> {
    const prepared = cfg.prepareSave ? cfg.prepareSave(rows) : rows;
    if (ADMIN_USES_LIVE_API) {
      const previous = cfg.getCache();
      cfg.setCache(cfg.cloneRows(prepared));
      notify();
      const res = await fetch(cfg.apiPath, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepared),
      });
      if (!res.ok) {
        cfg.setCache(previous);
        notify();
        throw new Error(`${cfg.saveErrorCode}:${res.status}`);
      }
      return cfg.cloneRows(prepared);
    }
    cfg.saveFallback(prepared);
    return cfg.cloneRows(prepared);
  }

  function subscribe(onChange: () => void) {
    return subscribeAdminEvent(cfg.changeEvent, onChange);
  }

  return { list, loadFromApi, save, subscribe, notify };
}
