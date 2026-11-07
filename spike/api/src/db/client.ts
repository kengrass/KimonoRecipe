import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backfillImageRowsFromPosts } from "../lib/image-rows.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");
const dbPath = path.join(dataDir, "spike.db");

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      gender TEXT NOT NULL,
      visibility TEXT NOT NULL,
      color_tone TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      images_json TEXT NOT NULL DEFAULT '[]',
      private_note TEXT NOT NULL DEFAULT '',
      favorite_rank INTEGER,
      declutter_candidate INTEGER NOT NULL DEFAULT 0,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      master_url TEXT NOT NULL,
      square_url TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      bytes INTEGER NOT NULL,
      in_unused_pool INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coordinates (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL,
      visibility TEXT NOT NULL,
      obi_knot TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      images_json TEXT NOT NULL DEFAULT '[]',
      private_note TEXT NOT NULL DEFAULT '',
      is_temp INTEGER NOT NULL DEFAULT 0,
      worn_on TEXT,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coordinate_items (
      coordinate_id TEXT NOT NULL REFERENCES coordinates(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (coordinate_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      target_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, kind, target_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (follower_id, followee_id),
      CHECK (follower_id != followee_id)
    );

    CREATE TABLE IF NOT EXISTS user_name_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      changed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_name_history_user
      ON user_name_history(user_id, changed_at);
    CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

    CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_id);
    CREATE INDEX IF NOT EXISTS idx_coordinates_owner ON coordinates(owner_id);
    CREATE INDEX IF NOT EXISTS idx_coordinate_items_item ON coordinate_items(item_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);

    /* 公開検索向け（件数増に備える。本番 MySQL でも同趣旨） */
    CREATE INDEX IF NOT EXISTS idx_items_public_list
      ON items(visibility, created_at);
    CREATE INDEX IF NOT EXISTS idx_items_public_category
      ON items(visibility, category, created_at);
    CREATE INDEX IF NOT EXISTS idx_coords_public_list
      ON coordinates(visibility, is_temp, created_at);
    CREATE INDEX IF NOT EXISTS idx_coords_public_gender
      ON coordinates(visibility, is_temp, gender, created_at);
    CREATE INDEX IF NOT EXISTS idx_coords_public_obi
      ON coordinates(visibility, is_temp, obi_knot, created_at);
  `);

  // 既存 DB 向け
  ensureColumn("users", "bio", `bio TEXT NOT NULL DEFAULT ''`);
  ensureColumn("users", "avatar_url", `avatar_url TEXT`);
  ensureColumn(
    "images",
    "in_unused_pool",
    `in_unused_pool INTEGER NOT NULL DEFAULT 0`,
  );
  ensureColumn(
    "items",
    "view_count",
    `view_count INTEGER NOT NULL DEFAULT 0`,
  );
  ensureColumn(
    "coordinates",
    "view_count",
    `view_count INTEGER NOT NULL DEFAULT 0`,
  );
  ensureColumn("users", "last_active_at", `last_active_at TEXT`);
  ensureColumn("users", "mail_opt_in", `mail_opt_in INTEGER NOT NULL DEFAULT 1`);
  ensureColumn("users", "links_json", `links_json TEXT NOT NULL DEFAULT '[]'`);
  ensureColumn("users", "sns_json", `sns_json TEXT NOT NULL DEFAULT '{}'`);
  ensureColumn("users", "pending_email", `pending_email TEXT`);
  ensureColumn(
    "users",
    "pending_email_code",
    `pending_email_code TEXT`,
  );
  ensureColumn(
    "users",
    "pending_email_expires_at",
    `pending_email_expires_at TEXT`,
  );
  ensureColumn(
    "users",
    "public_size_json",
    `public_size_json TEXT NOT NULL DEFAULT '[]'`,
  );
  ensureColumn(
    "users",
    "admin_status",
    `admin_status TEXT NOT NULL DEFAULT 'active'`,
  );
  ensureColumn(
    "users",
    "admin_note",
    `admin_note TEXT NOT NULL DEFAULT ''`,
  );
  ensureColumn(
    "users",
    "mail_rejected",
    `mail_rejected INTEGER NOT NULL DEFAULT 0`,
  );
  ensureColumn("users", "premium_id", `premium_id TEXT`);
  ensureColumn(
    "users",
    "is_admin",
    `is_admin INTEGER NOT NULL DEFAULT 0`,
  );

  backfillImageRowsFromPosts();

  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viewed_at TEXT NOT NULL,
      day TEXT NOT NULL,
      path TEXT NOT NULL,
      viewer_kind TEXT NOT NULL,
      viewer_key TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_usage_page_views_day
      ON usage_page_views(day);
    CREATE INDEX IF NOT EXISTS idx_usage_page_views_day_kind
      ON usage_page_views(day, viewer_kind, viewer_key);

    CREATE TABLE IF NOT EXISTS ads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      advertiser TEXT NOT NULL DEFAULT '',
      placements_json TEXT NOT NULL DEFAULT '[]',
      href TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      start_on TEXT NOT NULL DEFAULT '',
      end_on TEXT NOT NULL DEFAULT '',
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logo_sponsors (
      id TEXT PRIMARY KEY,
      sponsor_name TEXT NOT NULL DEFAULT '',
      logo_url TEXT NOT NULL DEFAULT '',
      href TEXT NOT NULL DEFAULT '',
      package_note TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      start_on TEXT NOT NULL DEFAULT '',
      end_on TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
