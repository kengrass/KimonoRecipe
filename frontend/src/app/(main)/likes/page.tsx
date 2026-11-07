import type { Metadata } from "next";
import { LikesView } from "@/base/collection/LikesView";
import { buildLikesPage } from "@/base/collection/load-collection";
import { parseCollectionPageParams } from "@/lib/collection-page";
import { getServerViewerUserId } from "@/lib/server-viewer";

export const metadata: Metadata = {
  title: "お気に入り",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ m?: string; page?: string }>;
};

/**
 * Next お気に入り。
 * 閲覧者はサーバ決定。未ログインは一覧 API を叩かない。
 */
export default async function LikesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { mode, page } = parseCollectionPageParams(params);
  const viewerUserId = await getServerViewerUserId();
  const payload = await buildLikesPage({ mode, page, viewerUserId });
  return <LikesView payload={payload} />;
}
