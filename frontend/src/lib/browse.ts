import type { PublicListItem } from "./types";
import type { BrowseKind } from "./content-kind";

export type { BrowseKind } from "./content-kind";

export type BrowseContext = {
  kind: BrowseKind;
  index: number;
  total: number;
  prev: PublicListItem | null;
  next: PublicListItem | null;
  /** 戻る先（一覧 or 一つ前の詳細） */
  backHref: string;
  /** BrowseBar 左の文言 */
  backLabel: "一覧" | "戻る";
};

export function defaultBrowseLabel(kind: BrowseKind): string {
  return kind === "coordinates" ? "新着コーデ" : "新着アイテム";
}

export function buildBrowseContext(
  kind: BrowseKind,
  id: string,
  list: PublicListItem[],
  backHref = "/",
  backLabel: "一覧" | "戻る" = "一覧",
): BrowseContext {
  const index = list.findIndex((item) => item.id === id);

  if (index < 0) {
    return {
      kind,
      index: -1,
      total: list.length,
      prev: null,
      next: null,
      backHref,
      backLabel,
    };
  }

  return {
    kind,
    index,
    total: list.length,
    prev: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
    backHref,
    backLabel,
  };
}
