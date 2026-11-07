import crypto from "node:crypto";
import { db } from "../db/client.js";
import { hashPassword } from "./password.js";

/** 管理画面向けユーザー行（フロント AdminUser と同形） */
export type AdminUserDto = {
  id: string;
  premiumId: string | null;
  email: string;
  mailRejected: boolean;
  name: string;
  status: "active" | "suspended" | "withdrawn";
  adminNote: string;
  publicCoordinateCount: number;
  privateCoordinateCount: number;
  tempCoordinateCount: number;
  publicItemCount: number;
  privateItemCount: number;
  /** 本コーデのうちアイテム1件以上付きの割合 0–1 */
  attachmentRate: number;
  imageCount: number;
  registeredAt: string;
  lastActiveAt: string;
};

type CountRow = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_active_at: string | null;
  admin_status: string;
  admin_note: string;
  mail_rejected: number;
  premium_id: string | null;
  public_coordinate_count: number;
  private_coordinate_count: number;
  temp_coordinate_count: number;
  public_item_count: number;
  private_item_count: number;
  main_coordinate_count: number;
  linked_coordinate_count: number;
  image_count: number;
};

const USER_SELECT = `
  SELECT
    u.id,
    u.email,
    u.name,
    u.created_at,
    u.last_active_at,
    u.admin_status,
    u.admin_note,
    u.mail_rejected,
    u.premium_id,
    (SELECT COUNT(*) FROM coordinates c
      WHERE c.owner_id = u.id AND c.is_temp = 0 AND c.visibility = 'public')
      AS public_coordinate_count,
    (SELECT COUNT(*) FROM coordinates c
      WHERE c.owner_id = u.id AND c.is_temp = 0 AND c.visibility = 'private')
      AS private_coordinate_count,
    (SELECT COUNT(*) FROM coordinates c
      WHERE c.owner_id = u.id AND c.is_temp = 1)
      AS temp_coordinate_count,
    (SELECT COUNT(*) FROM items i
      WHERE i.owner_id = u.id AND i.visibility = 'public')
      AS public_item_count,
    (SELECT COUNT(*) FROM items i
      WHERE i.owner_id = u.id AND i.visibility = 'private')
      AS private_item_count,
    (SELECT COUNT(*) FROM coordinates c
      WHERE c.owner_id = u.id AND c.is_temp = 0)
      AS main_coordinate_count,
    (SELECT COUNT(*) FROM coordinates c
      WHERE c.owner_id = u.id AND c.is_temp = 0
        AND EXISTS (
          SELECT 1 FROM coordinate_items ci WHERE ci.coordinate_id = c.id
        ))
      AS linked_coordinate_count,
    (SELECT COUNT(*) FROM images im WHERE im.owner_id = u.id)
      AS image_count
  FROM users u
`;

function normalizeStatus(
  raw: string,
): AdminUserDto["status"] {
  if (raw === "suspended" || raw === "withdrawn" || raw === "active") {
    return raw;
  }
  return "active";
}

function toDto(row: CountRow): AdminUserDto {
  const main = Number(row.main_coordinate_count) || 0;
  const linked = Number(row.linked_coordinate_count) || 0;
  return {
    id: row.id,
    premiumId: row.premium_id?.trim() || null,
    email: row.email,
    mailRejected: Number(row.mail_rejected) === 1,
    name: row.name,
    status: normalizeStatus(row.admin_status ?? "active"),
    adminNote: row.admin_note ?? "",
    publicCoordinateCount: Number(row.public_coordinate_count) || 0,
    privateCoordinateCount: Number(row.private_coordinate_count) || 0,
    tempCoordinateCount: Number(row.temp_coordinate_count) || 0,
    publicItemCount: Number(row.public_item_count) || 0,
    privateItemCount: Number(row.private_item_count) || 0,
    attachmentRate: main > 0 ? linked / main : 0,
    imageCount: Number(row.image_count) || 0,
    registeredAt: row.created_at,
    lastActiveAt: row.last_active_at || row.created_at,
  };
}

export function listAdminUsers(): AdminUserDto[] {
  const rows = db.prepare(`${USER_SELECT} ORDER BY u.created_at DESC`).all() as CountRow[];
  return rows.map(toDto);
}

export function getAdminUser(id: string): AdminUserDto | null {
  const row = db.prepare(`${USER_SELECT} WHERE u.id = ?`).get(id) as
    | CountRow
    | undefined;
  return row ? toDto(row) : null;
}

export function updateAdminUser(
  id: string,
  patch: {
    email?: string;
    name?: string;
    status?: AdminUserDto["status"];
    adminNote?: string;
    mailRejected?: boolean;
    premiumId?: string | null;
  },
): AdminUserDto | null {
  const existing = getAdminUser(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE users SET
      email = ?,
      name = ?,
      admin_status = ?,
      admin_note = ?,
      mail_rejected = ?,
      premium_id = ?
     WHERE id = ?`,
  ).run(
    patch.email !== undefined ? patch.email.trim() : existing.email,
    patch.name !== undefined ? patch.name.trim() : existing.name,
    patch.status !== undefined ? patch.status : existing.status,
    patch.adminNote !== undefined ? patch.adminNote : existing.adminNote,
    patch.mailRejected !== undefined
      ? patch.mailRejected
        ? 1
        : 0
      : existing.mailRejected
        ? 1
        : 0,
    patch.premiumId !== undefined
      ? patch.premiumId?.trim() || null
      : existing.premiumId,
    id,
  );
  return getAdminUser(id);
}

/** spike: 実メールは送らず、一時パスワードを発行してレスポンスに出す（本番は案内メール） */
export function adminResetPassword(id: string): {
  temporaryPassword: string;
} | null {
  if (!getAdminUser(id)) return null;
  const temporaryPassword = `reset-${crypto.randomBytes(9).toString("base64url")}`;
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(
    hashPassword(temporaryPassword),
    id,
  );
  // 本番はメール送信のみ。spike でも平文をログに残さない。
  return { temporaryPassword };
}

export type AdminKpisDto = {
  userCount: number;
  coordinateCount: number;
  tempCoordinateCount: number;
  itemCount: number;
  imageCount: number;
  attachmentRate: number;
};

export function buildAdminKpis(): AdminKpisDto {
  const userCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number }
  ).n;
  const coordinateCount = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM coordinates WHERE is_temp = 0`)
      .get() as { n: number }
  ).n;
  const tempCoordinateCount = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM coordinates WHERE is_temp = 1`)
      .get() as { n: number }
  ).n;
  const linkedMain = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM coordinates c
         WHERE c.is_temp = 0
           AND EXISTS (
             SELECT 1 FROM coordinate_items ci WHERE ci.coordinate_id = c.id
           )`,
      )
      .get() as { n: number }
  ).n;
  const itemCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM items`).get() as { n: number }
  ).n;
  const imageCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM images`).get() as { n: number }
  ).n;
  return {
    userCount,
    coordinateCount,
    tempCoordinateCount,
    itemCount,
    imageCount,
    attachmentRate: coordinateCount > 0 ? linkedMain / coordinateCount : 0,
  };
}

type ActivityBucketId =
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "180d"
  | "365d"
  | "366d+";

const BUCKET_DEFS: {
  id: ActivityBucketId;
  label: string;
  maxDays: number | null;
}[] = [
  { id: "24h", label: "〜24時間", maxDays: 1 },
  { id: "7d", label: "〜7日", maxDays: 7 },
  { id: "30d", label: "〜30日", maxDays: 30 },
  { id: "90d", label: "〜90日", maxDays: 90 },
  { id: "180d", label: "〜180日", maxDays: 180 },
  { id: "365d", label: "〜365日", maxDays: 365 },
  { id: "366d+", label: "366日〜", maxDays: null },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildActivityBuckets(users: AdminUserDto[], nowMs = Date.now()) {
  const total = users.length || 1;
  const ages = users.map((u) => {
    const t = Date.parse(u.lastActiveAt);
    return Number.isNaN(t) ? Infinity : (nowMs - t) / DAY_MS;
  });

  const counts = BUCKET_DEFS.map((def, index) => {
    if (def.maxDays == null) {
      return ages.filter((a) => a > 365).length;
    }
    if (index === 0) {
      return ages.filter((a) => a <= def.maxDays!).length;
    }
    const prevMax = BUCKET_DEFS[index - 1].maxDays ?? 0;
    return ages.filter((a) => a > prevMax && a <= def.maxDays!).length;
  });

  let cumulative = 0;
  return BUCKET_DEFS.map((def, i) => {
    cumulative += counts[i]!;
    return {
      id: def.id,
      label: def.label,
      count: counts[i]!,
      share: counts[i]! / total,
      cumulativeCount: cumulative,
      cumulativeShare: cumulative / total,
    };
  });
}
