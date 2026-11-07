import { migrate, db } from "./client.js";
import { addFollow } from "../lib/me-collections.js";
import { hashPassword } from "../lib/password.js";
import { newPublicId } from "../lib/ids.js";
import { replaceAds, replaceLogoSponsors } from "../lib/ads.js";

migrate();

const CDN = "https://d2z0ysf6sthedw.cloudfront.net";
const SITE = "https://www.kimonorecipe.com";
const SPONSOR_IMG = `${CDN}/sponsor/c6d84c844af83d5927ccb202e7d9246252f8bce7.png`;

/** フロント ADMIN_ADS / DEFAULT_LOGO_SPONSORS と同型の試作ダミー */
function ensureAdsAndLogoSponsors() {
  const adCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM ads`).get() as { n: number }
  ).n;
  const logoCount = (
    db.prepare(`SELECT COUNT(*) AS n FROM logo_sponsors`).get() as {
      n: number;
    }
  ).n;
  const junkA1 = db
    .prepare(`SELECT name FROM ads WHERE id = 'a1'`)
    .get() as { name: string } | undefined;

  // 空、または試作の a1=test だけのときだけモック種を入れる（手入力は潰さない）
  const shouldSeedAds =
    adCount === 0 || (adCount === 1 && junkA1?.name === "test");
  if (shouldSeedAds) {
    replaceAds([
      {
        id: "a1",
        name: "悉皆クリーニング 秋キャンペーン",
        advertiser: "きはだや",
        placements: ["home_top", "coord_detail"],
        href: `${SITE}/special_sites/cleaning?utm_source=site&utm_medium=square&utm_campaign=kihadaya`,
        imageUrl: SPONSOR_IMG,
        title: "着物のクリーニング（悉皆）",
        enabled: true,
        startOn: "2026-10-01",
        endOn: "2026-12-31",
        impressions: 0,
        clicks: 0,
      },
      {
        id: "a2",
        name: "装いジュエリー（並行配信）",
        advertiser: "ジュエリーモック社",
        placements: ["home_top", "coord_detail"],
        href: `${SITE}/special_sites/cleaning?utm_source=site&utm_medium=square&utm_campaign=jewelry_mock`,
        imageUrl: SPONSOR_IMG,
        title: "装いのジュエリー（モック2枠目）",
        enabled: true,
        startOn: "2026-10-01",
        endOn: "2026-11-30",
        impressions: 0,
        clicks: 0,
      },
      {
        id: "a3",
        name: "アイテム詳細テスト（停止中）",
        advertiser: "きはだや",
        placements: ["item_detail"],
        href: `${SITE}/special_sites/cleaning?utm_source=site&utm_medium=square&utm_campaign=kihadaya`,
        imageUrl: SPONSOR_IMG,
        title: "着物のクリーニング（悉皆）",
        enabled: false,
        startOn: "",
        endOn: "",
        impressions: 0,
        clicks: 0,
      },
    ]);
    console.log("seeded ads (3 dummy campaigns)");
  } else {
    console.log(`ads already present (${adCount}); skip`);
  }

  if (logoCount === 0) {
    replaceLogoSponsors([
      {
        id: "logo-pearltone",
        sponsorName: "デモスポンサーP",
        logoUrl: "/sponsors/pearltone.png",
        href: "https://www.pearltone.com/",
        packageNote: "加工・ケア（営業用サンプル）",
        enabled: true,
        startOn: "2026-01-01",
        endOn: "2026-12-31",
        sortOrder: 1,
      },
      {
        id: "logo-jotaro",
        sponsorName: "デモスポンサーA",
        logoUrl: "/sponsors/jotaro.png",
        href: "https://www.jotaro.net/",
        packageNote: "メーカー・ブランド（営業用サンプル）",
        enabled: true,
        startOn: "2026-01-01",
        endOn: "2026-12-31",
        sortOrder: 2,
      },
      {
        id: "logo-kyo-roman",
        sponsorName: "デモスポンサーB",
        logoUrl: "/sponsors/kyo-roman.png",
        href: "https://kyo-roman.com/",
        packageNote: "小売・呉服店（営業用サンプル）",
        enabled: true,
        startOn: "2026-01-01",
        endOn: "2026-12-31",
        sortOrder: 3,
      },
      {
        id: "logo-nihon-wasou",
        sponsorName: "デモスポンサーC",
        logoUrl: "/sponsors/nihon-wasou.png",
        href: "https://www.wasou.com/",
        packageNote: "着付け・教室（営業用サンプル）",
        enabled: true,
        startOn: "2026-01-01",
        endOn: "2026-12-31",
        sortOrder: 4,
      },
    ]);
    console.log(
      "seeded logo sponsors (demo)",
    );
  } else {
    console.log(`logo_sponsors already present (${logoCount}); skip`);
  }
}

function ensureUser(opts: {
  email: string;
  name: string;
  password: string;
  bio: string;
  isAdmin?: boolean;
}): string {
  const existing = db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .get(opts.email) as { id: string } | undefined;
  const isAdmin = opts.isAdmin ? 1 : 0;
  if (existing) {
    db.prepare(
      `UPDATE users SET name = ?, bio = ?, is_admin = ? WHERE id = ?`,
    ).run(opts.name, opts.bio, isAdmin, existing.id);
    console.log(`user already exists: ${opts.email}`);
    return existing.id;
  }
  const id = newPublicId(6);
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, bio, avatar_url, created_at, is_admin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    opts.email,
    opts.name,
    hashPassword(opts.password),
    opts.bio,
    null,
    new Date().toISOString(),
    isAdmin,
  );
  console.log(`seeded user ${opts.email} / ${opts.password} (id=${id})`);
  return id;
}

const demoId = ensureUser({
  email: "demo@example.com",
  name: "デモ花子",
  password: "demo-pass",
  bio: "Spike デモ用（架空）。管理 API は is_admin=1 のこのアカウントのみ。",
  isAdmin: true,
});

const otherId = ensureUser({
  email: "other@example.com",
  name: "デモ次郎",
  password: "other-pass",
  bio: "Spike フォロー先（架空・非管理者）。",
});

addFollow(demoId, otherId);

// 旧シードの非公式カテゴリ「着物」→ システムカテゴリ「袷」
const renamed = db
  .prepare(`UPDATE items SET category = '袷' WHERE category = '着物'`)
  .run();
if (renamed.changes > 0) {
  console.log(`migrated category 着物→袷 (${renamed.changes} items)`);
}

// 仮コーデは常に private（旧データで public が残っていた場合の掃除）
const tempPublic = db
  .prepare(
    `UPDATE coordinates SET visibility = 'private'
     WHERE is_temp = 1 AND visibility != 'private'`,
  )
  .run();
if (tempPublic.changes > 0) {
  console.log(`migrated temp coords to private (${tempPublic.changes})`);
}

// Next/Image が拒否する ?v= 付き collage URL を掃除
const dirtyCoords = db
  .prepare(`SELECT id, images_json FROM coordinates WHERE images_json LIKE '%?%'`)
  .all() as Array<{ id: string; images_json: string }>;
for (const row of dirtyCoords) {
  try {
    const urls = JSON.parse(row.images_json) as unknown;
    if (!Array.isArray(urls)) continue;
    const cleaned = urls.map((u) =>
      typeof u === "string" ? u.split("?")[0].split("#")[0] : u,
    );
    db.prepare(`UPDATE coordinates SET images_json = ? WHERE id = ?`).run(
      JSON.stringify(cleaned),
      row.id,
    );
  } catch {
    /* ignore */
  }
}
if (dirtyCoords.length > 0) {
  console.log(`cleaned query-string image urls (${dirtyCoords.length} coords)`);
}

ensureAdsAndLogoSponsors();

console.log(`seeded social: demo follows other`);
