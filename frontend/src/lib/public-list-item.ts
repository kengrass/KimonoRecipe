import type {
  ContentSeason,
  PublicCoordinateDetail,
  PublicItemDetail,
  PublicListItem,
} from "./types";

const SEASONS = ["春", "夏", "秋", "冬"] as const;

/** tags / title から季節を拾う。無ければ [] */
export function seasonsFromText(
  title: string,
  tags: string[],
): ContentSeason[] {
  const hay = [title, ...tags];
  return SEASONS.filter((s) => hay.some((t) => t.includes(s)));
}

/** 詳細レスポンス → 一覧1件（公開APIの一覧形） */
export function coordinateDetailToList(
  d: PublicCoordinateDetail,
): PublicListItem {
  return {
    id: d.id,
    title: d.title,
    image_url: d.images[0] ?? "",
    user: d.user,
    posted_at: d.posted_at,
    tags: d.tags,
    seasons: seasonsFromText(d.title, d.tags),
    detail_url: `/c/${d.id}`,
    gender: d.gender,
    obi_knot: d.obi_knot,
  };
}

/** 詳細レスポンス → 一覧1件（公開APIの一覧形） */
export function itemDetailToList(d: PublicItemDetail): PublicListItem {
  const tags = d.tags.length ? d.tags : [d.category];
  return {
    id: d.id,
    title: d.title,
    image_url: d.images[0] ?? "",
    user: d.user,
    posted_at: d.posted_at,
    tags,
    seasons: seasonsFromText(d.title, tags),
    detail_url: `/i/${d.id}`,
    gender: d.gender,
    category: d.category,
  };
}
