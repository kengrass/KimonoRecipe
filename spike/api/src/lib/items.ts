import { db } from "../db/client.js";
import { unparkImagesFromUrls } from "./image-pool.js";
import { favoriteCount } from "./favorite-stats.js";
import { newPublicId } from "./ids.js";
import { listCoordinatesUsingItem } from "./item-usage.js";
import { escapeLike, likeContains } from "./sanitize.js";
import { seasonsFromTags } from "./seasons.js";

export type Gender = "women" | "men" | "kids";
export type Visibility = "public" | "private";

export type ItemRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  gender: string;
  visibility: string;
  color_tone: string | null;
  tags_json: string;
  images_json: string;
  private_note: string;
  favorite_rank: number | null;
  declutter_candidate: number;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateItemInput = {
  title?: string;
  description?: string;
  category: string;
  gender: Gender;
  visibility: Visibility;
  color_tone?: string | null;
  tags?: string[];
  image_urls?: string[];
  private_note?: string;
  favorite_rank?: number | null;
  declutter_candidate?: boolean;
};

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function ownerAvatarUrl(ownerId: string): string | null {
  const row = db
    .prepare(`SELECT avatar_url FROM users WHERE id = ?`)
    .get(ownerId) as { avatar_url: string | null } | undefined;
  return row?.avatar_url ?? null;
}

export function toPublicItem(row: ItemRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    images: parseJsonArray(row.images_json),
    image_url: parseJsonArray(row.images_json)[0] ?? "",
    gender: row.gender,
    tags: parseJsonArray(row.tags_json),
    seasons: seasonsFromTags(parseJsonArray(row.tags_json)),
    // color_tone は UI 廃止。公開レスポンスには載せない（DB 互換列は残す）
    detail_url: `/i/${row.id}`,
    posted_at: row.created_at,
  };
}

/** 一覧カード形（related／フィード用） */
export function toItemListCard(row: ItemRow, ownerName: string) {
  const pub = toPublicItem(row);
  return {
    id: pub.id,
    title: pub.title,
    image_url: pub.image_url,
    detail_url: pub.detail_url,
    gender: pub.gender,
    tags: pub.tags,
    seasons: pub.seasons,
    category: pub.category,
    user: {
      id: row.owner_id,
      name: ownerName,
      profile_url: `/m/${row.owner_id}`,
      avatar_url: ownerAvatarUrl(row.owner_id),
    },
    posted_at: pub.posted_at,
    like_count: favoriteCount("items", row.id),
  };
}

/** 同ユーザー・同じカテゴリの他の公開アイテム（最大9・当該除外） */
export function listRelatedItems(
  ownerId: string,
  category: string,
  excludeId: string,
  limit = 9,
) {
  const rows = db
    .prepare(
      `SELECT * FROM items
       WHERE owner_id = ? AND visibility = 'public' AND category = ? AND id != ?
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(ownerId, category, excludeId, limit) as ItemRow[];
  const display =
    (
      db.prepare(`SELECT name FROM users WHERE id = ?`).get(ownerId) as
        | { name: string }
        | undefined
    )?.name ?? "";
  return rows.map((row) => toItemListCard(row, display));
}

export function toOwnerItem(row: ItemRow, ownerName: string) {
  const pub = toPublicItem(row);
  return {
    ...pub,
    user: {
      id: row.owner_id,
      name: ownerName,
      profile_url: `/m/${row.owner_id}`,
      avatar_url: ownerAvatarUrl(row.owner_id),
    },
    like_count: favoriteCount("items", row.id),
    // 本コーデ＋仮コーデ（is_temp 付き）。UI 側で分割する
    used_in_coordinates: listCoordinatesUsingItem(row.id, {
      ownerId: row.owner_id,
    }),
    related_items: listRelatedItems(row.owner_id, row.category, row.id),
    og: {
      title: pub.title || `${ownerName}のアイテム`,
      description: pub.description.slice(0, 120),
      image_url: pub.image_url,
    },
    private_note: row.private_note,
    owner_status: row.visibility,
    favorite_rank: row.favorite_rank,
    declutter_candidate: Boolean(row.declutter_candidate),
    updated_at: row.updated_at,
    view_count: Number(row.view_count) || 0,
    edit_url: `/compose/item?id=${row.id}`,
    add_used_coordinate_url: `/compose/coordinate?temp=1`,
  };
}

export function createItem(ownerId: string, input: CreateItemInput): ItemRow {
  const now = new Date().toISOString();
  const id = newPublicId();
  const images = (input.image_urls ?? [])
    .map((u) => u.trim())
    .filter(Boolean);
  if (images.length < 1) {
    throw new Error("image_required");
  }
  db.prepare(
    `INSERT INTO items (
      id, owner_id, title, description, category, gender, visibility,
      color_tone, tags_json, images_json, private_note, favorite_rank,
      declutter_candidate, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    ownerId,
    input.title ?? "",
    input.description ?? "",
    input.category,
    input.gender,
    input.visibility,
    input.color_tone ?? null,
    JSON.stringify(input.tags ?? []),
    JSON.stringify(images),
    input.private_note ?? "",
    input.favorite_rank ?? null,
    input.declutter_candidate ? 1 : 0,
    now,
    now,
  );
  unparkImagesFromUrls(ownerId, images);
  return getItemById(id)!;
}

export function getItemById(id: string): ItemRow | null {
  return (
    (db.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as
      | ItemRow
      | undefined) ?? null
  );
}

export function updateItem(
  row: ItemRow,
  patch: Partial<CreateItemInput> & { image_urls?: string[] },
): ItemRow {
  const images =
    patch.image_urls !== undefined
      ? patch.image_urls.map((u) => u.trim()).filter(Boolean)
      : parseJsonArray(row.images_json);
  if (images.length < 1) {
    throw new Error("image_required");
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE items SET
      title = ?, description = ?, category = ?, gender = ?, visibility = ?,
      color_tone = ?, tags_json = ?, images_json = ?, private_note = ?,
      favorite_rank = ?, declutter_candidate = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    patch.title !== undefined ? patch.title : row.title,
    patch.description !== undefined ? patch.description : row.description,
    patch.category !== undefined ? patch.category : row.category,
    patch.gender !== undefined ? patch.gender : row.gender,
    patch.visibility !== undefined ? patch.visibility : row.visibility,
    patch.color_tone !== undefined ? patch.color_tone : row.color_tone,
    JSON.stringify(
      patch.tags !== undefined ? patch.tags : parseJsonArray(row.tags_json),
    ),
    JSON.stringify(images),
    patch.private_note !== undefined ? patch.private_note : row.private_note,
    patch.favorite_rank !== undefined
      ? patch.favorite_rank
      : row.favorite_rank,
    patch.declutter_candidate !== undefined
      ? patch.declutter_candidate
        ? 1
        : 0
      : row.declutter_candidate,
    now,
    row.id,
  );
  if (patch.image_urls !== undefined) {
    unparkImagesFromUrls(row.owner_id, images);
  }
  return getItemById(row.id)!;
}

export function deleteItem(id: string) {
  db.prepare(`DELETE FROM items WHERE id = ?`).run(id);
}

export type OwnerItemListOpts = {
  q?: string;
  gender?: string;
  /** システムカテゴリ（cat=） */
  category?: string;
  /** 春|夏|秋|冬 — tags に含む */
  season?: string;
  /** public | private */
  visibility?: Visibility;
  declutterOnly?: boolean;
  sort?: string;
};

export function listOwnerItems(
  ownerId: string,
  page: number,
  perPage: number,
  opts: OwnerItemListOpts = {},
): { rows: ItemRow[]; total: number } {
  const where: string[] = [`owner_id = ?`];
  const params: unknown[] = [ownerId];

  if (opts.declutterOnly) {
    where.push(`declutter_candidate = 1`);
  }
  if (opts.category) {
    where.push(`category = ?`);
    params.push(opts.category);
  }
  if (opts.gender) {
    where.push(`gender = ?`);
    params.push(opts.gender);
  }
  if (opts.visibility) {
    where.push(`visibility = ?`);
    params.push(opts.visibility);
  }
  if (opts.season) {
    where.push(`tags_json LIKE ? ESCAPE '\\'`);
    params.push(`%"${escapeLike(opts.season)}"%`);
  }
  if (opts.q?.trim()) {
    where.push(
      `(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\' OR tags_json LIKE ? ESCAPE '\\')`,
    );
    const like = likeContains(opts.q.trim());
    params.push(like, like, like, like);
  }

  const whereSql = where.join(" AND ");
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM items WHERE ${whereSql}`)
      .get(...params) as { c: number }
  ).c;

  let orderSql = `created_at DESC`;
  if (opts.sort === "category") {
    orderSql = `category ASC, created_at DESC`;
  } else if (opts.sort === "favorite_desc") {
    orderSql = `favorite_rank IS NULL ASC, favorite_rank DESC, created_at DESC`;
  } else if (opts.sort === "favorite_asc") {
    orderSql = `favorite_rank IS NULL ASC, favorite_rank ASC, created_at DESC`;
  } else if (opts.sort === "links_desc") {
    orderSql = `(SELECT COUNT(*) FROM coordinate_items ci WHERE ci.item_id = items.id) DESC, created_at DESC`;
  } else if (opts.sort === "links_asc") {
    orderSql = `(SELECT COUNT(*) FROM coordinate_items ci WHERE ci.item_id = items.id) ASC, created_at DESC`;
  }

  const offset = (page - 1) * perPage;
  const rows = db
    .prepare(
      `SELECT * FROM items WHERE ${whereSql}
       ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, offset) as ItemRow[];
  return { rows, total };
}
