import { db } from "../db/client.js";
import { toPublicCoordinate, type CoordinateRow } from "./coordinates.js";
import { favoriteCount } from "./favorite-stats.js";
import { toPublicItem, type ItemRow } from "./items.js";
import { escapeLike, likeContains } from "./sanitize.js";
import { isContentSeason, seasonsFromTags } from "./seasons.js";

function ownerName(userId: string): string {
  const row = db
    .prepare(`SELECT name FROM users WHERE id = ?`)
    .get(userId) as { name: string } | undefined;
  return row?.name ?? "";
}

function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export type ListQuery = {
  q?: string;
  page: number;
  perPage: number;
  userId?: string;
  gender?: string;
  /** 春|夏|秋|冬 — tags_json に含む */
  season?: string;
  /** システムカテゴリ（items のみ） */
  category?: string;
  /** 帯結び（coordinates のみ） */
  obi?: string;
  /** タグ完全一致（JSON 配列要素） */
  tag?: string;
  /** マイページ相当の並べ替え */
  sort?: string;
};

/** 公開一覧の紐付け数は、公開本コーデ／公開アイテムだけ数える（非公開・仮の件数を漏らさない） */
function coordinateOrderSql(sort?: string): string {
  if (sort === "worn") {
    return `worn_on DESC, created_at DESC`;
  }
  const publicItemLinks = `(SELECT COUNT(*) FROM coordinate_items ci
       JOIN items i ON i.id = ci.item_id
       WHERE ci.coordinate_id = coordinates.id AND i.visibility = 'public')`;
  if (sort === "links_desc") {
    return `${publicItemLinks} DESC, created_at DESC`;
  }
  if (sort === "links_asc") {
    return `${publicItemLinks} ASC, created_at DESC`;
  }
  return `created_at DESC`;
}

function itemOrderSql(sort?: string): string {
  if (sort === "category") {
    return `category ASC, created_at DESC`;
  }
  // favorite_* は owner 専用。公開一覧では無視して新着順
  const publicCoordLinks = `(SELECT COUNT(*) FROM coordinate_items ci
       JOIN coordinates c ON c.id = ci.coordinate_id
       WHERE ci.item_id = items.id AND c.visibility = 'public' AND c.is_temp = 0)`;
  if (sort === "links_desc") {
    return `${publicCoordLinks} DESC, created_at DESC`;
  }
  if (sort === "links_asc") {
    return `${publicCoordLinks} ASC, created_at DESC`;
  }
  return `created_at DESC`;
}

function meta(page: number, perPage: number, total: number) {
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.max(1, Math.ceil(total / perPage) || 1),
  };
}

function pushTagMatch(where: string[], params: unknown[], tag: string) {
  // tags_json は JSON 配列。完全一致要素をざっくり LIKE で拾う
  where.push(`tags_json LIKE ? ESCAPE '\\'`);
  params.push(`%"${escapeLike(tag)}"%`);
}

export function listPublicItems(query: ListQuery) {
  const where: string[] = [`visibility = 'public'`];
  const params: unknown[] = [];

  if (query.userId) {
    where.push(`owner_id = ?`);
    params.push(query.userId);
  }
  if (query.gender) {
    where.push(`gender = ?`);
    params.push(query.gender);
  }
  if (query.category) {
    where.push(`category = ?`);
    params.push(query.category);
  }
  if (query.season && isContentSeason(query.season)) {
    pushTagMatch(where, params, query.season);
  }
  if (query.tag?.trim()) {
    pushTagMatch(where, params, query.tag.trim());
  }
  if (query.q?.trim()) {
    where.push(
      `(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\' OR tags_json LIKE ? ESCAPE '\\' OR owner_id IN (SELECT id FROM users WHERE name LIKE ? ESCAPE '\\'))`,
    );
    const like = likeContains(query.q.trim());
    params.push(like, like, like, like, like);
  }

  const whereSql = where.join(" AND ");
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM items WHERE ${whereSql}`)
      .get(...params) as { c: number }
  ).c;

  const offset = (query.page - 1) * query.perPage;
  const orderSql = itemOrderSql(query.sort);
  const rows = db
    .prepare(
      `SELECT * FROM items WHERE ${whereSql}
       ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    )
    .all(...params, query.perPage, offset) as ItemRow[];

  const data = rows.map((row) => {
    const pub = toPublicItem(row);
    const tags = parseJsonArray(row.tags_json);
    const avatar = db
      .prepare(`SELECT avatar_url FROM users WHERE id = ?`)
      .get(row.owner_id) as { avatar_url: string | null } | undefined;
    return {
      ...pub,
      seasons: seasonsFromTags(tags),
      user: {
        id: row.owner_id,
        name: ownerName(row.owner_id),
        profile_url: `/m/${row.owner_id}`,
        avatar_url: avatar?.avatar_url ?? null,
      },
      like_count: favoriteCount("items", row.id),
    };
  });

  return { data, meta: meta(query.page, query.perPage, total) };
}

/**
 * コーデ公開一覧。
 * `cat` があるときは「公開アイテム category → 紐付け → 公開本コーデ」を起点にする
 * （EXISTS 相関より、カテゴリ選択性が高いときに索引が効きやすい）。
 */
export function listPublicCoordinates(query: ListQuery) {
  const offset = (query.page - 1) * query.perPage;
  const orderSql = coordinateOrderSql(query.sort);

  if (query.category) {
    return listPublicCoordinatesByItemCategory(query, orderSql, offset);
  }

  // 仮コーデは公開フィードに載せない
  const where: string[] = [`visibility = 'public'`, `is_temp = 0`];
  const params: unknown[] = [];
  pushCoordinateFilters(where, params, query, { tableAlias: null });
  if (query.sort === "worn") {
    where.push(`worn_on IS NOT NULL AND worn_on != ''`);
  }

  const whereSql = where.join(" AND ");
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM coordinates WHERE ${whereSql}`)
      .get(...params) as { c: number }
  ).c;

  const rows = db
    .prepare(
      `SELECT * FROM coordinates WHERE ${whereSql}
       ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    )
    .all(...params, query.perPage, offset) as CoordinateRow[];

  return {
    data: rows.map((row) => toCoordinateCard(row)),
    meta: meta(query.page, query.perPage, total),
  };
}

function toCoordinateCard(row: CoordinateRow) {
  const full = toPublicCoordinate(row, ownerName(row.owner_id));
  return {
    id: full.id,
    title: full.title,
    image_url: full.image_url,
    detail_url: full.detail_url,
    gender: full.gender,
    tags: full.tags,
    seasons: full.seasons,
    user: full.user,
    posted_at: full.posted_at,
    like_count: favoriteCount("coordinates", row.id),
    obi_knot: full.obi_knot,
  };
}

function pushCoordinateFilters(
  where: string[],
  params: unknown[],
  query: ListQuery,
  opts: { tableAlias: string | null },
) {
  const col = (name: string) =>
    opts.tableAlias ? `${opts.tableAlias}.${name}` : name;

  if (query.userId) {
    where.push(`${col("owner_id")} = ?`);
    params.push(query.userId);
  }
  if (query.gender) {
    where.push(`${col("gender")} = ?`);
    params.push(query.gender);
  }
  if (query.obi) {
    where.push(`${col("obi_knot")} = ?`);
    params.push(query.obi);
  }
  if (query.season && isContentSeason(query.season)) {
    where.push(`${col("tags_json")} LIKE ? ESCAPE '\\'`);
    params.push(`%"${escapeLike(query.season)}"%`);
  }
  if (query.tag?.trim()) {
    where.push(`${col("tags_json")} LIKE ? ESCAPE '\\'`);
    params.push(`%"${escapeLike(query.tag.trim())}"%`);
  }
  if (query.q?.trim()) {
    where.push(
      `(${col("title")} LIKE ? ESCAPE '\\' OR ${col("description")} LIKE ? ESCAPE '\\' OR ${col("tags_json")} LIKE ? ESCAPE '\\' OR ${col("obi_knot")} LIKE ? ESCAPE '\\' OR ${col("owner_id")} IN (SELECT id FROM users WHERE name LIKE ? ESCAPE '\\'))`,
    );
    const like = likeContains(query.q.trim());
    params.push(like, like, like, like, like);
  }
}

const DEFAULT_NEIGHBOR_PER_PAGE = 12;

/**
 * 詳細前後ナビ用。公開新着順で当該 ID が属するページ分だけ返す（全件禁止）。
 * 非公開・仮・存在しない ID は null（呼び出し側で 404）。
 */
export function listPublicNeighbors(
  kind: "coordinates" | "items",
  id: string,
  perPage = DEFAULT_NEIGHBOR_PER_PAGE,
): { data: unknown[] } | null {
  if (kind === "coordinates") {
    const row = db
      .prepare(
        `SELECT id FROM coordinates
         WHERE visibility = 'public' AND is_temp = 0 AND id = ?`,
      )
      .get(id) as { id: string } | undefined;
    if (!row) return null;

    const ids = (
      db
        .prepare(
          `SELECT id FROM coordinates
           WHERE visibility = 'public' AND is_temp = 0
           ORDER BY created_at DESC`,
        )
        .all() as Array<{ id: string }>
    ).map((r) => r.id);
    const index = ids.indexOf(id);
    if (index < 0) return null;
    const page = Math.floor(index / perPage) + 1;
    return {
      data: listPublicCoordinates({ page, perPage }).data,
    };
  }

  const row = db
    .prepare(
      `SELECT id FROM items WHERE visibility = 'public' AND id = ?`,
    )
    .get(id) as { id: string } | undefined;
  if (!row) return null;

  const ids = (
    db
      .prepare(
        `SELECT id FROM items WHERE visibility = 'public' ORDER BY created_at DESC`,
      )
      .all() as Array<{ id: string }>
  ).map((r) => r.id);
  const index = ids.indexOf(id);
  if (index < 0) return null;
  const page = Math.floor(index / perPage) + 1;
  return {
    data: listPublicItems({ page, perPage }).data,
  };
}

function listPublicCoordinatesByItemCategory(
  query: ListQuery,
  orderSql: string,
  offset: number,
) {
  // カテゴリ索引 → 紐付け → 公開コーデ。外側は通常のコーデ条件＋ORDER
  const where: string[] = [
    `visibility = 'public'`,
    `is_temp = 0`,
    `id IN (
      SELECT ci.coordinate_id
      FROM coordinate_items ci
      JOIN items i ON i.id = ci.item_id
      WHERE i.visibility = 'public' AND i.category = ?
    )`,
  ];
  const params: unknown[] = [query.category];
  pushCoordinateFilters(where, params, query, { tableAlias: null });

  const whereSql = where.join(" AND ");
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM coordinates WHERE ${whereSql}`)
      .get(...params) as { c: number }
  ).c;

  const rows = db
    .prepare(
      `SELECT * FROM coordinates WHERE ${whereSql}
       ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    )
    .all(...params, query.perPage, offset) as CoordinateRow[];

  return {
    data: rows.map((row) => toCoordinateCard(row)),
    meta: meta(query.page, query.perPage, total),
  };
}
