"use client";

/**
 * マイページ本体（プロフィール＋コーデ／アイテム一覧・仮コーデ）。
 * サーバ組立は `load-mypage.ts`。一覧クエリは owner／公開 `user=`。
 * 厚い提供 UI — 見た目分割のためのリファクタはしない。
 */

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CollectionList } from "@/base/collection/CollectionList";
import { useMockFlash } from "@/base/ui/useMockFlash";
import { USE_SPIKE_API } from "@/lib/config";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { ItemCollageThumb } from "@/base/detail/ItemCollageThumb";
import {
  createMockTempCoordinate,
  getMockTempCoordinate,
  listMockTempCoordinates,
  mockTempCollageUrls,
  saveMockTempCoordinate,
} from "@/lib/mock-temp-coordinate";
import { MYPAGE_LINKS } from "@/lib/mypage-data";
import {
  spikeCreateCoordinate,
  spikeListTempCoordinates,
} from "@/lib/spike-write";
import type {
  MypageCoordinateSort,
  MypageCoordinateView,
  MypageItemCategoryMode,
  MypageItemSort,
  MypageMainTab,
  MypageSeason,
} from "@/lib/mypage-types";
import {
  buildMypageHref,
  patchMypageUrlState,
  type MypageUrlState,
} from "@/lib/mypage-state";
import type { ContentGender, PublicListItem, PublicUser } from "@/lib/types";
import { listItemLabel } from "@/lib/display-title";
import { CONTENT_VISIBILITY_LABEL } from "@/lib/visibility";
import { PageShell } from "@/base/PageShell";
import { FilterChips, ModeSwitch } from "@/base/ui/FilterChips";
import { VisibilityIcon } from "@/base/ui/VisibilityIcon";
import {
  OwnerSetupNudge,
  ProfileAside,
  ListTabs,
} from "./ProfileChrome";
import {
  MYPAGE_COORDINATE_SORTS,
  MYPAGE_ITEM_SORTS,
  MYPAGE_SEASONS,
  type MypagePagePayload,
} from "./load-mypage";

type Props = {
  user: PublicUser;
  /**
   * サーバ決定の閲覧者（getServerViewerUserId）。
   * 公開／owner 一覧の出し分けはこれだけを使う。useMockAuth では切り替えない。
   */
  viewerUserId: string | null;
  /** RSC の loadMypagePage 結果（一覧は owner／プロフィール一覧 API） */
  payload: MypagePagePayload;
};

/**
 * Next マイページ／プロフィール。
 *
 * - viewerUserId … 誰として見るか（RSC から。公開範囲の正）
 * - payload … 一覧1ページ（owner／公開プロフィール一覧 API）
 * - 一覧 UI は CollectionList（検索・いいねと同型）
 */
export function ProfileView({ user: _user, viewerUserId: _viewer, payload }: Props) {
  const pathname = usePathname() || `/m/${payload.profile.user.id}`;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [draftQ, setDraftQ] = useState<string | null>(null);
  const [extraTempItems, setExtraTempItems] = useState<PublicListItem[]>([]);
  const [spikeTempItems, setSpikeTempItems] = useState<PublicListItem[] | null>(
    null,
  );
  const [spikeTempTotal, setSpikeTempTotal] = useState(0);
  const [spikeTempReady, setSpikeTempReady] = useState(false);
  const { flash, Toast } = useMockFlash({ placement: "fixed" });

  const { profile, facets, state, list, visibilityById } = payload;
  const itemSortOptions = profile.isOwnerView
    ? MYPAGE_ITEM_SORTS
    : MYPAGE_ITEM_SORTS.filter(
        (s) => s.id !== "favorite_desc" && s.id !== "favorite_asc",
      );

  const isTempTab =
    state.tab === "coordinates" && state.coordinateView === "temp";

  // spike: クライアントで owner temp 一覧を取り直す（RSC の Cookie 抜けを避ける）
  useEffect(() => {
    if (!USE_SPIKE_API || !isTempTab) {
      setSpikeTempItems(null);
      setSpikeTempReady(false);
      return;
    }
    let cancelled = false;
    setSpikeTempReady(false);
    void spikeListTempCoordinates(50, { sort: state.sort })
      .then((page) => {
        if (cancelled) return;
        if (!page) {
          setSpikeTempItems(null);
          setSpikeTempTotal(0);
        } else {
          setSpikeTempItems(page.items);
          setSpikeTempTotal(page.total);
        }
        setSpikeTempReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSpikeTempItems(null);
        setSpikeTempTotal(0);
        setSpikeTempReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isTempTab, pathname, state.sort]);

  useEffect(() => {
    if (USE_SPIKE_API) return;
    if (state.coordinateView === "temp") {
      setExtraTempItems(listMockTempCoordinates());
    }
  }, [state.coordinateView, pathname]);

  const isTempOwnerView = isTempTab && (
    USE_SPIKE_API
      ? spikeTempItems != null || profile.isOwnerView
      : profile.isOwnerView
  );

  // 仮コーデ: spike はクライアント owner API（作成直後も即反映）。モックは session store。
  const coordinateItems =
    USE_SPIKE_API && isTempTab
      ? (spikeTempItems ?? (profile.isOwnerView ? list.items : []))
      : !USE_SPIKE_API && isTempOwnerView
        ? extraTempItems
        : list.items;
  const coordinateTotal =
    USE_SPIKE_API && isTempTab
      ? spikeTempItems != null
        ? spikeTempTotal
        : profile.isOwnerView
          ? list.total
          : 0
      : !USE_SPIKE_API && isTempOwnerView
        ? extraTempItems.length
        : list.total;

  const handleAddTempCoordinate = () => {
    const gender =
      (coordinateItems[0]?.gender as ContentGender | undefined) ??
      list.items[0]?.gender ??
      "women";
    if (USE_SPIKE_API) {
      void (async () => {
        try {
          const created = await spikeCreateCoordinate({
            title: "",
            gender: gender as "women" | "men" | "kids",
            visibility: "private",
            is_temp: true,
            image_urls: [],
            item_ids: [],
          });
          const page = await spikeListTempCoordinates(50, {
            sort: state.sort,
          });
          if (page) {
            setSpikeTempItems(page.items);
            setSpikeTempTotal(page.total);
            setSpikeTempReady(true);
          } else if (created.id) {
            const row: PublicListItem = {
              id: created.id,
              title: created.title ?? "",
              image_url: created.image_url ?? "",
              detail_url: created.detail_url ?? `/c/${created.id}`,
              gender: (created.gender as ContentGender) ?? gender,
              tags: created.tags ?? [],
              seasons: (created.seasons as PublicListItem["seasons"]) ?? [],
              user: created.user ?? profile.user,
              posted_at: created.posted_at ?? new Date().toISOString(),
              like_count: created.like_count ?? 0,
              obi_knot: created.obi_knot ?? "",
            };
            setSpikeTempItems((prev) => [row, ...(prev ?? [])]);
            setSpikeTempTotal((n) => n + 1);
            setSpikeTempReady(true);
          }
          flash("仮コーデを1件追加しました");
          router.refresh();
        } catch {
          flash("仮コーデの追加に失敗しました（ログイン済みか確認）");
        }
      })();
      return;
    }
    const item = createMockTempCoordinate(profile.user, gender);
    saveMockTempCoordinate(item);
    setExtraTempItems(listMockTempCoordinates());
    flash("仮コーデを1件追加しました");
  };

  const href = (patch: Partial<MypageUrlState>) =>
    buildMypageHref(pathname, patchMypageUrlState(state, patch));

  const replace = (patch: Partial<MypageUrlState>) => {
    const next = href(patch);
    startTransition(() => {
      router.replace(next, { scroll: false });
    });
  };

  const searchValue = draftQ ?? state.q;

  // 仮コーデは本人のみ（他人に出すと facets が空になり件数すべて 0 に見える）
  const viewsForUi: { id: MypageCoordinateView; label: string }[] = [
    { id: "season", label: "季節" },
    ...(profile.isOwnerView
      ? [{ id: "temp" as const, label: "仮コーデ" }]
      : []),
  ];

  const viewLabel =
    viewsForUi.find((v) => v.id === state.coordinateView)?.label ?? "季節";

  const categoryModes: { id: MypageItemCategoryMode; label: string }[] = [
    { id: "system", label: "カテゴリ" },
    ...(profile.isOwnerView
      ? [{ id: "declutter" as const, label: "断捨離候補" }]
      : []),
  ];

  const categoryList =
    state.categoryMode === "declutter"
      ? facets.itemDeclutterCategories
      : facets.itemCategories;

  const categoryLabel =
    state.categoryMode === "declutter" ? "断捨離候補" : "カテゴリ";

  const categoryAllCount =
    state.categoryMode === "declutter"
      ? profile.declutterCount
      : profile.itemCount;

  return (
    <div className="page-enter pb-8 md:pb-10">
      {Toast}
      <PageShell
        aside={
          profile.isOwnerView ? undefined : <ProfileAside profile={profile} />
        }
      >
        <OwnerSetupNudge
          profile={profile}
          profileEditHref={MYPAGE_LINKS.profileBio}
        />

        <ListTabs
          pathname={pathname}
          coordinateCount={profile.coordinateCount}
          itemCount={profile.itemCount}
          active={state.tab}
          hrefFor={(tab: MypageMainTab) =>
            href({
              tab,
              q: "",
              category: undefined,
              categoryMode: "system",
              coordinateView: "season",
              season: "all",
              myFolderId: "unset",
              page: 1,
            })
          }
        />

        <div className="mt-3">
          <label className="sr-only" htmlFor="mypage-search">
            マイページ内検索
          </label>
          <input
            id="mypage-search"
            type="search"
            value={searchValue}
            onChange={(e) => setDraftQ(e.target.value)}
            onBlur={() => {
              if (draftQ === null) return;
              replace({ q: draftQ });
              setDraftQ(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder={
              state.tab === "items"
                ? "タイトル・カテゴリ・タグで検索"
                : "タイトル・タグで検索"
            }
            className="w-full rounded border border-kr-border px-3 py-2 text-sm text-kr-text outline-none focus:border-kr-navy"
          />
        </div>

        {state.tab === "coordinates" ? (
          <section className="page-section mt-3">
            <ModeSwitch
              label={viewLabel}
              options={viewsForUi}
              value={state.coordinateView}
              hrefFor={(coordinateView) => href({ coordinateView })}
              ariaLabel="コーディネートの表示"
            />

            <FilterChips
              allHref={href({ season: "all" })}
              allCount={facets.seasonCounts.all}
              activeId={state.season === "all" ? undefined : state.season}
              items={MYPAGE_SEASONS.filter((s) => s.id !== "all").map((s) => ({
                id: s.id,
                label: s.label,
                count: facets.seasonCounts[s.id],
                href: href({ season: s.id as MypageSeason }),
              }))}
            />

            <div className="mb-3 flex flex-wrap items-center gap-3">
              {state.q ||
              state.season !== "all" ||
              state.coordinateView !== "season" ? (
                <p className="text-sm text-kr-muted">
                  {coordinateTotal}件
                  {state.q ? `（「${state.q}」）` : ""}
                </p>
              ) : null}
              <label className="ml-auto block">
                <span className="sr-only">並べ替え</span>
                <select
                  value={state.sort}
                  onChange={(e) =>
                    replace({
                      sort: e.target.value as MypageCoordinateSort,
                    })
                  }
                  className="rounded border border-kr-border bg-white px-2 py-1 text-sm text-kr-text outline-none focus:border-kr-navy"
                >
                  {MYPAGE_COORDINATE_SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {state.sort === "worn" ? (
              <p className="mb-3 text-xs leading-relaxed text-kr-muted">
                着用日が設定されていないコーディネートは表示されておりません。
              </p>
            ) : null}

            <ListBody
              kind="coordinates"
              list={list}
              items={coordinateItems}
              total={coordinateTotal}
              visibilityById={visibilityById}
              emptyLabel="コーディネート"
              filtered={
                Boolean(state.q) || state.coordinateView !== "season"
              }
              hintAdd={profile.isOwnerView && state.coordinateView === "season"}
              addHref={APP_ROUTES.addCoordinate}
              pageHref={(page) => href({ page })}
              leadingAdd={
                isTempOwnerView
                  ? {
                      label: "仮コーデを追加",
                      onClick: handleAddTempCoordinate,
                    }
                  : undefined
              }
              media={
                isTempOwnerView && !USE_SPIKE_API
                  ? (item) => {
                      const record = getMockTempCoordinate(item.id);
                      const urls = record ? mockTempCollageUrls(record) : null;
                      if (!urls) return null;
                      return (
                        <ItemCollageThumb
                          urls={urls}
                          alt={listItemLabel(item)}
                          variant="tile"
                        />
                      );
                    }
                  : undefined
              }
            />
          </section>
        ) : (
          <section className="page-section mt-3">
            <ModeSwitch
              label={categoryLabel}
              options={categoryModes}
              value={state.categoryMode}
              hrefFor={(categoryMode) =>
                href({ categoryMode, category: undefined })
              }
              ariaLabel="カテゴリの種類"
            />
            <FilterChips
              allHref={href({ category: undefined })}
              allCount={categoryAllCount}
              activeId={state.category}
              items={categoryList.map((cat) => ({
                id: cat.name,
                label: cat.name,
                count: cat.count,
                href: href({ category: cat.name }),
              }))}
              emptyMessage={
                state.categoryMode === "declutter" &&
                profile.declutterCount === 0
                  ? "断捨離候補はまだありません。"
                  : undefined
              }
            />
            <div className="mb-3 flex flex-wrap items-center gap-3">
              {state.q || state.category ? (
                <p className="text-sm text-kr-muted">
                  {list.total}件
                  {state.category ? ` · ${state.category}` : ""}
                  {state.q ? ` · 「${state.q}」` : ""}
                </p>
              ) : null}
              <label className="ml-auto block">
                <span className="sr-only">並べ替え</span>
                <select
                  value={state.sort}
                  onChange={(e) =>
                    replace({
                      sort: e.target.value as MypageItemSort,
                    })
                  }
                  className="rounded border border-kr-border bg-white px-2 py-1 text-sm text-kr-text outline-none focus:border-kr-navy"
                >
                  {itemSortOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ListBody
              kind="items"
              list={list}
              visibilityById={visibilityById}
              emptyLabel="アイテム"
              filtered={Boolean(state.q || state.category)}
              hintAdd={profile.isOwnerView}
              addHref={APP_ROUTES.addItem}
              pageHref={(page) => href({ page })}
            />
          </section>
        )}
      </PageShell>
    </div>
  );
}

function ListBody({
  kind,
  list,
  items,
  total,
  visibilityById,
  emptyLabel,
  filtered,
  hintAdd,
  addHref,
  pageHref,
  leadingAdd,
  media,
}: {
  kind: "coordinates" | "items";
  list: MypagePagePayload["list"];
  items?: PublicListItem[];
  total?: number;
  visibilityById?: Record<string, import("@/lib/types").ContentVisibility>;
  emptyLabel: string;
  filtered: boolean;
  hintAdd: boolean;
  addHref: string;
  pageHref: (page: number) => string;
  leadingAdd?: { label: string; onClick: () => void };
  media?: (item: PublicListItem) => ReactNode;
}) {
  return (
    <CollectionList
      kind={kind}
      items={items ?? list.items}
      browseLabel={
        kind === "coordinates" ? "マイページのコーデ" : "マイページのアイテム"
      }
      page={list.page}
      totalPages={list.totalPages}
      total={total ?? list.total}
      getPageHref={pageHref}
      withTitles
      leadingAdd={leadingAdd}
      media={media}
      linkTitle={(item) => {
        const a11y = listItemLabel(item);
        const vis = visibilityById?.[item.id];
        if (vis && vis !== "public") {
          return `${a11y}（${CONTENT_VISIBILITY_LABEL[vis]}）`;
        }
        return a11y;
      }}
      overlay={
        visibilityById
          ? (item) => {
              const vis = visibilityById[item.id];
              if (!vis || vis === "public") return null;
              return (
                <span className="tile-overlay-btn pointer-events-none absolute bottom-[5px] left-[5px] z-[1] h-4 w-4 rounded-sm">
                  <VisibilityIcon
                    visibility={vis}
                    className="block h-3 w-3"
                    tone="inherit"
                  />
                </span>
              );
            }
          : undefined
      }
      empty={
        <div className="py-10 text-center">
          <p className="text-sm text-kr-muted">
            {filtered
              ? `条件に合う${emptyLabel}がありません。`
              : `まだ${emptyLabel}がありません。`}
          </p>
          {hintAdd ? (
            <a
              href={addHref}
              className="mt-3 inline-flex text-sm font-medium text-kr-link hover:underline"
            >
              ＋{emptyLabel}を追加
            </a>
          ) : null}
        </div>
      }
    />
  );
}
