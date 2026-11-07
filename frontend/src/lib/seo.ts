/**
 * サイト共通のメタ／OGP／インデックス方針。
 * 公開詳細・検索ランディング（カテゴリ／帯結び）のみ積極的に載せる。
 */
import type { Metadata } from "next";
import { SITE_URL } from "./config";
import {
  SEARCH_CATEGORIES,
  SEARCH_OBI_KNOTS,
  type SearchCategory,
  type SearchObiKnot,
} from "./search-filters";
import { buildSearchHref, type SearchState } from "./search-state";

export const SITE_NAME = "きものレシピ";

export const SITE_DESCRIPTION =
  "着物・浴衣のコーディネートとアイテムを記録・共有できるきものレシピ。公開コーデや単衣などのアイテムを探せる。";

/**
 * サイト共通 OGP（マイページ・トップ等）。
 * ユーザー専用画像は持たない。投稿詳細は各投稿の写真を優先。
 * 本番差し替えは `public/og-default.png`。
 */
export const SITE_DEFAULT_OG_IMAGE = "/og-default.png";

/** ログイン専用・投稿／設定などインデックスしない画面用 */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
} as const;

/** @see SITE_URL / NEXT_PUBLIC_SITE_URL in config.ts */
export function getSiteUrl(): string {
  return SITE_URL;
}

export function siteDefaultOgImages(): { url: string }[] {
  return [{ url: absoluteUrl(SITE_DEFAULT_OG_IMAGE) }];
}

/** 相対パスまたは絶対URL → 絶対URL */
export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getSiteUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}

export function isCategorySearchLanding(state: SearchState): boolean {
  return (
    state.mode === "items" &&
    Boolean(state.category) &&
    state.page <= 1 &&
    !state.q &&
    !state.tag &&
    !state.season &&
    !state.obi &&
    state.gender === "all"
  );
}

export function isObiSearchLanding(state: SearchState): boolean {
  return (
    state.mode === "coordinates" &&
    Boolean(state.obi) &&
    state.page <= 1 &&
    !state.q &&
    !state.tag &&
    !state.season &&
    !state.category &&
    state.gender === "all"
  );
}

/** カテゴリ or 帯結びの単独ランディング、または条件なし検索ハブのみ index */
export function isIndexableSearchState(state: SearchState): boolean {
  if (isCategorySearchLanding(state) || isObiSearchLanding(state)) return true;
  return (
    state.page <= 1 &&
    !state.q &&
    !state.tag &&
    !state.season &&
    !state.category &&
    !state.obi &&
    state.gender === "all"
  );
}

export function buildSearchMetadata(state: SearchState): Metadata {
  if (isCategorySearchLanding(state) && state.category) {
    const cat = state.category;
    const title = `${cat}のアイテム`;
    const description = `きものレシピで「${cat}」のアイテムを探す。公開されている着物・帯などの投稿一覧。`;
    const canonical = buildSearchHref({ mode: "items", category: cat });
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title: `${title} | ${SITE_NAME}`,
        description,
        url: absoluteUrl(canonical),
        siteName: SITE_NAME,
        locale: "ja_JP",
        type: "website",
      },
      twitter: { card: "summary", title: `${title} | ${SITE_NAME}`, description },
    };
  }

  if (isObiSearchLanding(state) && state.obi) {
    const obi = state.obi;
    const title = `${obi}のコーディネート`;
    const description = `きものレシピで帯結び「${obi}」のコーディネートを探す。公開コーデの一覧。`;
    const canonical = buildSearchHref({ mode: "coordinates", obi });
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title: `${title} | ${SITE_NAME}`,
        description,
        url: absoluteUrl(canonical),
        siteName: SITE_NAME,
        locale: "ja_JP",
        type: "website",
      },
      twitter: { card: "summary", title: `${title} | ${SITE_NAME}`, description },
    };
  }

  const hub = isIndexableSearchState(state);
  const title = hub ? "検索" : "検索結果";
  const description = hub
    ? "きものレシピでコーディネートやアイテムをカテゴリ・帯結びなどから探す。"
    : "検索条件に一致する公開コーディネート・アイテム。";

  return {
    title,
    description,
    ...(hub
      ? {
          alternates: { canonical: "/search" },
          openGraph: {
            title: `${title} | ${SITE_NAME}`,
            description,
            url: absoluteUrl("/search"),
            siteName: SITE_NAME,
            locale: "ja_JP",
            type: "website",
          },
        }
      : { robots: NOINDEX_ROBOTS }),
  };
}

/** テンプレート二重付与を避けるためサイト名サフィックスを除く */
function stripSiteTitleSuffix(title: string): string {
  return title
    .replace(new RegExp(`\\s*[|｜]\\s*${SITE_NAME}\\s*$`), "")
    .trim();
}

export function buildDetailMetadata(input: {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  path: string;
  type?: "article" | "website";
}): Metadata {
  const title = stripSiteTitleSuffix(input.title) || SITE_NAME;
  const description =
    input.description?.trim() || SITE_DESCRIPTION;
  const images = input.imageUrl?.trim()
    ? [{ url: absoluteUrl(input.imageUrl) }]
    : siteDefaultOgImages();
  const url = absoluteUrl(input.path);
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: input.path },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: input.type ?? "article",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: images.map((i) => i.url),
    },
  };
}

/** sitemap 用：カテゴリ検索ランディング */
export function categorySearchPaths(): string[] {
  return (SEARCH_CATEGORIES as readonly SearchCategory[]).map((cat) =>
    buildSearchHref({ mode: "items", category: cat }),
  );
}

/** sitemap 用：帯結び検索ランディング */
export function obiSearchPaths(): string[] {
  return (SEARCH_OBI_KNOTS as readonly SearchObiKnot[]).map((obi) =>
    buildSearchHref({ mode: "coordinates", obi }),
  );
}
