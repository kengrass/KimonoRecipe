import type { ContentVisibility } from "./types";
import { MOCK_OWNER_USER } from "./mock-data";
import { CDN_ORIGIN } from "./config";
import type { PublicListItem } from "./types";

/**
 * コンテンツ単位の公開範囲（モック）。
 * 未指定は public。所有者本人のマイページ以外では public のみ見える。
 */
export const MOCK_CONTENT_VISIBILITY: Record<string, ContentVisibility> = {
  PrivCoord1: "private",
  PrivCoord2: "private",
  PrivItem1: "private",
};

export function getContentVisibility(id: string): ContentVisibility {
  return MOCK_CONTENT_VISIBILITY[id] ?? "public";
}

export function isPubliclyVisible(id: string): boolean {
  return getContentVisibility(id) === "public";
}

/** 所有者マイページ用：非公開（自分のみ）のダミー投稿 */
export const OWNER_PRIVATE_COORDINATES: PublicListItem[] = [
  {
    id: "PrivCoord1",
    title: "（非公開）試し着コーデ",
    image_url: `${CDN_ORIGIN}/_b/created/square/d67111f9bd916c91cc0263abf6245bd9b91c32c0.jpg?20211113181453`,
    user: MOCK_OWNER_USER,
    posted_at: "2025-12-01T10:00:00+09:00",
    tags: ["非公開", "冬"],
    seasons: ["冬"],
    detail_url: "/c/PrivCoord1",
    gender: "men",
    obi_knot: "貝の口",
  },
  {
    id: "PrivCoord2",
    title: "（非公開）来季用メモ",
    image_url: `${CDN_ORIGIN}/_b/created/square/f46b9c5bf24fd969751e2a8b50302c44860a96c3.jpeg?20220211222557`,
    user: MOCK_OWNER_USER,
    posted_at: "2026-01-15T09:00:00+09:00",
    tags: ["春"],
    seasons: ["春"],
    detail_url: "/c/PrivCoord2",
    gender: "men",
    obi_knot: "創作帯結び",
  },
];

export const OWNER_PRIVATE_ITEMS: PublicListItem[] = [
  {
    id: "PrivItem1",
    title: "（非公開）修理中の帯",
    image_url: `${CDN_ORIGIN}/_b/created/square/55d19f8888dfef220c7e8411904a43ddb7f50705.jpeg?20211113180007`,
    user: MOCK_OWNER_USER,
    posted_at: "2025-11-20T14:00:00+09:00",
    tags: ["非公開", "角帯"],
    seasons: [],
    detail_url: "/i/PrivItem1",
    gender: "men",
    category: "角帯",
  },
];

/** 編集・詳細・バッジで共通（公開／非公開） */
export const CONTENT_VISIBILITY_LABEL: Record<ContentVisibility, string> = {
  public: "公開",
  private: "非公開",
};
