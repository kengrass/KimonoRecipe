import { randomInt } from "node:crypto";
import { db } from "../db/client.js";
import { hashPassword, verifyPassword } from "./password.js";
import { getUserById, type UserRow } from "./users.js";

export type ProfileLink = { title: string; url: string };
export type SnsMap = Record<string, string>;

export type PublicSizeEntry = { label: string; value: string };

export type AccountUserRow = UserRow & {
  mail_opt_in: number;
  links_json: string;
  sns_json: string;
  public_size_json?: string;
};

function parseLinks(raw: string): ProfileLink[] {
  try {
    const v = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x): x is ProfileLink =>
          Boolean(x) &&
          typeof x === "object" &&
          typeof (x as ProfileLink).title === "string" &&
          typeof (x as ProfileLink).url === "string",
      )
      .slice(0, 10);
  } catch {
    return [];
  }
}

function parseSns(raw: string): SnsMap {
  try {
    const v = JSON.parse(raw || "{}") as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: SnsMap = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === "string" && val.trim()) out[k] = val.trim();
    }
    return out;
  } catch {
    return {};
  }
}

const SNS_KIND_LABEL: Record<string, { kind: string; label: string }> = {
  twitter: { kind: "x", label: "X" },
  x: { kind: "x", label: "X" },
  instagram: { kind: "instagram", label: "Instagram" },
  tiktok: { kind: "tiktok", label: "TikTok" },
  youtube: { kind: "youtube", label: "YouTube" },
  facebook: { kind: "facebook", label: "Facebook" },
};

function parsePublicSize(raw: string | undefined): PublicSizeEntry[] {
  try {
    const v = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (x): x is PublicSizeEntry =>
          Boolean(x) &&
          typeof x === "object" &&
          typeof (x as PublicSizeEntry).label === "string" &&
          typeof (x as PublicSizeEntry).value === "string",
      )
      .map((x) => ({
        label: x.label.trim(),
        value: x.value.trim(),
      }))
      .filter((x) => x.label && x.value)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export function getAccountUser(id: string): AccountUserRow | null {
  return (
    (db
      .prepare(
        `SELECT id, email, name, bio, avatar_url, created_at,
                mail_opt_in, links_json, sns_json, public_size_json
         FROM users WHERE id = ?`,
      )
      .get(id) as AccountUserRow | undefined) ?? null
  );
}

export function toMeAccount(row: AccountUserRow) {
  return {
    id: row.id,
    name: row.name,
    profile_url: `/m/${row.id}`,
    avatar_url: row.avatar_url,
    bio: row.bio ?? "",
    email: row.email,
    mail_opt_in: row.mail_opt_in === 1,
    links: parseLinks(row.links_json),
    sns: parseSns(row.sns_json),
    public_size: parsePublicSize(row.public_size_json),
  };
}

export function toPublicProfileExtras(row: AccountUserRow) {
  const links = parseLinks(row.links_json)
    .filter((l) => l.url.trim())
    .map((l) => ({
      label: l.title.trim() || l.url,
      href: l.url.trim(),
    }));
  const snsRaw = parseSns(row.sns_json);
  const sns = Object.entries(snsRaw)
    .map(([key, href]) => {
      const meta = SNS_KIND_LABEL[key];
      if (!meta || !href) return null;
      return { kind: meta.kind, href, label: meta.label };
    })
    .filter(Boolean);
  return {
    profile_links: links,
    sns,
    public_size: parsePublicSize(row.public_size_json),
  };
}

export function updateAccountProfile(
  id: string,
  patch: {
    links?: ProfileLink[];
    sns?: SnsMap;
    mail_opt_in?: boolean;
    public_size?: PublicSizeEntry[];
  },
): AccountUserRow {
  const row = getAccountUser(id);
  if (!row) throw new Error("not_found");
  const links =
    patch.links !== undefined
      ? JSON.stringify(patch.links.slice(0, 10))
      : row.links_json;
  const sns =
    patch.sns !== undefined ? JSON.stringify(patch.sns) : row.sns_json;
  const mailOpt =
    patch.mail_opt_in !== undefined
      ? patch.mail_opt_in
        ? 1
        : 0
      : row.mail_opt_in;
  const publicSize =
    patch.public_size !== undefined
      ? JSON.stringify(
          patch.public_size
            .map((x) => ({
              label: x.label.trim(),
              value: x.value.trim(),
            }))
            .filter((x) => x.label && x.value)
            .slice(0, 10),
        )
      : (row.public_size_json ?? "[]");
  db.prepare(
    `UPDATE users SET links_json = ?, sns_json = ?, mail_opt_in = ?, public_size_json = ? WHERE id = ?`,
  ).run(links, sns, mailOpt, publicSize, id);
  return getAccountUser(id)!;
}

export function requestEmailChange(userId: string, nextEmail: string) {
  const email = nextEmail.trim().toLowerCase();
  const taken = db
    .prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?`)
    .get(email, userId) as { id: string } | undefined;
  if (taken) throw new Error("email_taken");

  const code = String(randomInt(100000, 999999));
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 30);
  db.prepare(
    `UPDATE users
     SET pending_email = ?, pending_email_code = ?, pending_email_expires_at = ?
     WHERE id = ?`,
  ).run(email, code, expires.toISOString(), userId);

  // spike: 実メール送信なし。レスポンス／ログで疎通確認
  console.log(`[spike] email change code for ${userId} → ${email}: ${code}`);
  return { email, code };
}

export function confirmEmailChange(userId: string, email: string, code: string) {
  const row = db
    .prepare(
      `SELECT pending_email, pending_email_code, pending_email_expires_at
       FROM users WHERE id = ?`,
    )
    .get(userId) as
    | {
        pending_email: string | null;
        pending_email_code: string | null;
        pending_email_expires_at: string | null;
      }
    | undefined;
  if (!row?.pending_email || !row.pending_email_code) {
    throw new Error("no_pending");
  }
  if (row.pending_email.toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error("email_mismatch");
  }
  if (row.pending_email_code !== code.trim()) {
    throw new Error("invalid_code");
  }
  if (
    row.pending_email_expires_at &&
    Date.parse(row.pending_email_expires_at) < Date.now()
  ) {
    throw new Error("code_expired");
  }
  db.prepare(
    `UPDATE users
     SET email = ?, pending_email = NULL, pending_email_code = NULL,
         pending_email_expires_at = NULL
     WHERE id = ?`,
  ).run(row.pending_email, userId);
  // セッション無効化は routes 側（Cookie 再発行とセット）
  return getUserById(userId)!;
}

export function updatePassword(userId: string, newPassword: string) {
  if (newPassword.length < 6) throw new Error("password_too_short");
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(
    hashPassword(newPassword),
    userId,
  );
}

/** 現行パスワード確認付き。成功時は呼び出し側で全セッション無効化すること */
export function updatePasswordWithCurrent(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (!verifyUserPassword(userId, currentPassword)) {
    throw new Error("current_password_invalid");
  }
  updatePassword(userId, newPassword);
}

export function verifyUserPassword(userId: string, password: string): boolean {
  const row = db
    .prepare(`SELECT password_hash FROM users WHERE id = ?`)
    .get(userId) as { password_hash: string } | undefined;
  if (!row) return false;
  return verifyPassword(password, row.password_hash);
}
