import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoordinateDetailView } from "@/base/detail/CoordinateDetailView";
import { MockTempCoordinateDetail } from "@/base/detail/MockTempCoordinateDetail";
import { loadCoordinateDetailPage } from "@/base/detail/load-detail";
import { coordinateDetailLabel } from "@/lib/display-title";
import { isMockTempCoordinateId } from "@/lib/mock-temp-coordinate";
import { NOINDEX_ROBOTS, buildDetailMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Next コーデ詳細。
 * 本人 → 本人用フル（サーバで取得）。それ以外 → 公開のみ。非公開は本人以外 404。
 * モック仮コーデ（temp-new-*）はクライアント詳細へ。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (isMockTempCoordinateId(id)) {
    return { title: "仮コーデ", robots: NOINDEX_ROBOTS };
  }
  const data = await loadCoordinateDetailPage(id);
  if (!data) return { title: "コーデが見つかりません", robots: NOINDEX_ROBOTS };
  const { coordinate, ownerFields } = data;
  // 無題は og の汎用文言より帯結びを優先
  const title = coordinateDetailLabel(
    coordinate.title,
    coordinate.obi_knot,
  );
  const meta = buildDetailMetadata({
    title,
    description: coordinate.og.description || coordinate.description,
    imageUrl: coordinate.og.image_url || coordinate.images[0],
    path: `/c/${id}`,
  });
  // 本人閲覧の非公開は index しない（公開判定の正はサーバ 404）
  if (ownerFields?.owner_status === "private") {
    return { ...meta, robots: NOINDEX_ROBOTS };
  }
  return meta;
}

export default async function CoordinateDetailPage({ params }: Props) {
  const { id } = await params;
  if (isMockTempCoordinateId(id)) {
    return <MockTempCoordinateDetail id={id} />;
  }

  const data = await loadCoordinateDetailPage(id);
  if (!data) notFound();

  return (
    <CoordinateDetailView
      coordinate={data.coordinate}
      ownerFields={data.ownerFields}
      browseList={data.browseList}
    />
  );
}
