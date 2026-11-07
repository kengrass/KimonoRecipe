/** 現行 /search のフィルター定義 */

export type { ContentKind, SearchMode } from "./content-kind";

export const SEARCH_GENDERS = [
  { value: "all", label: "すべて" },
  { value: "women", label: "女性" },
  { value: "men", label: "男性" },
  { value: "kids", label: "キッズ" },
] as const;

export type SearchGender = (typeof SEARCH_GENDERS)[number]["value"];

export const SEARCH_SEASONS = ["春", "夏", "秋", "冬"] as const;

export const SEARCH_CATEGORIES = [
  "袷",
  "単衣",
  "薄物",
  "浴衣",
  "袋帯",
  "名古屋帯",
  "半幅帯",
  "兵児帯",
  "角帯",
  "その他帯",
  "帯揚",
  "帯締",
  "帯留",
  "アウター",
  "羽織",
  "羽織紐",
  "袴",
  "半襟",
  "襦袢",
  "下着類",
  "足袋",
  "履物",
  "髪飾",
  "根付",
  "アクセサリー",
  "帽子",
  "バッグ",
  "反物",
  "その他",
  "断捨離済",
] as const;

/** アイテム任意：色調（リストから単数選択） */
export const ITEM_COLOR_TONES = [
  "白系",
  "黒系",
  "グレー系",
  "ベージュ系",
  "茶系",
  "赤系",
  "ピンク系",
  "橙系",
  "黄系",
  "緑系",
  "青系",
  "紫系",
  "その他",
] as const;

export const SEARCH_OBI_KNOTS = [
  "二重太鼓",
  "角出し",
  "扇太鼓",
  "ふくら雀",
  "立て矢結び",
  "文庫結び",
  "一重太鼓",
  "銀座結び",
  "貝の口",
  "一文字結び",
  "片流し結び",
  "浪人結び",
  "カルタ結び",
  "風船太鼓",
  "帯結ばない帯結び",
  "創作帯結び",
] as const;

export type SearchSeason = (typeof SEARCH_SEASONS)[number];
export type SearchCategory = (typeof SEARCH_CATEGORIES)[number];
export type SearchObiKnot = (typeof SEARCH_OBI_KNOTS)[number];
export type ItemColorTone = (typeof ITEM_COLOR_TONES)[number];
/** アイテム所有者任意：お気に入り（5＝最高〜1） */
export type ItemFavoriteRank = 1 | 2 | 3 | 4 | 5;

/** 検索UI用。断捨離済はマイページ側の話なので検索フィルタには出さない */
export const SEARCH_FILTER_CATEGORIES = SEARCH_CATEGORIES.filter(
  (c) => c !== "断捨離済",
);
