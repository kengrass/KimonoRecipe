"use client";

import { ADMIN_USES_LIVE_API } from "@/lib/admin/admin-fetch";
import { dispatchAdminEvent } from "@/lib/admin/admin-window-events";
import { createAdminRowStore } from "@/lib/admin/create-row-store";
import { isWithinScheduleYmd } from "@/lib/admin/schedule";
import type { AdminLogoSponsor } from "@/lib/admin/types";

/**
 * 協賛ロゴストア（フッター上・CTR なし）。
 *
 * - LIVE: GET/PUT `/api/admin/logo-sponsors`
 * - モック: sessionStorage（旧キー v2 も読む）
 * - サイト表示: `listVisibleLogoSponsors`／公開 GET `/api/public/ads/logo-sponsors`
 *
 * @see ./README.md
 */
const STORAGE_KEY = "kr-admin-logo-sponsors-v3";
const CHANGE_EVENT = "kr-admin-logo-sponsors";

let spikeCache: AdminLogoSponsor[] | null = null;

/** モック時の種。セッション未保存時に使う */
export const DEFAULT_LOGO_SPONSORS: AdminLogoSponsor[] = [
  {
    id: "logo-pearltone",
    sponsorName: "デモスポンサーP",
    logoUrl: "/sponsors/pearltone.png",
    href: "https://www.pearltone.com/",
    packageNote: "加工・ケア（営業用サンプル）",
    enabled: true,
    startOn: "2026-01-01",
    endOn: "2026-12-31",
    sortOrder: 1,
  },
  {
    id: "logo-jotaro",
    sponsorName: "デモスポンサーA",
    logoUrl: "/sponsors/jotaro.png",
    href: "https://www.jotaro.net/",
    packageNote: "メーカー・ブランド（営業用サンプル）",
    enabled: true,
    startOn: "2026-01-01",
    endOn: "2026-12-31",
    sortOrder: 2,
  },
  {
    id: "logo-kyo-roman",
    sponsorName: "デモスポンサーB",
    logoUrl: "/sponsors/kyo-roman.png",
    href: "https://kyo-roman.com/",
    packageNote: "小売・呉服店（営業用サンプル）",
    enabled: true,
    startOn: "2026-01-01",
    endOn: "2026-12-31",
    sortOrder: 3,
  },
  {
    id: "logo-nihon-wasou",
    sponsorName: "デモスポンサーC",
    logoUrl: "/sponsors/nihon-wasou.png",
    href: "https://www.wasou.com/",
    packageNote: "着付け・教室（営業用サンプル）",
    enabled: true,
    startOn: "2026-01-01",
    endOn: "2026-12-31",
    sortOrder: 4,
  },
];

/** サイト表示中＝ON かつ掲載期間内 */
export function isLogoSponsorShowing(row: AdminLogoSponsor): boolean {
  return row.enabled && isWithinScheduleYmd(row.startOn, row.endOn);
}

function normalize(row: Partial<AdminLogoSponsor> & { id: string }): AdminLogoSponsor {
  return {
    id: row.id,
    sponsorName: row.sponsorName ?? "",
    logoUrl: row.logoUrl ?? "",
    href: row.href ?? "",
    packageNote: row.packageNote ?? "",
    enabled: row.enabled ?? true,
    startOn: row.startOn ?? "",
    endOn: row.endOn ?? "",
    sortOrder: row.sortOrder ?? 0,
  };
}

function readStorage(): AdminLogoSponsor[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEY) ??
      window.sessionStorage.getItem("kr-admin-logo-sponsors-v2");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminLogoSponsor>[];
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((row): row is Partial<AdminLogoSponsor> & { id: string } =>
        Boolean(row && typeof row.id === "string"),
      )
      .map(normalize);
  } catch {
    return null;
  }
}

function writeStorage(rows: AdminLogoSponsor[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  dispatchAdminEvent(CHANGE_EVENT);
}

function prepareSave(rows: AdminLogoSponsor[]): AdminLogoSponsor[] {
  return [...rows]
    .map(normalize)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row, i) => ({ ...row, sortOrder: i + 1 }));
}

const store = createAdminRowStore<AdminLogoSponsor>({
  changeEvent: CHANGE_EVENT,
  apiPath: "/api/admin/logo-sponsors",
  loadErrorCode: "logo_sponsors_load_failed",
  saveErrorCode: "logo_sponsors_save_failed",
  getCache: () => spikeCache,
  setCache: (rows) => {
    spikeCache = rows;
  },
  cloneRows: (rows) => rows.map((r) => ({ ...r })),
  listFallback: () => readStorage() ?? [...DEFAULT_LOGO_SPONSORS],
  saveFallback: (rows) => writeStorage(rows),
  prepareSave,
});

export function listLogoSponsors(): AdminLogoSponsor[] {
  return store.list();
}

export async function loadLogoSponsorsFromApi(): Promise<AdminLogoSponsor[]> {
  return store.loadFromApi();
}

export async function saveLogoSponsors(
  rows: AdminLogoSponsor[],
): Promise<AdminLogoSponsor[]> {
  return store.save(rows);
}

/** サイト表示用。表示中のみ・並び順 */
export function listVisibleLogoSponsors(): AdminLogoSponsor[] {
  return listLogoSponsors()
    .filter(isLogoSponsorShowing)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function loadVisibleLogoSponsorsFromApi(): Promise<
  AdminLogoSponsor[]
> {
  if (!ADMIN_USES_LIVE_API) return listVisibleLogoSponsors();
  try {
    const res = await fetch("/api/public/ads/logo-sponsors", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: AdminLogoSponsor[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

/** 公開側（SponsorLogoStrip）用。管理画面は購読しない */
export function subscribeLogoSponsors(onChange: () => void) {
  return store.subscribe(onChange);
}
