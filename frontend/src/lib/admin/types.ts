/** 運営管理画面用の型（モック） */

export type AdminUserStatus = "active" | "suspended" | "withdrawn";

export type AdminUser = {
  /** ベース uid */
  id: string;
  /** プレミアム uid（無い場合 null） */
  premiumId: string | null;
  email: string;
  /** メール拒否 */
  mailRejected: boolean;
  name: string;
  status: AdminUserStatus;
  /** 管理用メモ */
  adminNote: string;
  publicCoordinateCount: number;
  privateCoordinateCount: number;
  /** 仮コーデ（temp）件数。非公開本コーデとは別 */
  tempCoordinateCount: number;
  publicItemCount: number;
  privateItemCount: number;
  /**
   * 紐付け率 0–1。
   * 本コーデのうち、アイテムが1件以上付いている割合（件数は問わない）。
   */
  attachmentRate: number;
  imageCount: number;
  /** 会員登録日 ISO */
  registeredAt: string;
  /** 最終利用 ISO */
  lastActiveAt: string;
};

export type ActivityBucketId =
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "180d"
  | "365d"
  | "366d+";

export type ActivityBucket = {
  id: ActivityBucketId;
  label: string;
  /** この帯の人数 */
  count: number;
  /** 全体に対する構成比 0–1 */
  share: number;
  /** 累計人数（若い帯から積む） */
  cumulativeCount: number;
  /** 累計構成比 0–1 */
  cumulativeShare: number;
};

export type AdminKpis = {
  userCount: number;
  /** 本コーデ（仮を除く） */
  coordinateCount: number;
  /** 仮コーデ */
  tempCoordinateCount: number;
  itemCount: number;
  imageCount: number;
  /**
   * サイト全体の紐付け率 0–1。
   * 本コーデのうちアイテム1件以上付き（仮コーデは分母・分子とも対象外）。
   */
  attachmentRate: number;
};

/** サービス利用の実態（日次・内部向け） */
export type UsageDailySnapshot = {
  /** 集計日 yyyy-mm-dd */
  date: string;
  /** ログイン UU（会員） */
  memberUu: number;
  /** 未ログイン UU（匿名ID） */
  guestUu: number;
  /** 合計 PV */
  pv: number;
  /** その日に新規追加されたコーデ数 */
  coordinateCount: number;
  /** その日に新規追加されたアイテム数 */
  itemCount: number;
};export type UsagePagePv = {
  pathLabel: string;
  pv: number;
  memberShare: number;
};

export type UsageContentRank = {
  id: string;
  kind: "coordinate" | "item";
  title: string;
  pv: number;
};

export type UsageSearchRow = {
  query: string;
  count: number;
  zeroHit: boolean;
};

export type UsageFunnel = {
  detailViews: number;
  authPromptShown: number;
  loginOrRegist: number;
};

export type UsageInsight = {
  today: UsageDailySnapshot;
  /** 直近7日分（古い→新しい） */
  last7Days: UsageDailySnapshot[];
  pagePv: UsagePagePv[];
  topCoordinates: UsageContentRank[];
  topItems: UsageContentRank[];
  searches: UsageSearchRow[];
  funnel: UsageFunnel;
};

/**
 * スポンサー向け月次実績。
 * 型・モック種のみ。管理 UI／API 未接続（後続）。
 */
export type SponsorMonthlyReport = {
  /** yyyy-mm */
  month: string;
  label: string;
  reachUu: number;
  memberUu: number;
  guestUu: number;
  pv: number;
  /** 前月比（reach）。null は比較なし */
  reachMom: number | null;
  placements: {
    id: string;
    name: string;
    impressions: number;
    clicks: number;
  }[];
};

/**
 * 売れる枠（在庫）。案件に紐づけて販売する。
 * 同じ枠に有効案件が複数あるときはランダム配信。
 */
export type AdminAdPlacement =
  | "home_top"
  | "coord_detail"
  | "item_detail";

/**
 * フッター上の協賛ロゴ（看板商品）。
 * 純広告案件とは別。CTR実績は出さない。
 */
export type AdminLogoSponsor = {
  id: string;
  sponsorName: string;
  /** ロゴ画像。無ければ sponsorName をテキスト表示 */
  logoUrl: string;
  href: string;
  /** 営業メモ用（例: 袋帯カテゴリ協賛）。表示には出さないことも可 */
  packageNote: string;
  enabled: boolean;
  /** 掲載開始（yyyy-mm-dd・任意） */
  startOn: string;
  /** 掲載終了（yyyy-mm-dd・任意） */
  endOn: string;
  sortOrder: number;
};

/** 広告案件（＝売れる単位・実績の単位） */
export type AdminAd = {
  id: string;
  /** 社内用の案件名 */
  name: string;
  /** 広告主名（レポート宛名） */
  advertiser: string;
  /** 出す枠（複数可＝パッケージ販売） */
  placements: AdminAdPlacement[];
  href: string;
  imageUrl: string;
  /** 画像下の見出し */
  title: string;
  enabled: boolean;
  /** 掲載開始（yyyy-mm-dd・任意） */
  startOn: string;
  /** 掲載終了（yyyy-mm-dd・任意） */
  endOn: string;
  /** モック実績（本番は計測から集計） */
  impressions: number;
  clicks: number;
};
