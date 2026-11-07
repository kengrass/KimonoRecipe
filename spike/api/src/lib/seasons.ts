export const CONTENT_SEASONS = ["春", "夏", "秋", "冬"] as const;
export type ContentSeason = (typeof CONTENT_SEASONS)[number];

export function seasonsFromTags(tags: string[]): ContentSeason[] {
  return CONTENT_SEASONS.filter((s) => tags.includes(s));
}

export function isContentSeason(value: string): value is ContentSeason {
  return (CONTENT_SEASONS as readonly string[]).includes(value);
}
