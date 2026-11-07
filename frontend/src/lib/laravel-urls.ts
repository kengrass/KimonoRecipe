import { LARAVEL_ORIGIN } from "./config";

/**
 * アプリ内 URL 体系（Next）
 *
 * /                       トップ（新着）
 * /search                 公開検索
 * /c/[id] /i/[id]         公開詳細
 * /m/[id]                 マイページ／プロフィール
 * /likes /following       会員コレクション
 * /settings/profile       設定（見た目モック）
 * /compose/*              投稿・未使用画像（見た目モック）
 * /sponsors               協賛の説明・申し込み
 */
export const APP_ROUTES = {
  home: "/",
  search: "/search",
  coordinate: (id: string) => `/c/${id}`,
  item: (id: string) => `/i/${id}`,
  profile: (id: string) => `/m/${id}`,
  following: "/following",
  likes: "/likes",
  login: "/login",
  regist: "/regist",
  /** 設定（見た目モック） */
  profileSettings: "/settings/profile",
  /**
   * 設定へのディープリンク。
   * tab: profile | account（旧 mypage は無視される）
   * panel: bio
   */
  profileSettingsEntry: (opts?: {
    tab?: "profile" | "account" | "mypage";
    panel?: "bio" | "category" | "folder";
  }) => {
    const params = new URLSearchParams();
    const tab = opts?.tab === "mypage" ? "profile" : opts?.tab;
    if (tab) params.set("tab", tab);
    if (opts?.panel === "bio") params.set("panel", "bio");
    const q = params.toString();
    return q ? `/settings/profile?${q}` : "/settings/profile";
  },
  /** コーデ／アイテム投稿・未使用画像（見た目モック） */
  addCoordinate: "/compose/coordinate",
  addItem: "/compose/item",
  unusedImages: "/compose/unused-images",
  /** 運営管理（モック） */
  admin: "/admin",
  /** 協賛の説明・申し込み */
  sponsors: "/sponsors",
} as const;

/** 既存 Laravel への導線 */
export const LARAVEL = {
  home: LARAVEL_ORIGIN,
  login: `${LARAVEL_ORIGIN}/`,
  regist: `${LARAVEL_ORIGIN}/regist`,
  search: `${LARAVEL_ORIGIN}/search`,
  mypage: `${LARAVEL_ORIGIN}/mypage`,
  password: `${LARAVEL_ORIGIN}/password`,
  addCoordinate: `${LARAVEL_ORIGIN}/mypage/coordinate/edit?back=coordinate`,
  /** 仮コーデ追加（本番の仮コーデ一覧からの導線相当） */
  addTempCoordinate: `${LARAVEL_ORIGIN}/mypage/coordinate/edit?back=coordinate&temp=1`,
  addItem: `${LARAVEL_ORIGIN}/mypage/item/edit?back=item`,
  unusedImages: `${LARAVEL_ORIGIN}/mypage/upload?show=init`,
  about: `${LARAVEL_ORIGIN}/about.html`,
  terms: `${LARAVEL_ORIGIN}/terms.html`,
  privacy: `${LARAVEL_ORIGIN}/privacy.html`,
  faq: "https://blog.kimonorecipe.com/faq/",
} as const;
