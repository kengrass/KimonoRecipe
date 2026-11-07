import { getOwnerCoordinate, getOwnerItem } from "@/lib/api";
import type { ComposePresetImage } from "@/lib/compose-preset";
import { parseSpikeMediaPath } from "@/lib/spike-media";
import {
  getMockTempCoordinate,
  isMockTempCoordinateId,
  mockTempCollageSourceUrls,
  mockTempCoordinateDetail,
  mockTempCoordinateOwnerFields,
  mockTempEditImageUrls,
} from "@/lib/mock-temp-coordinate";
import { SEARCH_SEASONS } from "@/lib/search-filters";
import type {
  ContentGender,
  ContentVisibility,
  OwnerCoordinateDetail,
  OwnerItemDetail,
} from "@/lib/types";

export type ComposeVisibility = "public" | "private" | "limited";

export type CoordinateEditSeed = {
  images: ComposePresetImage[];
  /** 仮ONかつ photos 空のとき、編集画面で1枚合成する材料 */
  collageSourceUrls: string[];
  gender: ContentGender;
  visibility: ComposeVisibility;
  obi: string;
  title: string;
  seasons: string[];
  tags: string[];
  memo1: string;
  memo2: string;
  wornAt: string;
  isTemp: boolean;
};

export type ItemEditSeed = {
  images: ComposePresetImage[];
  gender: ContentGender;
  visibility: ComposeVisibility;
  category: string | null;
  name: string;
  seasons: string[];
  tags: string[];
  memo1: string;
  memo2: string;
  /** `"1"`〜`"5"`。未設定は `""` */
  favorite: string;
  declutter: boolean;
};

function toSeedImages(urls: string[], alt: string): ComposePresetImage[] {
  return urls.map((src, i) => {
    const parsed = parseSpikeMediaPath(src);
    // API の URL をそのまま使う（square-stamp.jpg を square.jpg に潰さない＝キャッシュ避け）
    return {
      id: parsed?.imageId ?? `edit-img-${i}`,
      src,
      alt,
      masterSrc: parsed?.masterUrl,
    };
  });
}

function visibilityFromOwner(status: ContentVisibility): ComposeVisibility {
  return status === "private" ? "private" : "public";
}

const SEASON_SET = new Set<string>(SEARCH_SEASONS);

/** API の seasons / tags から編集 UI 用に季節と通常タグを分離 */
function splitSeasonsAndTags(
  tags: string[],
  seasonsHint?: string[] | null,
): { seasons: string[]; tags: string[] } {
  const fromHint = (seasonsHint ?? []).filter((s) => SEASON_SET.has(s));
  const fromTags = tags.filter((t) => SEASON_SET.has(t));
  const seasons = [...new Set([...fromHint, ...fromTags])];
  return {
    seasons,
    tags: tags.filter((t) => !SEASON_SET.has(t)),
  };
}

function seasonsHintFromDetail(detail: {
  tags: string[];
  seasons?: string[];
}): string[] | undefined {
  return Array.isArray(detail.seasons) ? detail.seasons : undefined;
}

function coordinateSeedFromOwner(
  detail: OwnerCoordinateDetail,
  isTemp: boolean,
  collageSourceUrls: string[] = [],
): CoordinateEditSeed {
  const split = splitSeasonsAndTags(
    detail.tags,
    seasonsHintFromDetail(detail),
  );
  return {
    images: toSeedImages(
      detail.images,
      detail.title.trim() || "コーディネート",
    ),
    collageSourceUrls,
    gender: detail.gender,
    visibility: visibilityFromOwner(detail.owner_status),
    obi: detail.obi_knot || "指定なし",
    title: detail.title,
    seasons: split.seasons,
    tags: split.tags,
    memo1: detail.description,
    memo2: detail.private_note,
    wornAt: detail.worn_on?.trim() || "",
    isTemp,
  };
}

function itemSeedFromOwner(detail: OwnerItemDetail): ItemEditSeed {
  const rank = detail.favorite_rank;
  const split = splitSeasonsAndTags(
    detail.tags,
    seasonsHintFromDetail(detail),
  );
  return {
    images: toSeedImages(detail.images, detail.title.trim() || "アイテム"),
    gender: detail.gender,
    visibility: visibilityFromOwner(detail.owner_status),
    category: detail.category || null,
    name: detail.title,
    seasons: split.seasons,
    tags: split.tags,
    memo1: detail.description,
    memo2: detail.private_note,
    favorite:
      rank != null && rank >= 1 && rank <= 5 ? String(rank) : "",
    declutter: Boolean(detail.declutter_candidate),
  };
}

/** 編集画面用に本人詳細（なければ仮モック）を読む */
export async function loadCoordinateEditSeed(
  id: string,
  viewerUserId: string | null | undefined,
  opts?: { tempHint?: boolean },
): Promise<CoordinateEditSeed | null> {
  if (isMockTempCoordinateId(id)) {
    const item = getMockTempCoordinate(id);
    if (!item) return null;
    const detail = {
      ...mockTempCoordinateDetail(item),
      ...mockTempCoordinateOwnerFields(id),
    };
    // photos のみ初期表示。仮ONの合成材料は collageSourceUrls（編集画面で1枚化）。
    return {
      ...coordinateSeedFromOwner(
        detail,
        item.live_synth,
        mockTempCollageSourceUrls(item),
      ),
      images: toSeedImages(
        mockTempEditImageUrls(item),
        item.title.trim() || "コーディネート",
      ),
    };
  }

  if (!viewerUserId) return null;
  const detail = await getOwnerCoordinate(id, { viewerUserId });
  if (!detail) return null;
  // サーバの is_temp を正にする（URL の temp=1 は新規ヒント用のフォールバック）
  const isTemp =
    detail.is_temp !== undefined
      ? Boolean(detail.is_temp)
      : Boolean(opts?.tempHint);
  const collageSourceUrls = isTemp
    ? detail.items.map((item) => item.image_url).filter(Boolean)
    : [];
  return coordinateSeedFromOwner(detail, isTemp, collageSourceUrls);
}

export async function loadItemEditSeed(
  id: string,
  viewerUserId: string | null | undefined,
): Promise<ItemEditSeed | null> {
  if (!viewerUserId) return null;
  const detail = await getOwnerItem(id, { viewerUserId });
  if (!detail) return null;
  return itemSeedFromOwner(detail);
}
