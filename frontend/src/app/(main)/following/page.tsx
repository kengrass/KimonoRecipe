import type { Metadata } from "next";
import { FollowingView } from "@/base/collection/FollowingView";
import { buildFollowingPage } from "@/base/collection/load-collection";
import { parseCollectionPageParams } from "@/lib/collection-page";
import { getServerViewerUserId } from "@/lib/server-viewer";

export const metadata: Metadata = {
  title: "フォローした人の投稿",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ m?: string; page?: string }>;
};

/**
 * Next フォロー。
 * 閲覧者はサーバ決定。未ログインは投稿一覧 API を叩かずおすすめのみ。
 */
export default async function FollowingPage({ searchParams }: Props) {
  const params = await searchParams;
  const { mode, page } = parseCollectionPageParams(params);
  const viewerUserId = await getServerViewerUserId();
  const payload = await buildFollowingPage({ mode, page, viewerUserId });
  return (
    <FollowingView payload={payload} viewerUserId={viewerUserId} />
  );
}
