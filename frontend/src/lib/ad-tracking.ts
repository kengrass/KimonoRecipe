/**
 * 広告の表示／クリック計測。
 * UI は SponsorAd から呼ぶ。
 * impression = ビューアブル（面積の半分以上が連続1秒・IAB 系の一般定義）。
 * いまは ads-store／spike API に累計。本番接続時はこの中身を差し替えればよい。
 */

import { recordAdStat } from "@/lib/admin/ads-store";

export type AdEventType = "impression" | "click";

/** 枠はトップ／コーデ詳細／アイテム詳細のみ */
export type AdPlacement = "home_top" | "coord_detail" | "item_detail";

export async function trackAdEvent(input: {
  adId: string;
  placement: AdPlacement | string;
  type: AdEventType;
  path?: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (!input.adId) return;
  recordAdStat(input.adId, input.type);
}
