import { db } from "../db/client.js";
import { favoriteCount } from "./favorite-stats.js";
import { newPublicId } from "./ids.js";
import { unparkImagesFromUrls } from "./image-pool.js";
import { escapeLike, likeContains } from "./sanitize.js";
import { seasonsFromTags } from "./seasons.js";
import { SYSTEM_ITEM_CATEGORIES } from "./item-categories.js";
import {
  getItemById,
  toPublicItem,
  type Gender,
  type ItemRow,
  type Visibility,
} from "./items.js";

/** 空の仮コーデ用（frontend/public）。temp-collage と同値 */
const TEMP_COORDINATE_PLACEHOLDER_URL =
  "/mock/temp-coordinate-placeholder.png";

const CATEGORY_RANK = new Map(
  SYSTEM_ITEM_CATEGORIES.map((name, i) => [name, i]),
);

function compareItemsByCategoryThenNewest(a: ItemRow, b: ItemRow): number {
  const rankA = CATEGORY_RANK.get(a.category) ?? CATEGORY_RANK.size;
  const rankB = CATEGORY_RANK.get(b.category) ?? CATEGORY_RANK.size;
  if (rankA !== rankB) return rankA - rankB;
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category, "ja");
  }
  if (a.created_at !== b.created_at) {
    return b.created_at.localeCompare(a.created_at);
  }
  return a.id.localeCompare(b.id);
}

export type CoordinateRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  gender: string;
  visibility: string;
  obi_knot: string;
  tags_json: string;
  images_json: string;
  private_note: string;
  is_temp: number;
  worn_on: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateCoordinateInput = {
  title?: string;
  description?: string;
  gender: Gender;
  visibility: Visibility;
  obi_knot?: string;
  tags?: string[];
  image_urls?: string[];
  private_note?: string;
  is_temp?: boolean;
  worn_on?: string | null;
  item_ids?: string[];
};

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function getCoordinateById(id: string): CoordinateRow | null {
  return (
    (db.prepare(`SELECT * FROM coordinates WHERE id = ?`).get(id) as
      | CoordinateRow
      | undefined) ?? null
  );
}

export type OwnerCoordinateListOpts = {
  /** true=仮のみ。未指定／false=本コーデのみ（混在させない） */
  tempOnly?: boolean;
  q?: string;
  gender?: string;
  /** 春|夏|秋|冬 — tags_json に含むもの */
  season?: string;
  obi?: string;
  /** public | private */
  visibility?: Visibility;
  sort?: string;
};

export function listOwnerCoordinates(
  ownerId: string,
  page: number,
  perPage: number,
  opts: OwnerCoordinateListOpts = {},
): { rows: CoordinateRow[]; total: number } {
  // 既定は本コーデのみ。仮は temp=1 のときだけ。混在しない。
  const where: string[] = [
    `owner_id = ?`,
    opts.tempOnly ? `is_temp = 1` : `is_temp = 0`,
  ];
  const params: unknown[] = [ownerId];

  if (opts.gender) {
    where.push(`gender = ?`);
    params.push(opts.gender);
  }
  if (opts.visibility) {
    where.push(`visibility = ?`);
    params.push(opts.visibility);
  }
  if (opts.obi) {
    where.push(`obi_knot = ?`);
    params.push(opts.obi);
  }
  if (opts.season) {
    where.push(`tags_json LIKE ? ESCAPE '\\'`);
    params.push(`%"${escapeLike(opts.season)}"%`);
  }
  if (opts.q?.trim()) {
    where.push(
      `(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR tags_json LIKE ? ESCAPE '\\' OR obi_knot LIKE ? ESCAPE '\\')`,
    );
    const like = likeContains(opts.q.trim());
    params.push(like, like, like, like);
  }
  // 着用日順は着用日ありのみ
  if (opts.sort === "worn") {
    where.push(`worn_on IS NOT NULL AND worn_on != ''`);
  }

  const whereSql = where.join(" AND ");
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM coordinates WHERE ${whereSql}`)
      .get(...params) as { c: number }
  ).c;

  let orderSql = `created_at DESC`;
  if (opts.sort === "worn") {
    orderSql = `worn_on DESC, created_at DESC`;
  } else if (opts.sort === "links_desc") {
    orderSql = `(SELECT COUNT(*) FROM coordinate_items ci WHERE ci.coordinate_id = coordinates.id) DESC, created_at DESC`;
  } else if (opts.sort === "links_asc") {
    orderSql = `(SELECT COUNT(*) FROM coordinate_items ci WHERE ci.coordinate_id = coordinates.id) ASC, created_at DESC`;
  }

  const offset = (page - 1) * perPage;
  const rows = db
    .prepare(
      `SELECT * FROM coordinates WHERE ${whereSql}
       ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, offset) as CoordinateRow[];
  return { rows, total };
}

export function getLinkedItemIds(coordinateId: string): string[] {
  const rows = db
    .prepare(
      `SELECT item_id FROM coordinate_items
       WHERE coordinate_id = ? ORDER BY sort_order ASC, item_id ASC`,
    )
    .all(coordinateId) as Array<{ item_id: string }>;
  return rows.map((r) => r.item_id);
}

export function getLinkedItems(coordinateId: string): ItemRow[] {
  const ids = getLinkedItemIds(coordinateId);
  const out: ItemRow[] = [];
  for (const id of ids) {
    const row = getItemById(id);
    if (row) out.push(row);
  }
  return out;
}

function toItemRefs(
  items: ItemRow[],
  opts: { publicOnly?: boolean } = {},
) {
  const rows = (
    opts.publicOnly
      ? items.filter((item) => item.visibility === "public")
      : items
  ).slice();
  // 表示の正: システムカテゴリ順 → 同カテゴリは新しい登録が上
  rows.sort(compareItemsByCategoryThenNewest);
  return rows.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    image_url: toPublicItem(item).image_url,
    detail_url: `/i/${item.id}`,
  }));
}

/** 一覧カード形（related／フィード用。related を再帰しない） */
export function toCoordinateListCard(row: CoordinateRow, ownerName: string) {
  return {
    id: row.id,
    title: row.title,
    image_url: parseJsonArray(row.images_json)[0] ?? "",
    detail_url: `/c/${row.id}`,
    gender: row.gender,
    tags: parseJsonArray(row.tags_json),
    seasons: seasonsFromTags(parseJsonArray(row.tags_json)),
    user: {
      id: row.owner_id,
      name: ownerName,
      profile_url: `/m/${row.owner_id}`,
    },
    posted_at: row.created_at,
    like_count: favoriteCount("coordinates", row.id),
    obi_knot: row.obi_knot,
  };
}

/** 同ユーザーの他の公開本コーデ（最大9・当該除外） */
export function listRelatedCoordinates(
  ownerId: string,
  excludeId: string,
  limit = 9,
) {
  const rows = db
    .prepare(
      `SELECT * FROM coordinates
       WHERE owner_id = ? AND visibility = 'public' AND is_temp = 0 AND id != ?
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(ownerId, excludeId, limit) as CoordinateRow[];
  const display =
    (
      db.prepare(`SELECT name FROM users WHERE id = ?`).get(ownerId) as
        | { name: string }
        | undefined
    )?.name ?? "";
  return rows.map((row) => toCoordinateListCard(row, display));
}

function ownerAvatarUrl(ownerId: string): string | null {
  const row = db
    .prepare(`SELECT avatar_url FROM users WHERE id = ?`)
    .get(ownerId) as { avatar_url: string | null } | undefined;
  return row?.avatar_url ?? null;
}

export function toPublicCoordinate(
  row: CoordinateRow,
  ownerName: string,
  opts: { includeRelated?: boolean } = {},
) {
  // 公開詳細／一覧派生では非公開アイテムを載せない（紐付け自体は残る）
  const items = toItemRefs(getLinkedItems(row.id), { publicOnly: true });
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    images: parseJsonArray(row.images_json),
    image_url: parseJsonArray(row.images_json)[0] ?? "",
    gender: row.gender,
    obi_knot: row.obi_knot,
    tags: parseJsonArray(row.tags_json),
    seasons: seasonsFromTags(parseJsonArray(row.tags_json)),
    detail_url: `/c/${row.id}`,
    posted_at: row.created_at,
    user: {
      id: row.owner_id,
      name: ownerName,
      profile_url: `/m/${row.owner_id}`,
      avatar_url: ownerAvatarUrl(row.owner_id),
    },
    items,
    like_count: favoriteCount("coordinates", row.id),
    related_coordinates: opts.includeRelated
      ? listRelatedCoordinates(row.owner_id, row.id)
      : [],
    og: {
      title: row.title || `${ownerName}のコーディネート`,
      description: row.description.slice(0, 120),
      image_url: parseJsonArray(row.images_json)[0] ?? "",
    },
  };
}

export function toOwnerCoordinate(row: CoordinateRow, ownerName: string) {
  const pub = toPublicCoordinate(row, ownerName, { includeRelated: true });
  return {
    ...pub,
    // 本人詳細は非公開アイテムも含める
    items: toItemRefs(getLinkedItems(row.id), { publicOnly: false }),
    private_note: row.private_note,
    owner_status: row.visibility,
    is_temp: Boolean(row.is_temp),
    worn_on: row.worn_on,
    updated_at: row.updated_at,
    view_count: Number(row.view_count) || 0,
    edit_url: `/compose/coordinate?id=${row.id}`,
    add_coordinate_item_url: `/compose/coordinate?id=${row.id}`,
  };
}

/** 順序を保ったまま重複 id を落とす */
function uniqueItemIds(itemIds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of itemIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function assertOwnerItems(ownerId: string, itemIds: string[]) {
  for (const id of itemIds) {
    const item = getItemById(id);
    if (!item || item.owner_id !== ownerId) {
      throw new Error("invalid_item");
    }
  }
}

export function replaceCoordinateItems(
  coordinateId: string,
  ownerId: string,
  itemIds: string[],
) {
  const ids = uniqueItemIds(itemIds);
  assertOwnerItems(ownerId, ids);
  // 保存時の sort_order もカテゴリ順に揃える
  const ordered = ids
    .map((id) => getItemById(id)!)
    .sort(compareItemsByCategoryThenNewest)
    .map((row) => row.id);
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM coordinate_items WHERE coordinate_id = ?`).run(
      coordinateId,
    );
    const insert = db.prepare(
      `INSERT INTO coordinate_items (coordinate_id, item_id, sort_order)
       VALUES (?, ?, ?)`,
    );
    ordered.forEach((itemId, i) => {
      insert.run(coordinateId, itemId, i);
    });
    db.prepare(
      `UPDATE coordinates SET updated_at = ? WHERE id = ?`,
    ).run(new Date().toISOString(), coordinateId);
  });
  tx();
}

export function createCoordinate(
  ownerId: string,
  input: CreateCoordinateInput,
): CoordinateRow {
  const isTemp = Boolean(input.is_temp);
  // 仮コーデは公開フィードに載せない（visibility を強制 private）
  const visibility = isTemp ? "private" : input.visibility;
  let images = (input.image_urls ?? []).map((u) => u.trim()).filter(Boolean);
  if (!isTemp && images.length < 1) {
    throw new Error("image_required");
  }
  // 空の仮コーデも通常どおり images にプレースホルダを載せる（詳細・一覧が空にならない）
  if (isTemp && images.length < 1) {
    images = [TEMP_COORDINATE_PLACEHOLDER_URL];
  }

  const itemIds = uniqueItemIds(input.item_ids ?? []);
  assertOwnerItems(ownerId, itemIds);

  const now = new Date().toISOString();
  const id = newPublicId();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO coordinates (
        id, owner_id, title, description, gender, visibility, obi_knot,
        tags_json, images_json, private_note, is_temp, worn_on,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      ownerId,
      input.title ?? "",
      input.description ?? "",
      input.gender,
      visibility,
      input.obi_knot ?? "",
      JSON.stringify(input.tags ?? []),
      JSON.stringify(images),
      input.private_note ?? "",
      isTemp ? 1 : 0,
      input.worn_on ?? null,
      now,
      now,
    );

    const insert = db.prepare(
      `INSERT INTO coordinate_items (coordinate_id, item_id, sort_order)
       VALUES (?, ?, ?)`,
    );
    const orderedItemIds = itemIds
      .map((itemId) => getItemById(itemId)!)
      .sort(compareItemsByCategoryThenNewest)
      .map((item) => item.id);
    orderedItemIds.forEach((itemId, i) => insert.run(id, itemId, i));
  });
  tx();

  unparkImagesFromUrls(ownerId, images);
  return getCoordinateById(id)!;
}

export function updateCoordinate(
  row: CoordinateRow,
  patch: Partial<CreateCoordinateInput> & { image_urls?: string[] },
): CoordinateRow {
  const isTemp =
    patch.is_temp !== undefined ? Boolean(patch.is_temp) : Boolean(row.is_temp);
  const visibility = isTemp
    ? "private"
    : patch.visibility !== undefined
      ? patch.visibility
      : row.visibility;
  const images =
    patch.image_urls !== undefined
      ? patch.image_urls.map((u) => u.trim()).filter(Boolean)
      : parseJsonArray(row.images_json);

  if (!isTemp && images.length < 1) {
    throw new Error("image_required");
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE coordinates SET
      title = ?, description = ?, gender = ?, visibility = ?, obi_knot = ?,
      tags_json = ?, images_json = ?, private_note = ?, is_temp = ?,
      worn_on = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    patch.title !== undefined ? patch.title : row.title,
    patch.description !== undefined ? patch.description : row.description,
    patch.gender !== undefined ? patch.gender : row.gender,
    visibility,
    patch.obi_knot !== undefined ? patch.obi_knot : row.obi_knot,
    JSON.stringify(
      patch.tags !== undefined ? patch.tags : parseJsonArray(row.tags_json),
    ),
    JSON.stringify(images),
    patch.private_note !== undefined ? patch.private_note : row.private_note,
    isTemp ? 1 : 0,
    patch.worn_on !== undefined ? patch.worn_on : row.worn_on,
    now,
    row.id,
  );

  if (patch.item_ids !== undefined) {
    replaceCoordinateItems(row.id, row.owner_id, patch.item_ids);
  }

  if (patch.image_urls !== undefined) {
    unparkImagesFromUrls(row.owner_id, images);
  }

  return getCoordinateById(row.id)!;
}

export function deleteCoordinate(id: string) {
  db.prepare(`DELETE FROM coordinates WHERE id = ?`).run(id);
}
