import { sortCoordinateItemsByCategory } from "@/lib/coordinate-item-order";
import { APP_ROUTES } from "@/lib/laravel-urls";
import { TEMP_COORDINATE_ITEM_MAX } from "@/lib/temp-coordinate-collage";
import type {
  ContentGender,
  CoordinateItemRef,
  OwnerCoordinateFields,
  PublicCoordinateDetail,
  PublicListItem,
  PublicUser,
} from "@/lib/types";

/** 仮コーデ新規時のプレースホルダ画像（空コーデのサムネ） */
export const TEMP_COORDINATE_PLACEHOLDER =
  "/mock/temp-coordinate-placeholder.png";

const STORE_KEY = "kr-mock-temp-coordinates";

export type MockTempThumbKind = "placeholder" | "collage" | "photo";

/** sessionStorage 上の仮コーデ（一覧1件＋本体写真・紐付け） */
export type MockTempCoordinateRecord = PublicListItem & {
  /** 確定したコーデ画像。live_synth 中は空のことが多く、解除時に埋める */
  photos: string[];
  items: CoordinateItemRef[];
  thumb_kind: MockTempThumbKind;
  /**
   * true: 仮ON。紐付け変更で合成し直す。編集画面には合成1枚を出す。
   * false: 仮OFF。photos を固定し、紐付け変更では再合成しない。
   */
  live_synth: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function asRecord(raw: unknown): MockTempCoordinateRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<MockTempCoordinateRecord>;
  if (typeof item.id !== "string" || typeof item.image_url !== "string") {
    return null;
  }
  return {
    id: item.id,
    title: item.title ?? "",
    image_url: item.image_url,
    user: item.user as PublicUser,
    posted_at: item.posted_at ?? new Date().toISOString(),
    tags: item.tags ?? [],
    seasons: item.seasons ?? [],
    detail_url: item.detail_url ?? APP_ROUTES.coordinate(item.id),
    gender: item.gender ?? "women",
    obi_knot: item.obi_knot ?? null,
    photos: Array.isArray(item.photos) ? item.photos : [],
    items: Array.isArray(item.items) ? item.items : [],
    thumb_kind: item.thumb_kind ?? "placeholder",
    live_synth: typeof item.live_synth === "boolean" ? item.live_synth : true,
  };
}

function readStore(): MockTempCoordinateRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(asRecord)
      .filter((x): x is MockTempCoordinateRecord => Boolean(x));
  } catch {
    return [];
  }
}

function writeStore(items: MockTempCoordinateRecord[]) {
  if (!isBrowser()) return;
  sessionStorage.setItem(STORE_KEY, JSON.stringify(items));
}

export function mockTempToListItem(
  record: MockTempCoordinateRecord,
): PublicListItem {
  const {
    photos: _p,
    items: _i,
    thumb_kind: _t,
    live_synth: _l,
    ...list
  } = record;
  return list;
}

export function isMockTempCoordinateId(id: string) {
  return id.startsWith("temp-new-");
}

function mockTempItemImageUrls(record: MockTempCoordinateRecord): string[] {
  return record.items
    .slice(0, TEMP_COORDINATE_ITEM_MAX)
    .map((item) => item.image_url)
    .filter(Boolean);
}

/** 編集画面の初期 photos（アイテム単体は出さない。合成はクライアントで1枚化） */
export function mockTempEditImageUrls(
  record: MockTempCoordinateRecord,
): string[] {
  return record.photos.filter(Boolean);
}

/** 編集で1枚合成する材料（live_synth 中のみ） */
export function mockTempCollageSourceUrls(
  record: MockTempCoordinateRecord,
): string[] {
  if (!record.live_synth) return [];
  return mockTempItemImageUrls(record);
}

/** 一覧・詳細の合成サムネ用（live_synth 中のみ。なければ null） */
export function mockTempCollageUrls(
  record: MockTempCoordinateRecord,
): string[] | null {
  if (!record.live_synth) return null;
  if (record.thumb_kind !== "collage" && record.photos.length > 0) return null;
  const urls = mockTempItemImageUrls(record);
  return urls.length ? urls : null;
}

/** id から合成サムネ URL を1回で取る */
export function getMockTempCollageUrls(id: string): string[] | null {
  const record = getMockTempCoordinate(id);
  return record ? mockTempCollageUrls(record) : null;
}

/** メイン写真・紐付けから一覧サムネ種別を決め直す */
export function refreshMockTempThumb(
  record: MockTempCoordinateRecord,
): MockTempCoordinateRecord {
  const photos = record.photos.filter(Boolean);
  const items = record.items.slice(0, TEMP_COORDINATE_ITEM_MAX);

  if (photos.length > 0) {
    return {
      ...record,
      photos,
      items,
      image_url: photos[0],
      thumb_kind: "photo",
    };
  }

  const itemUrls = mockTempItemImageUrls({ ...record, items });
  if (itemUrls.length > 0) {
    return {
      ...record,
      photos: [],
      items,
      image_url: itemUrls[0],
      thumb_kind: "collage",
    };
  }

  return {
    ...record,
    photos: [],
    items,
    image_url: TEMP_COORDINATE_PLACEHOLDER,
    thumb_kind: "placeholder",
  };
}

/** モック：仮コーデ1件。seedItems があれば最初から紐付け（合成サムネ） */
export function createMockTempCoordinate(
  user: PublicUser,
  gender: ContentGender = "women",
  seedItems: CoordinateItemRef[] = [],
): MockTempCoordinateRecord {
  const id = `temp-new-${Date.now()}`;
  return refreshMockTempThumb({
    id,
    title: "",
    image_url: TEMP_COORDINATE_PLACEHOLDER,
    user,
    posted_at: new Date().toISOString(),
    tags: [],
    seasons: [],
    detail_url: APP_ROUTES.coordinate(id),
    gender,
    obi_knot: null,
    photos: [],
    items: sortCoordinateItemsByCategory(
      seedItems.slice(0, TEMP_COORDINATE_ITEM_MAX),
    ),
    thumb_kind: "placeholder",
    live_synth: true,
  });
}

export function saveMockTempCoordinate(item: MockTempCoordinateRecord) {
  const next = [item, ...readStore().filter((entry) => entry.id !== item.id)];
  writeStore(next);
}

export function listMockTempCoordinates(): PublicListItem[] {
  return readStore().map(mockTempToListItem);
}

/** 指定アイテムを紐付けている仮コーデ（一覧用） */
export function listMockTempCoordinatesUsingItem(
  itemId: string,
): MockTempCoordinateRecord[] {
  return readStore().filter((record) =>
    record.items.some((entry) => entry.id === itemId),
  );
}

export function getMockTempCoordinate(
  id: string,
): MockTempCoordinateRecord | null {
  return readStore().find((entry) => entry.id === id) ?? null;
}

export function removeMockTempCoordinate(id: string) {
  writeStore(readStore().filter((entry) => entry.id !== id));
}

/**
 * 紐付けアイテムを更新。
 * live_synth 中のみサムネを再合成。解除後は photos を維持。
 */
export function updateMockTempCoordinateItems(
  id: string,
  items: CoordinateItemRef[],
): MockTempCoordinateRecord | null {
  const current = getMockTempCoordinate(id);
  if (!current) return null;
  const nextItems = sortCoordinateItemsByCategory(
    items.slice(0, TEMP_COORDINATE_ITEM_MAX),
  );
  if (!current.live_synth) {
    const kept = { ...current, items: nextItems };
    saveMockTempCoordinate(kept);
    return kept;
  }
  const refreshed = refreshMockTempThumb({
    ...current,
    items: nextItems,
    live_synth: true,
  });
  saveMockTempCoordinate(refreshed);
  return refreshed;
}

/** コーデ画像を更新（live_synth 中でも photos を持てる） */
export function updateMockTempCoordinatePhotos(
  id: string,
  photos: string[],
): MockTempCoordinateRecord | null {
  const current = getMockTempCoordinate(id);
  if (!current) return null;
  const refreshed = refreshMockTempThumb({
    ...current,
    photos: photos.filter(Boolean),
  });
  saveMockTempCoordinate(refreshed);
  return refreshed;
}

/**
 * 仮OFF: いまの画像を photos に固定し、以降は紐付けでも再合成しない。
 */
export function releaseMockTempCoordinate(
  id: string,
  photos: string[],
): MockTempCoordinateRecord | null {
  const current = getMockTempCoordinate(id);
  if (!current) return null;
  const fixed = photos.filter(Boolean);
  const fallback =
    fixed.length > 0
      ? fixed
      : mockTempCollageSourceUrls({ ...current, live_synth: true }).slice(0, 1);
  const refreshed = refreshMockTempThumb({
    ...current,
    photos: fallback,
    live_synth: false,
  });
  saveMockTempCoordinate(refreshed);
  return refreshed;
}

/**
 * 仮ON: 再合成モードに戻す。photos を空けて紐付けから作り直す。
 */
export function enableMockTempLiveSynth(
  id: string,
): MockTempCoordinateRecord | null {
  const current = getMockTempCoordinate(id);
  if (!current) return null;
  const refreshed = refreshMockTempThumb({
    ...current,
    photos: [],
    live_synth: true,
  });
  saveMockTempCoordinate(refreshed);
  return refreshed;
}

/** 詳細画面用の公開本文（モック仮コーデ） */
export function mockTempCoordinateDetail(
  item: MockTempCoordinateRecord,
): PublicCoordinateDetail {
  const label = item.title.trim() || "仮コーデ";
  const images =
    item.photos.length > 0
      ? item.photos
      : [item.image_url || TEMP_COORDINATE_PLACEHOLDER];
  return {
    id: item.id,
    title: item.title,
    description: "",
    images,
    user: item.user,
    posted_at: item.posted_at,
    tags: item.tags,
    like_count: 0,
    gender: item.gender,
    obi_knot: item.obi_knot ?? "指定なし",
    items: item.items.slice(0, TEMP_COORDINATE_ITEM_MAX),
    related_coordinates: [],
    og: {
      title: `${label} | きものレシピ`,
      description: label,
      image_url: item.image_url,
    },
  };
}

/** 詳細画面用の所有者フィールド（編集は Next compose） */
export function mockTempCoordinateOwnerFields(
  id: string,
): OwnerCoordinateFields {
  return {
    id,
    edit_url: `${APP_ROUTES.addCoordinate}?id=${encodeURIComponent(id)}&temp=1`,
    add_coordinate_item_url: `${APP_ROUTES.addCoordinate}?id=${encodeURIComponent(id)}&temp=1`,
    private_note: "",
    owner_status: "private",
    updated_at: new Date().toISOString(),
    view_count: 0,
  };
}

/** Next モック：詳細の編集ボタン先（Next compose） */
export function mockComposeEditUrl(
  kind: "coordinate" | "item",
  id: string,
  opts?: { temp?: boolean },
) {
  const base =
    kind === "coordinate" ? APP_ROUTES.addCoordinate : APP_ROUTES.addItem;
  const sp = new URLSearchParams({ id });
  if (opts?.temp) sp.set("temp", "1");
  return `${base}?${sp.toString()}`;
}
