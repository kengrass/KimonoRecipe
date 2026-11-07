import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItemDetailView } from "@/base/detail/ItemDetailView";
import { loadItemDetailPage } from "@/base/detail/load-detail";
import { NOINDEX_ROBOTS, buildDetailMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Next アイテム詳細。
 * 本人 → 本人用フル（サーバで取得）。それ以外 → 公開のみ。非公開は本人以外 404。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await loadItemDetailPage(id);
  if (!data) return { title: "アイテムが見つかりません", robots: NOINDEX_ROBOTS };
  const { item, ownerFields } = data;
  const meta = buildDetailMetadata({
    title: item.og.title || item.title || item.category,
    description: item.og.description || item.description,
    imageUrl: item.og.image_url || item.images[0],
    path: `/i/${id}`,
  });
  if (ownerFields?.owner_status === "private") {
    return { ...meta, robots: NOINDEX_ROBOTS };
  }
  return meta;
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await loadItemDetailPage(id);
  if (!data) notFound();

  return (
    <ItemDetailView
      item={data.item}
      ownerFields={data.ownerFields}
      browseList={data.browseList}
    />
  );
}
