/** 本番 Laravel のオリジン（編集画面など既存導線） */
export const LARAVEL_ORIGIN = "https://www.kimonorecipe.com";

/** CloudFront 画像ベース */
export const CDN_ORIGIN = "https://d2z0ysf6sthedw.cloudfront.net";

/**
 * 公開サイトのオリジン（canonical / OGP / sitemap）。
 * 並走ホストでは検証 URL を設定。未設定時は LARAVEL_ORIGIN。
 * @see getSiteUrl in lib/seo.ts
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || LARAVEL_ORIGIN;

/**
 * 本番接続時は NEXT_PUBLIC_API_BASE_URL を設定する想定。
 * 未設定時はモックデータを返す。
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * spike 自前 API への接続スイッチ（試作）。
 * `SPIKE_API_ORIGIN`（サーバ rewrite）＋ `NEXT_PUBLIC_USE_SPIKE_API=1`。
 * @see spike/README.md
 */
export const USE_SPIKE_API =
  process.env.NEXT_PUBLIC_USE_SPIKE_API === "1" ||
  Boolean(process.env.SPIKE_API_ORIGIN);

/** 未設定時はモックデータ。本番／spike 接続時は false */
export const USE_MOCK_API = !API_BASE_URL && !USE_SPIKE_API;

/**
 * ステージ／本番の安全弁。`KR_REQUIRE_LIVE_API=1` のときモック起動を拒否。
 * @see docs/OPS_SECURITY.md §1
 */
if (process.env.KR_REQUIRE_LIVE_API === "1" && USE_MOCK_API) {
  throw new Error(
    "KR_REQUIRE_LIVE_API=1 ですが API／spike が未設定です。NEXT_PUBLIC_API_BASE_URL か spike を設定してください。",
  );
}

/**
 * 琥珀色のモック認証バー等。モック時のみ表示。
 * 実 API / spike 接続後は出さない。
 */
export const SHOW_MOCK_DEV_CHROME = USE_MOCK_API;

/** spike セッション Cookie 名（spike/api と一致） */
export const SPIKE_SESSION_COOKIE = "kr_spike_session";
