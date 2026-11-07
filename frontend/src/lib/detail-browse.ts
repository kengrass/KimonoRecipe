import { defaultBrowseLabel, type BrowseKind } from "./browse";
import { parseStoredContentKind } from "./content-kind";
import type { CoordinateItemRef, PublicListItem, PublicUser } from "./types";

const KEY = "kr-detail-browse";

/**
 * 一覧→詳細の文脈。
 * 一覧からの遷移は ID 列のみ（実体は neighbor／homeList）。
 * 詳細内レールは items を添える（neighbor 範囲外のため）。
 */
export type DetailBrowseSession = {
  kind: BrowseKind;
  ids: string[];
  /** 関連レール等、neighbor に載らないときだけ */
  items?: PublicListItem[];
  label: string;
  trackListFocus: boolean;
};

export function rememberDetailBrowse(session: DetailBrowseSession) {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearDetailBrowse() {
  sessionStorage.removeItem(KEY);
}

export function readDetailBrowse(): DetailBrowseSession | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DetailBrowseSession & {
      list?: PublicListItem[];
    };
    const kind = parseStoredContentKind(parsed.kind);
    if (!kind || !parsed.label) return null;

    if (Array.isArray(parsed.ids) && parsed.ids.length > 0) {
      return {
        kind,
        ids: parsed.ids.filter((id) => typeof id === "string"),
        items: Array.isArray(parsed.items) ? parsed.items : undefined,
        label: parsed.label,
        trackListFocus: parsed.trackListFocus !== false,
      };
    }

    if (Array.isArray(parsed.list) && parsed.list.length > 0) {
      return {
        kind,
        ids: parsed.list.map((item) => item.id),
        items: parsed.list,
        label: parsed.label,
        trackListFocus: parsed.trackListFocus !== false,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * neighbor／homeList を正とし、session の ID 順で並べる。
 * session.items がある場合（関連レール）はそちらを優先。
 */
export function resolveBrowseList(
  kind: BrowseKind,
  id: string,
  homeList: PublicListItem[],
): { list: PublicListItem[]; label: string; trackListFocus: boolean } {
  const session = readDetailBrowse();
  const fallbackLabel = defaultBrowseLabel(kind);

  if (!session || session.kind !== kind || !session.ids.includes(id)) {
    return { list: homeList, label: fallbackLabel, trackListFocus: true };
  }

  const pool = session.items?.length ? session.items : homeList;
  const byId = new Map(pool.map((item) => [item.id, item]));
  const ordered = session.ids
    .map((itemId) => byId.get(itemId))
    .filter((item): item is PublicListItem => Boolean(item));

  if (ordered.length === 0 || !ordered.some((item) => item.id === id)) {
    return {
      list: homeList,
      label: session.label,
      trackListFocus: session.trackListFocus,
    };
  }

  return {
    list: ordered,
    label: session.label,
    trackListFocus: session.trackListFocus,
  };
}

/** コーデ内アイテムを前後ナビ用リストに変換 */
export function coordinateItemsToBrowseList(
  items: CoordinateItemRef[],
  user: PublicUser,
  postedAt: string,
): PublicListItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    image_url: item.image_url,
    user,
    posted_at: postedAt,
    tags: [item.category],
    seasons: [],
    detail_url: item.detail_url,
    gender: user.id === "mckDemo" ? "men" : "women",
    category: item.category,
  }));
}
