import type {
  PublicCoordinateDetail,
  PublicItemDetail,
} from "./types";

/** ユーザー情報管理：一覧フィールドの対外公開設定 */
export type ListFieldVisibility = "public" | "private";

/**
 * Myフォルダ / Myカテゴリの公開設定（ユーザー単位）。
 * フィールド名は詳細APIのキーと揃える（`my_folder` / `my_categories`）。
 */
export type UserListPrivacy = {
  my_folder_visibility: ListFieldVisibility;
  my_categories_visibility: ListFieldVisibility;
};

const DEFAULT_PRIVACY: UserListPrivacy = {
  my_folder_visibility: "private",
  my_categories_visibility: "private",
};

/** モック：ユーザーごとの公開設定（本番はプロフィール設定 API） */
const MOCK_LIST_PRIVACY: Record<string, UserListPrivacy> = {
  // オーナーは両方公開（公開APIに載る例）
  FL6QQa: {
    my_folder_visibility: "public",
    my_categories_visibility: "public",
  },
  // デモ投稿者は両方自分のみ（公開APIに載せない例）
  "6ohruL": {
    my_folder_visibility: "private",
    my_categories_visibility: "private",
  },
  lRTLf6: {
    my_folder_visibility: "private",
    my_categories_visibility: "private",
  },
};

export function getUserListPrivacy(userId: string): UserListPrivacy {
  return MOCK_LIST_PRIVACY[userId] ?? DEFAULT_PRIVACY;
}

/**
 * 公開詳細レスポンス用：ユーザー設定が private なら一覧フィールドを落とす。
 * （クライアントで隠すのではなく、レスポンス自体に載せない）
 */
/** My* は新系契約外。公開詳細はそのまま返す（落とすフィールドなし）。 */
export function applyPublicListPrivacyToCoordinate(
  detail: PublicCoordinateDetail,
): PublicCoordinateDetail {
  void getUserListPrivacy(detail.user.id);
  return detail;
}

export function applyPublicListPrivacyToItem(
  detail: PublicItemDetail,
): PublicItemDetail {
  void getUserListPrivacy(detail.user.id);
  return detail;
}
