import { HomeListGrid } from "@/base/HomeListGrid";
import { PopularUsersRow } from "@/base/home/PopularUsersRow";
import { SponsorAd } from "@/base/monetization/SponsorAd";
import { SectionHeader } from "@/base/SectionHeader";
import type { PopularUser } from "@/lib/discovery-data";
import { APP_ROUTES } from "@/lib/laravel-urls";
import type { PublicListItem } from "@/lib/types";

type Props = {
  coordinates: PublicListItem[];
  items: PublicListItem[];
  /** 渡さない／空なら Pick up 枠を出さない（spike でモック ID の 404 を避ける） */
  pickupUsers?: PopularUser[];
};

/**
 * Next トップの発見フィード。
 * 新着コーデ → 広告 → 新着アイテム → Pick up
 * （協賛ロゴはフッター直上。管理の有効件のみ）
 */
export function HomeFeed({ coordinates, items, pickupUsers = [] }: Props) {
  return (
    <>
      <section className="page-section">
        <SectionHeader
          title="新着コーデ"
          moreHref={`${APP_ROUTES.search}?m=c`}
          flush
        />
        <HomeListGrid
          kind="coordinates"
          items={coordinates}
          label="新着コーデ"
        />
      </section>

      <section className="page-section">
        <SponsorAd placement="home_top" />
      </section>

      <section className="page-section">
        <SectionHeader
          title="新着アイテム"
          moreHref={`${APP_ROUTES.search}?m=i`}
          flush
        />
        <HomeListGrid kind="items" items={items} label="新着アイテム" />
      </section>

      {pickupUsers.length > 0 ? (
        <section className="page-section">
          <SectionHeader
            title="Pick upユーザー"
            moreHref={`${APP_ROUTES.following}#pickup`}
            flush
          />
          <PopularUsersRow users={pickupUsers.slice(0, 6)} />
        </section>
      ) : null}
    </>
  );
}
