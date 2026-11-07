import type { PublicListItem } from "./types";

const PLACEHOLDER_TITLES = new Set(["コーディネート詳細", "アイテム詳細"]);

/** 表示用タイトル。未設定・プレースホルダーは null（詰める） */
export function displayTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed || PLACEHOLDER_TITLES.has(trimmed)) return null;
  return trimmed;
}

/** 一覧タイルの a11y / title 用ラベル */
export function listItemLabel(item: PublicListItem): string {
  return displayTitle(item.title) ?? item.category ?? item.user.name;
}

/** シェア等のフォールバックラベル */
export function detailShareLabel(
  title: string,
  fallback: string,
): string {
  return displayTitle(title) ?? fallback;
}

/**
 * コーデ詳細のメタ／シェア用ラベル。
 * タイトルが空なら帯結び（必須）を出す。
 */
export function coordinateDetailLabel(
  title: string,
  obiKnot?: string | null,
  ultimateFallback: string = "コーディネート",
): string {
  return (
    displayTitle(title) ??
    (obiKnot?.trim() || null) ??
    ultimateFallback
  );
}

/**
 * X 等の投稿本文（現行 Laravel と同様：タイトル＋公開本文）。
 * URL は ShareButton 側で別パラメータに載せる。
 */
export function detailShareText(
  titleLabel: string,
  description?: string | null,
): string {
  const body = description?.trim();
  if (!body) return titleLabel;
  if (body === titleLabel) return titleLabel;
  return `${titleLabel}\n\n${body}`;
}
