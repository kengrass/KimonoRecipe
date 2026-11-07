/**
 * モック紐付けグラフ。
 * - 静的詳細（fixture / 手書き）からコーデ→アイテムを索引
 * - アイテム詳細の used_in を逆引きで補完
 * - 紐付け UI の確定は sessionStorage に保存し両側へ反映
 */
import { REAL_COORDINATE_DETAILS } from "@/lib/mock-api-fixtures";
import { MOCK_COORDINATE_DETAIL } from "@/lib/mock-data";
import { GRAPH_COORDINATE_DETAILS } from "@/lib/mock-graph";
import { isMockTempCoordinateId } from "@/lib/mock-temp-coordinate";
import { coordinateDetailToList } from "@/lib/public-list-item";
import type {
  CoordinateItemRef,
  PublicCoordinateDetail,
  PublicListItem,
} from "@/lib/types";

const STORE_KEY = "kr-mock-attach-links";

type AttachStore = {
  /** コーデ id → 紐付けアイテム（上書き時のみ） */
  byCoordinate: Record<string, CoordinateItemRef[]>;
  /** 逆引き用のコーデ一覧スナップショット */
  coordinateLists: Record<string, PublicListItem>;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function seedCoordinateDetails(): PublicCoordinateDetail[] {
  const byId = new Map<string, PublicCoordinateDetail>();
  byId.set(MOCK_COORDINATE_DETAIL.id, MOCK_COORDINATE_DETAIL);
  for (const detail of Object.values(GRAPH_COORDINATE_DETAILS)) {
    byId.set(detail.id, detail);
  }
  for (const detail of Object.values(REAL_COORDINATE_DETAILS)) {
    byId.set(detail.id, detail);
  }
  return [...byId.values()];
}

const SEED_DETAILS = seedCoordinateDetails();

const SEED_ITEMS_BY_COORD = new Map<string, CoordinateItemRef[]>();
const SEED_LIST_BY_COORD = new Map<string, PublicListItem>();
for (const detail of SEED_DETAILS) {
  SEED_ITEMS_BY_COORD.set(
    detail.id,
    detail.items.map((item) => ({ ...item })),
  );
  SEED_LIST_BY_COORD.set(detail.id, coordinateDetailToList(detail));
}

function emptyStore(): AttachStore {
  return { byCoordinate: {}, coordinateLists: {} };
}

function readStore(): AttachStore {
  if (!isBrowser()) return emptyStore();
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<AttachStore>;
    return {
      byCoordinate:
        parsed.byCoordinate && typeof parsed.byCoordinate === "object"
          ? parsed.byCoordinate
          : {},
      coordinateLists:
        parsed.coordinateLists && typeof parsed.coordinateLists === "object"
          ? parsed.coordinateLists
          : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: AttachStore) {
  if (!isBrowser()) return;
  sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function mergeById<T extends { id: string }>(primary: T[], extra: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of primary) map.set(row.id, row);
  for (const row of extra) {
    if (!map.has(row.id)) map.set(row.id, row);
  }
  return [...map.values()];
}

function seedItemsForCoordinate(coordinateId: string): CoordinateItemRef[] {
  return (
    SEED_ITEMS_BY_COORD.get(coordinateId)?.map((item) => ({ ...item })) ?? []
  );
}

function listItemForCoordinateId(
  coordinateId: string,
  store: AttachStore,
): PublicListItem | null {
  return (
    store.coordinateLists[coordinateId] ??
    SEED_LIST_BY_COORD.get(coordinateId) ??
    null
  );
}

function effectiveItems(
  coordinateId: string,
  store: AttachStore,
): CoordinateItemRef[] {
  if (Object.prototype.hasOwnProperty.call(store.byCoordinate, coordinateId)) {
    return store.byCoordinate[coordinateId].map((item) => ({ ...item }));
  }
  return seedItemsForCoordinate(coordinateId);
}

/** コーデに紐付くアイテム（上書きがあればそちら） */
export function getMockAttachedItems(
  coordinateId: string,
  fallback: CoordinateItemRef[] = [],
): CoordinateItemRef[] {
  if (isMockTempCoordinateId(coordinateId)) return fallback;
  const store = readStore();
  if (Object.prototype.hasOwnProperty.call(store.byCoordinate, coordinateId)) {
    return store.byCoordinate[coordinateId].map((item) => ({ ...item }));
  }
  return mergeById(fallback, seedItemsForCoordinate(coordinateId));
}

/** アイテムを使っている通常コーデ（仮は別経路） */
export function getMockAttachedCoordinates(
  itemId: string,
  fallback: PublicListItem[] = [],
): PublicListItem[] {
  const store = readStore();
  const fromGraph: PublicListItem[] = [];
  const seen = new Set<string>();

  const consider = (coordinateId: string) => {
    if (seen.has(coordinateId) || isMockTempCoordinateId(coordinateId)) return;
    const items = effectiveItems(coordinateId, store);
    if (!items.some((item) => item.id === itemId)) return;
    const listItem = listItemForCoordinateId(coordinateId, store);
    if (!listItem) return;
    seen.add(coordinateId);
    fromGraph.push(listItem);
  };

  for (const coordinateId of SEED_ITEMS_BY_COORD.keys()) consider(coordinateId);
  for (const coordinateId of Object.keys(store.byCoordinate)) {
    consider(coordinateId);
  }

  return mergeById(
    fallback.filter((row) => !isMockTempCoordinateId(row.id)),
    fromGraph,
  );
}

/** コーデ詳細側の紐付け確定 */
export function setMockAttachedItems(
  coordinateId: string,
  items: CoordinateItemRef[],
  coordinateList?: PublicListItem,
) {
  if (isMockTempCoordinateId(coordinateId)) return;
  const store = readStore();
  store.byCoordinate[coordinateId] = items.map((item) => ({ ...item }));
  if (coordinateList) {
    store.coordinateLists[coordinateId] = coordinateList;
  } else if (
    !store.coordinateLists[coordinateId] &&
    !SEED_LIST_BY_COORD.has(coordinateId)
  ) {
    // 最低限のスナップショット
    store.coordinateLists[coordinateId] = {
      id: coordinateId,
      title: "",
      image_url: "",
      user: { id: "", name: "", profile_url: "" },
      posted_at: new Date().toISOString(),
      tags: [],
      seasons: [],
      detail_url: `/c/${coordinateId}`,
      gender: "women",
      obi_knot: null,
    };
  }
  writeStore(store);
}

/** アイテム詳細側の紐付け確定 → 各コーデの items を同期 */
export function setMockAttachedCoordinates(
  itemId: string,
  coordinates: PublicListItem[],
  itemRef: CoordinateItemRef,
) {
  const wanted = new Set(
    coordinates
      .map((row) => row.id)
      .filter((id) => !isMockTempCoordinateId(id)),
  );
  const store = readStore();

  for (const row of coordinates) {
    if (isMockTempCoordinateId(row.id)) continue;
    store.coordinateLists[row.id] = row;
  }

  const knownCoordIds = new Set([
    ...SEED_ITEMS_BY_COORD.keys(),
    ...Object.keys(store.byCoordinate),
    ...wanted,
  ]);

  for (const coordinateId of knownCoordIds) {
    if (isMockTempCoordinateId(coordinateId)) continue;
    const current = effectiveItems(coordinateId, store);
    const has = current.some((row) => row.id === itemId);
    const should = wanted.has(coordinateId);
    if (should && !has) {
      store.byCoordinate[coordinateId] = [...current, { ...itemRef }];
    } else if (!should && has) {
      store.byCoordinate[coordinateId] = current.filter(
        (row) => row.id !== itemId,
      );
    }
  }

  writeStore(store);
}
