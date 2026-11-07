import { db } from "../db/client.js";

export const ANON_COOKIE = "kr_anon_id";

function todayYmd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayOffsetYmd(offsetDays: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return todayYmd(d);
}

/** pathname のみ・200 文字。フロント `normalizePageviewPath` と同規則 */
function normalizePath(path: string): string {
  const trimmed = path.trim() || "/";
  const noQuery = trimmed.split("?")[0]?.split("#")[0] || "/";
  return noQuery.slice(0, 200);
}

/**
 * 同一閲覧者・同一 path の極短連打だけ落とす（二重 POST の安全網）。
 * クライアントは 100ms settle。ここはそれより少し長い程度に留め、
 * 正当な再訪（別画面を挟んだあと）は落とさない。
 */
const PV_DUP_POST_MS = 300;

export function recordPageView(input: {
  path: string;
  viewerKind: "member" | "guest";
  viewerKey: string;
}): void {
  const path = normalizePath(input.path);
  const viewerKey = input.viewerKey.trim().slice(0, 64);
  if (!viewerKey) return;
  const now = new Date();
  const nowIso = now.toISOString();
  const day = todayYmd(now);

  const recent = db
    .prepare(
      `SELECT viewed_at FROM usage_page_views
       WHERE viewer_key = ? AND path = ?
       ORDER BY viewed_at DESC LIMIT 1`,
    )
    .get(viewerKey, path) as { viewed_at: string } | undefined;
  if (recent?.viewed_at) {
    const prev = Date.parse(recent.viewed_at);
    if (Number.isFinite(prev) && now.getTime() - prev < PV_DUP_POST_MS) {
      return;
    }
  }

  db.prepare(
    `INSERT INTO usage_page_views (viewed_at, day, path, viewer_kind, viewer_key)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(nowIso, day, path, input.viewerKind, viewerKey);
}

function countPostsOnDay(table: "coordinates" | "items", day: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM ${table}
       WHERE substr(created_at, 1, 10) = ?`,
    )
    .get(day) as { n: number };
  return row.n;
}

function snapshotForDay(day: string) {
  const pv = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM usage_page_views WHERE day = ?`)
      .get(day) as { n: number }
  ).n;
  const memberUu = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT viewer_key) AS n
         FROM usage_page_views
         WHERE day = ? AND viewer_kind = 'member'`,
      )
      .get(day) as { n: number }
  ).n;
  const guestUu = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT viewer_key) AS n
         FROM usage_page_views
         WHERE day = ? AND viewer_kind = 'guest'`,
      )
      .get(day) as { n: number }
  ).n;
  return {
    date: day,
    memberUu,
    guestUu,
    pv,
    coordinateCount: countPostsOnDay("coordinates", day),
    itemCount: countPostsOnDay("items", day),
  };
}

function pathLabel(path: string): string {
  if (path === "/" || path === "") return "トップ";
  if (path.startsWith("/search")) return "検索";
  if (path.startsWith("/c/")) return "コーデ詳細";
  if (path.startsWith("/i/")) return "アイテム詳細";
  if (path.startsWith("/m/") || path.startsWith("/mypage")) return "プロフィール";
  if (path.startsWith("/compose")) return "投稿";
  if (path.startsWith("/login") || path.startsWith("/regist")) return "認証";
  return path.slice(0, 40);
}

/** 管理統計用 UsageInsight 形 */
export function buildUsageInsight() {
  const today = todayYmd();
  const last7Days = [];
  for (let i = -6; i <= 0; i++) {
    last7Days.push(snapshotForDay(dayOffsetYmd(i)));
  }

  const pageRows = db
    .prepare(
      `SELECT path,
              COUNT(*) AS pv,
              SUM(CASE WHEN viewer_kind = 'member' THEN 1 ELSE 0 END) AS member_pv
       FROM usage_page_views
       WHERE day = ?
       GROUP BY path
       ORDER BY pv DESC
       LIMIT 12`,
    )
    .all(today) as Array<{ path: string; pv: number; member_pv: number }>;

  const pagePv = pageRows.map((row) => {
    const pv = Number(row.pv) || 0;
    const memberPv = Number(row.member_pv) || 0;
    return {
      pathLabel: pathLabel(row.path),
      pv,
      memberShare: pv > 0 ? memberPv / pv : 0,
    };
  });

  const topCoordinates = (
    db
      .prepare(
        `SELECT id, title, view_count AS pv
         FROM coordinates
         WHERE is_temp = 0 AND visibility = 'public'
         ORDER BY view_count DESC, created_at DESC
         LIMIT 8`,
      )
      .all() as Array<{ id: string; title: string; pv: number }>
  ).map((row) => ({
    id: row.id,
    kind: "coordinate" as const,
    title: row.title || row.id,
    pv: row.pv,
  }));

  const topItems = (
    db
      .prepare(
        `SELECT id, title, view_count AS pv
         FROM items
         WHERE visibility = 'public'
         ORDER BY view_count DESC, created_at DESC
         LIMIT 8`,
      )
      .all() as Array<{ id: string; title: string; pv: number }>
  ).map((row) => ({
    id: row.id,
    kind: "item" as const,
    title: row.title || row.id,
    pv: row.pv,
  }));

  const detailViews = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM usage_page_views
         WHERE day = ?
           AND (path LIKE '/c/%' OR path LIKE '/i/%')`,
      )
      .get(today) as { n: number }
  ).n;
  const authViews = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM usage_page_views
         WHERE day = ?
           AND (path LIKE '/login%' OR path LIKE '/regist%')`,
      )
      .get(today) as { n: number }
  ).n;

  return {
    today: snapshotForDay(today),
    last7Days,
    pagePv,
    topCoordinates,
    topItems,
    searches: [] as Array<{ query: string; count: number; zeroHit: boolean }>,
    funnel: {
      detailViews,
      authPromptShown: authViews,
      loginOrRegist: authViews,
    },
  };
}
