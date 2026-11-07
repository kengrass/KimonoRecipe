"use client";

import { ADMIN_USES_LIVE_API } from "@/lib/admin/admin-fetch";
import {
  dispatchAdminEvent,
  subscribeAdminEvent,
} from "@/lib/admin/admin-window-events";
import { createAdminRowStore } from "@/lib/admin/create-row-store";
import { ADMIN_ADS } from "@/lib/admin/mock-data";
import { isWithinScheduleYmd } from "@/lib/admin/schedule";
import type { AdminAd, AdminAdPlacement } from "@/lib/admin/types";

/**
 * 純広告案件ストア。
 *
 * - LIVE: GET/PUT `/api/admin/ads`（メモリキャッシュ）
 * - モック: localStorage `kr-admin-ads-v4`
 * - 同期: CHANGE（CRUD）と STATS（表示／クリック加算のみ・再抽選しない）の2イベント
 *
 * @see ./README.md
 */
const STORAGE_KEY = "kr-admin-ads-v4";
/** 案件の追加・編集・削除 */
const CHANGE_EVENT = "kr-admin-ads";
/** 表示／クリック加算のみ（配信の再抽選はしない） */
const STATS_EVENT = "kr-admin-ads-stats";

let spikeCache: AdminAd[] | null = null;

function readStorage(): AdminAd[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminAd[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStorage(
  rows: AdminAd[],
  opts?: { statsOnly?: boolean },
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  dispatchAdminEvent(opts?.statsOnly ? STATS_EVENT : CHANGE_EVENT);
}

const store = createAdminRowStore<AdminAd>({
  changeEvent: CHANGE_EVENT,
  apiPath: "/api/admin/ads",
  loadErrorCode: "ads_load_failed",
  saveErrorCode: "ads_save_failed",
  getCache: () => spikeCache,
  setCache: (rows) => {
    spikeCache = rows;
  },
  cloneRows: (rows) => rows.map((a) => ({ ...a })),
  listFallback: () => readStorage() ?? ADMIN_ADS.map((a) => ({ ...a })),
  saveFallback: (rows) => writeStorage(rows),
});

export function listAdminAds(): AdminAd[] {
  return store.list();
}

/** LIVE: サーバから案件を読み込む */
export async function loadAdminAdsFromApi(): Promise<AdminAd[]> {
  return store.loadFromApi();
}

export async function saveAdminAds(rows: AdminAd[]): Promise<AdminAd[]> {
  return store.save(rows);
}

/** 表示／クリックを案件に加算（期間全体の累計） */
export function recordAdStat(
  adId: string,
  type: "impression" | "click",
): void {
  if (ADMIN_USES_LIVE_API) {
    void fetch("/api/public/ads/events", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId, type }),
    }).then(() => {
      if (spikeCache) {
        spikeCache = spikeCache.map((ad) => {
          if (ad.id !== adId) return ad;
          return type === "impression"
            ? { ...ad, impressions: ad.impressions + 1 }
            : { ...ad, clicks: ad.clicks + 1 };
        });
        dispatchAdminEvent(STATS_EVENT);
      }
    });
    return;
  }
  const rows = listAdminAds();
  let hit = false;
  const next = rows.map((ad) => {
    if (ad.id !== adId) return ad;
    hit = true;
    if (type === "impression") {
      return { ...ad, impressions: ad.impressions + 1 };
    }
    return { ...ad, clicks: ad.clicks + 1 };
  });
  if (!hit) return;
  writeStorage(next, { statsOnly: true });
}

/** LIVE: サーバ抽選のみ（失敗時は null。モック種へ黙って落とさない） */
export async function pickAdForPlacementAsync(
  placement: AdminAdPlacement | string,
): Promise<AdminAd | null> {
  if (ADMIN_USES_LIVE_API) {
    try {
      const res = await fetch(
        `/api/public/ads/pick?placement=${encodeURIComponent(placement)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: AdminAd | null };
      return json.data ?? null;
    } catch {
      return null;
    }
  }
  return pickAdForPlacement(placement);
}

export function getAdminAd(id: string): AdminAd | null {
  return listAdminAds().find((a) => a.id === id) ?? null;
}

/** 管理の「配信中」＝ON かつ掲載期間内 */
export function isAdDelivering(ad: AdminAd): boolean {
  return ad.enabled && isWithinScheduleYmd(ad.startOn, ad.endOn);
}

/**
 * 枠に出す案件。有効かつ期間内のうちからランダム1件。
 * 同じ枠に複数売っても配信が偏らないようにする。
 */
export function pickAdForPlacement(
  placement: AdminAdPlacement | string,
): AdminAd | null {
  const candidates = listAdminAds().filter(
    (ad) =>
      ad.enabled &&
      ad.imageUrl &&
      ad.placements.includes(placement as AdminAdPlacement) &&
      isWithinScheduleYmd(ad.startOn, ad.endOn),
  );
  if (!candidates.length) return null;
  const i = Math.floor(Math.random() * candidates.length);
  return candidates[i] ?? null;
}

/** 公開側（SponsorAd）用。管理画面は購読しない */
export function subscribeAdminAds(onChange: () => void) {
  return store.subscribe(onChange);
}

/** モック実績加算の他タブ反映用（管理一覧は購読しない） */
export function subscribeAdminAdStats(onChange: () => void) {
  const offStats = subscribeAdminEvent(STATS_EVENT, onChange);
  if (typeof window === "undefined") return offStats;
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    offStats();
    window.removeEventListener("storage", onStorage);
  };
}

export const ADMIN_AD_PLACEMENT_OPTIONS: {
  id: AdminAdPlacement;
  label: string;
}[] = [
  { id: "home_top", label: "トップ" },
  { id: "coord_detail", label: "コーデ詳細" },
  { id: "item_detail", label: "アイテム詳細" },
];

export function placementLabel(id: AdminAdPlacement): string {
  return ADMIN_AD_PLACEMENT_OPTIONS.find((p) => p.id === id)?.label ?? id;
}

export function adCtr(ad: AdminAd): number {
  return ad.impressions > 0 ? ad.clicks / ad.impressions : 0;
}

/** 広告主に渡すテキスト（クリップボード用） */
export function buildAdvertiserReportText(ad: AdminAd): string {
  const ctr = adCtr(ad);
  const ymdSlash = (ymd: string) => ymd.replaceAll("-", "/");
  const period =
    ad.startOn || ad.endOn
      ? `${ad.startOn ? ymdSlash(ad.startOn) : "開始未設定"} 〜 ${ad.endOn ? ymdSlash(ad.endOn) : "終了未設定"}`
      : "期間指定なし";
  const advertiser = ad.advertiser.trim();
  const honorific =
    advertiser && !/[様殿]$/.test(advertiser) ? `${advertiser} 様` : advertiser;
  const outDate = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  return [
    "きものレシピ 広告実績レポート",
    "--------------------------------",
    `広告主: ${honorific}`,
    `案件名: ${ad.name}`,
    `掲載期間: ${period}`,
    `配信枠: ${ad.placements.map(placementLabel).join(" / ") || "なし"}`,
    `リンク: ${ad.href}`,
    "",
    "【実績】",
    `表示回数: ${ad.impressions.toLocaleString("ja-JP")}`,
    `クリック: ${ad.clicks.toLocaleString("ja-JP")}`,
    `CTR: ${(ctr * 100).toFixed(2)}%`,
    "",
    `出力日: ${outDate}`,
  ].join("\n");
}

export async function copyAdvertiserReport(ad: AdminAd): Promise<boolean> {
  const body = buildAdvertiserReportText(ad);
  try {
    await navigator.clipboard.writeText(body);
    return true;
  } catch {
    return false;
  }
}

/** 広告主単位で全案件の文面を結合してコピー */
export async function copyAdvertiserReportsBundle(
  ads: AdminAd[],
): Promise<boolean> {
  const body = ads
    .map((ad) => buildAdvertiserReportText(ad))
    .join("\n\n================\n\n");
  try {
    await navigator.clipboard.writeText(body || "実績データがありません。");
    return true;
  } catch {
    return false;
  }
}
