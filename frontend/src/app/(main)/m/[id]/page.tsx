import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileView } from "@/base/mypage/ProfileView";
import { loadMypagePage } from "@/base/mypage/load-mypage";
import { getPublicUser } from "@/lib/api";
import type { MypageParamsInput } from "@/lib/mypage-state";
import { buildDetailMetadata } from "@/lib/seo";
import { getServerViewerUserId } from "@/lib/server-viewer";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<MypageParamsInput>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicUser(id);
  if (!profile) {
    return { title: "ユーザー", robots: { index: false } };
  }
  return buildDetailMetadata({
    title: profile.name,
    description:
      profile.bio?.trim() ||
      `${profile.name}さんの公開プロフィール｜きものレシピ`,
    // マイページはサイト共通 OGP（ユーザー専用画像は持たない）
    path: `/m/${id}`,
    type: "website",
  });
}

/**
 * Next マイページ／プロフィール。
 *
 * 人物: GET /api/public/users/{id}
 * 一覧: 本人 → owner、他人 → public?user=
 */
export default async function MainProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const profile = await getPublicUser(id);
  if (!profile) notFound();

  const [viewerUserId, raw] = await Promise.all([
    getServerViewerUserId(),
    searchParams,
  ]);
  const payload = await loadMypagePage(profile, viewerUserId, raw);

  return (
    <Suspense fallback={null}>
      <ProfileView
        user={{
          id: profile.id,
          name: profile.name,
          profile_url: profile.profile_url,
        }}
        viewerUserId={viewerUserId}
        payload={payload}
      />
    </Suspense>
  );
}
