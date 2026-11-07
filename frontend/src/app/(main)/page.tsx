import type { Metadata } from "next";
import { HomeFeed } from "@/base/home/HomeFeed";
import { PageShell } from "@/base/PageShell";
import { getPickupUsers, getPublicListPage } from "@/lib/api";
import { SITE_NAME } from "@/lib/seo";

/** 新着コーデ／アイテム: 3列×3行 */
const HOME_NEW_COUNT = 9;

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description:
    "着物・浴衣のコーディネートとアイテムを記録・共有。新着の公開コーデ・アイテムをチェック。",
  alternates: { canonical: "/" },
};

/**
 * Next トップ。
 * 新着は公開一覧 page1（最大9件）。
 * Pick up は公開コーデ・アイテム各10件以上の自動選定。
 */
export default async function HomePage() {
  const [coordinates, items, pickupUsers] = await Promise.all([
    getPublicListPage("coordinates", { page: 1, perPage: HOME_NEW_COUNT }),
    getPublicListPage("items", { page: 1, perPage: HOME_NEW_COUNT }),
    getPickupUsers(6),
  ]);

  return (
    <PageShell className="page-enter pb-8 md:pb-10">
      <HomeFeed
        coordinates={coordinates.items}
        items={items.items}
        pickupUsers={pickupUsers}
      />
    </PageShell>
  );
}
