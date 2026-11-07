/**
 * コンテンツ種別（コーデ／アイテム）。
 *
 * コード・型では常に長い名前を使う。
 * URL・一部の短いクエリだけ `c` / `i`（下のヘルパーで変換）。
 */
export type ContentKind = "coordinates" | "items";

/**
 * 検索タブ。
 * コーデ／アイテムに加え、ユーザー検索（`m=u`）。
 */
export type SearchMode = ContentKind | "users";

/** 一覧↔詳細の前後ナビでも同じ区分 */
export type BrowseKind = ContentKind;

export function contentKindToShort(kind: ContentKind): "c" | "i" {
  return kind === "items" ? "i" : "c";
}

/** URL の m=c|i など → ContentKind（未知は coordinates） */
export function contentKindFromShort(raw?: string | null): ContentKind {
  return raw === "i" || raw === "items" ? "items" : "coordinates";
}

export function searchModeToShort(mode: SearchMode): "c" | "i" | "u" {
  if (mode === "items") return "i";
  if (mode === "users") return "u";
  return "c";
}

/** URL の m=c|i|u → SearchMode（未知は coordinates） */
export function searchModeFromShort(raw?: string | null): SearchMode {
  if (raw === "i" || raw === "items") return "items";
  if (raw === "u" || raw === "users") return "users";
  return "coordinates";
}

/**
 * sessionStorage 等の旧値 `"c"|"i"` と新値の両方を受理。
 * 不正なら null。
 */
export function parseStoredContentKind(value: unknown): ContentKind | null {
  if (value === "coordinates" || value === "c") return "coordinates";
  if (value === "items" || value === "i") return "items";
  return null;
}

export function contentKindLabel(
  kind: ContentKind,
  form: "short" | "long" = "long",
): string {
  if (kind === "coordinates") {
    return form === "short" ? "コーデ" : "コーディネート";
  }
  return "アイテム";
}
