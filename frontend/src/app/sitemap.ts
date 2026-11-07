import type { MetadataRoute } from "next";
import { getPublicListPage } from "@/lib/api";
import {
  categorySearchPaths,
  getSiteUrl,
  obiSearchPaths,
} from "@/lib/seo";

/** sitemap 取得時のチャンク（一覧契約の既定12より広く、全件一括はしない） */
const SITEMAP_PER_PAGE = 100;
/** 暴走防止（モードあたり最大件数の目安） */
const SITEMAP_MAX_PAGES = 50;

async function collectPublicDetailPaths(
  mode: "coordinates" | "items",
): Promise<{ paths: string[]; userIds: Set<string> }> {
  const paths: string[] = [];
  const userIds = new Set<string>();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= SITEMAP_MAX_PAGES) {
    const result = await getPublicListPage(mode, {
      page,
      perPage: SITEMAP_PER_PAGE,
    });
    totalPages = result.totalPages;
    for (const item of result.items) {
      paths.push(mode === "coordinates" ? `/c/${item.id}` : `/i/${item.id}`);
      if (item.user?.id) userIds.add(item.user.id);
    }
    if (result.items.length === 0) break;
    page += 1;
  }

  return { paths, userIds };
}

/** 公開トップ・検索ハブ／ランディング・公開詳細・プロフィール */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categorySearchPaths().map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...obiSearchPaths().map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const [coords, items] = await Promise.all([
    collectPublicDetailPaths("coordinates"),
    collectPublicDetailPaths("items"),
  ]);

  const userIds = new Set([...coords.userIds, ...items.userIds]);

  const detailEntries: MetadataRoute.Sitemap = [
    ...coords.paths,
    ...items.paths,
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const profileEntries: MetadataRoute.Sitemap = [...userIds].map((id) => ({
    url: `${base}/m/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...detailEntries, ...profileEntries];
}
