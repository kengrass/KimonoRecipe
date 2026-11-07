/** 公開一覧・詳細で共通する投稿者 */
export type PublicUser = {
  id: string;
  name: string;
  /** 相対パス推奨（例: /m/FL6QQa）。絶対URLも可 */
  profile_url: string;
  /** 任意。相対 or CDN URL */
  avatar_url?: string | null;
};

/**
 * GET /api/public/users/{id}
 * マイページ上部の「公開プロフィール」（名刺）。
 * 非公開の自己紹介・サイズ等は載せない。無いユーザーは 404。
 */
export type PublicUserProfile = {
  id: string;
  name: string;
  profile_url: string;
  /** 任意。相対 or CDN URL */
  avatar_url?: string | null;
  /** 公開自己紹介。未設定は "" または省略 */
  bio?: string;
  profile_links?: { label: string; href: string }[];
  sns?: {
    kind: "x" | "facebook" | "instagram" | "youtube" | "tiktok";
    href: string;
    label: string;
  }[];
  /**
   * 公開してよいマイサイズのみ（例: 身長・身丈）。
   * 非公開項目は載せない。
   */
  public_size?: { label: string; value: string }[];
};

/**
 * GET /api/public/users の一覧1件。
 * 名刺の要約（検索結果用）。詳細リンクは profile_url。
 */
export type PublicUserListItem = {
  id: string;
  name: string;
  profile_url: string;
  avatar_url?: string | null;
  /** 公開自己紹介。未設定は "" または省略 */
  bio?: string;
};

/**
 * コンテンツの公開範囲（登録時必須）。
 * 公開APIは `public` のみ返す。値自体は owner API の `owner_status` で返す。
 */
export type ContentVisibility = "public" | "private";

/** 性別（登録時必須）。検索フィルタ `g=` と対応 */
export type ContentGender = "women" | "men" | "kids";

/** 季節。検索フィルタ `season=` と対応（複数可） */
export type ContentSeason = "春" | "夏" | "秋" | "冬";

/**
 * GET /api/public/coordinates ・ /api/public/items の一覧1件
 * （トップ新着・検索結果も同型）
 *
 * 必須キー: id, image_url, user, posted_at, gender, detail_url, title, tags, seasons
 * （title は "" 可、tags / seasons は [] 可）
 * アイテム一覧では category も必須（obi_knot は載せない）
 * コーデ一覧では obi_knot も必須（category は載せない）
 *
 * 契約: docs/API_CONTRACT.md ・ docs/HANDOFF.md
 * 見本: mocks/api/public/coordinates/list.json ・ items/list.json
 */
export type PublicListItem = {
  id: string;
  /** 任意。未設定は "" */
  title: string;
  image_url: string;
  user: PublicUser;
  posted_at: string;
  tags: string[];
  /**
   * 季節（複数可）。検索の season フィルタ用。
   * 未設定は []（その場合シーズン絞り込みではヒットしない）
   */
  seasons: ContentSeason[];
  detail_url: string;
  gender: ContentGender;
  /** アイテム一覧で必須。コーデ一覧では省略可 */
  category?: string;
  /** コーデ一覧で必須。アイテム一覧では省略 */
  obi_knot?: string | null;
  /**
   * 仮コーデ。owner の used_in などでのみ付ける（公開一覧の本線には載せない）。
   */
  is_temp?: boolean;
  like_count?: number;
};

/** コーデ詳細内の使用アイテム */
export type CoordinateItemRef = {
  id: string;
  /** 任意。未設定は "" */
  title: string;
  /** 必須（システムカテゴリ） */
  category: string;
  image_url: string;
  detail_url: string;
};

/**
 * GET /api/public/coordinates/{id}
 *
 * 必須: id, images(1枚以上), gender, obi_knot, user, posted_at
 * 任意: title, description, tags
 * Myフォルダは新系契約外（フィールドを載せて返さない）。
 */
export type PublicCoordinateDetail = {
  id: string;
  /** 任意。未設定は "" */
  title: string;
  description: string;
  images: string[];
  user: PublicUser;
  posted_at: string;
  tags: string[];
  like_count: number;
  gender: ContentGender;
  /** 帯結び（登録時必須） */
  obi_knot: string;
  items: CoordinateItemRef[];
  related_coordinates: PublicListItem[];
  og: {
    title: string;
    description: string;
    image_url: string;
  };
};

/**
 * GET /api/public/items/{id}
 *
 * 必須: id, category, images(1枚以上), gender, user, posted_at
 * 任意: title, description, tags
 * Myカテゴリは新系契約外（フィールドを載せて返さない）。
 * `color_tone` は UI 廃止・公開レスポンスに載せない。
 */
export type PublicItemDetail = {
  id: string;
  /** 任意。未設定は "" */
  title: string;
  description: string;
  /** システムカテゴリ（必須） */
  category: string;
  images: string[];
  user: PublicUser;
  posted_at: string;
  tags: string[];
  like_count: number;
  gender: ContentGender;
  used_in_coordinates: PublicListItem[];
  related_items: PublicListItem[];
  og: {
    title: string;
    description: string;
    image_url: string;
  };
};

/** GET /api/owner/coordinates/{id} — 所有者のみ。公開詳細と同一項目＋以下 */
export type OwnerCoordinateFields = {
  id: string;
  edit_url: string;
  add_coordinate_item_url: string;
  private_note: string;
  /** 公開範囲（登録時必須）。JSON キーは owner_status。UI では visibility として渡す */
  owner_status: ContentVisibility;
  updated_at: string;
  /** 表示回数（所有者のみ） */
  view_count: number;
  /** 着用日（所有者のみ・任意） */
  worn_on?: string | null;
  /** 仮コーデ（所有者のみ） */
  is_temp?: boolean;
};

/**
 * 本人用コーデ詳細（フル）。
 * 公開詳細と同型の項目を重複して持ち、そのうえで OwnerCoordinateFields を載せる。
 * 公開 API に非公開を混ぜない。本人以外は 401/403。
 */
export type OwnerCoordinateDetail = PublicCoordinateDetail & OwnerCoordinateFields;

/** GET /api/owner/items/{id} — 所有者のみ。公開詳細と同一項目＋以下 */
export type OwnerItemFields = {
  id: string;
  edit_url: string;
  add_used_coordinate_url: string;
  private_note: string;
  /** 公開範囲（登録時必須）。JSON キーは owner_status。UI では visibility として渡す */
  owner_status: ContentVisibility;
  updated_at: string;
  /** 表示回数（所有者のみ） */
  view_count: number;
  /**
   * お気に入り度（5＝最高〜1）。未設定は null／省略。
   * 所有者のみ詳細表示。
   */
  favorite_rank?: 1 | 2 | 3 | 4 | 5 | null;
  /**
   * 断捨離候補。true のときマイページの断捨離候補に出る。
   * 所有者のみ。
   */
  declutter_candidate?: boolean;
};

/**
 * 本人用アイテム詳細（フル）。
 * 公開詳細と同型の項目を重複して持ち、そのうえで OwnerItemFields を載せる。
 */
export type OwnerItemDetail = PublicItemDetail & OwnerItemFields;

export type ListPageMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

/** 一覧レスポンス。検索は meta 必須、トップ先頭セットは data のみ可 */
export type ListResponse<T> = {
  data: T[];
  meta?: ListPageMeta;
};

/** モック用ログイン状態（本番ではセッション／Cookie） */
export type MockAuthMode = "guest" | "member" | "owner";
