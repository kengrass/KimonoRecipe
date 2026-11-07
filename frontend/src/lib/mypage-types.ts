/**
 * マイページ／プロフィール用の型定義。
 * 集計ロジックは mypage-query、サマリー組み立ては mypage-data。
 *
 * 命名（ユーザー定義 vs システム）:
 * - my_folder / myFolders … コーデの Myフォルダ
 * - my_categories / myCategories … アイテムの Myカテゴリ
 * - category … システムの公式カテゴリ（アイテム必須）
 */
import type { ContentVisibility, PublicListItem, PublicUser } from "./types";

export type MypageMainTab = "coordinates" | "items";
/** 本番相当：季節 / Myフォルダ / 仮コーデ */
export type MypageCoordinateView = "season" | "my_folder" | "temp";
export type MypageSeason = "all" | "春" | "夏" | "秋" | "冬";
export type MypageCoordinateSort =
  | "newest"
  | "worn"
  | "links_desc"
  | "links_asc";
/** 現行サイトのアイテム並びと揃える */
export type MypageItemSort =
  | "category"
  | "newest"
  | "links_desc"
  | "links_asc"
  | "favorite_desc"
  | "favorite_asc";

/** マイページ一覧の Myフォルダ1件（集計チップ用） */
export type MypageMyFolder = {
  id: string;
  name: string;
  count: number;
};

export type MypageListItem = PublicListItem & {
  visibility: ContentVisibility;
  visibilityLabel: string;
  /** モック：季節タグ（春夏秋冬） */
  season?: MypageSeason | null;
  /** モック：紐付け数 */
  linkCount: number;
  /** 着用日（YYYY-MM-DD）。未設定は null。着用日順ではこれがあるものだけ */
  wornOn?: string | null;
};

export type MypageItem = MypageListItem & {
  /** システムカテゴリ */
  category: string;
  /** ユーザーが付けた Myカテゴリ（任意・複数可） */
  myCategories: string[];
  /** 断捨離候補フラグ */
  declutterCandidate: boolean;
  /** お気に入り度（1〜5）。未設定は null */
  favoriteRank: number | null;
};

export type MypageCategoryOption = {
  name: string;
  count: number;
};

/**
 * アイテム一覧のカテゴリ表示モード。
 * - system … 公式 category
 * - my_categories … ユーザー Myカテゴリ
 * - declutter … 断捨離候補
 */
export type MypageItemCategoryMode = "system" | "my_categories" | "declutter";

export type ProfileLink = { label: string; href: string };
export type ProfileSns = {
  kind: "x" | "facebook" | "instagram" | "youtube" | "tiktok";
  href: string;
  label: string;
};

export type MypageSummary = {
  user: PublicUser;
  /** 所有者本人のマイページか（非公開も見える） */
  isOwnerView: boolean;
  coordinateCount: number;
  itemCount: number;
  myFolders: MypageMyFolder[];
  coordinates: MypageListItem[];
  tempCoordinates: MypageListItem[];
  items: MypageItem[];
  itemCategories: MypageCategoryOption[];
  itemMyCategories: MypageCategoryOption[];
  itemDeclutterCategories: MypageCategoryOption[];
  declutterCount: number;
  coordinatesByMyFolder: Record<string, MypageListItem[]>;
  seasonCounts: Record<MypageSeason, number>;
  bio: string;
  profileLinks: ProfileLink[];
  sns: ProfileSns[];
  topTags: { name: string; count: number }[];
  mySize: { label: string; value: string }[];
  publicSize: { label: string; value: string }[];
  hasBio: boolean;
  hasMySize: boolean;
  hasPublicSize: boolean;
};
