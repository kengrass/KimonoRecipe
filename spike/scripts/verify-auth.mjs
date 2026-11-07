/**
 * 認可境界の回帰確認（spike HTTP）。
 *
 * 前提: spike API 起動済み（既定 http://127.0.0.1:4010）。
 * シード利用者: demo@example.com / midori@example.com
 *
 *   cd spike/scripts && node verify-auth.mjs
 *
 * 終了コード: 失敗があれば 1。
 */
const BASE = (process.env.SPIKE_API_ORIGIN || "http://127.0.0.1:4010").replace(
  /\/$/,
  "",
);

const DEMO = { email: "demo@example.com", password: "demo-pass" };
const OTHER = { email: "midori@example.com", password: "other-pass" };

const results = [];

function check(name, cond, detail = "") {
  results.push({ name, ok: Boolean(cond), detail });
  const mark = cond ? "OK" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function parseSetCookie(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  const single = res.headers.get("set-cookie");
  if (!single) return "";
  return single.split(/,(?=[^;]+?=)/).map((c) => c.split(";")[0].trim()).join("; ");
}

async function login(creds) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(creds),
  });
  const cookie = parseSetCookie(res);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, cookie, body };
}

async function req(path, { method = "GET", cookie = "", body } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function pickPrivateDemoCoord(demoCookie) {
  const list = await req(
    "/api/owner/coordinates?temp=1&status=private&per_page=12",
    { cookie: demoCookie },
  );
  const row = list.json?.data?.[0];
  if (row?.id) return row.id;
  // フォールバック: 本コーデの非公開
  const list2 = await req(
    "/api/owner/coordinates?status=private&per_page=12",
    { cookie: demoCookie },
  );
  return list2.json?.data?.[0]?.id ?? null;
}

async function main() {
  const health = await req("/health");
  if (health.status !== 200) {
    console.error(
      `spike に接続できません (${BASE}/health → ${health.status}). npm run dev を先に起動してください。`,
    );
    process.exit(1);
  }

  // --- 未ログイン ---
  {
    const me = await req("/api/me");
    check("未ログイン GET /api/me → 401", me.status === 401, `got ${me.status}`);

    const owner = await req("/api/owner/coordinates");
    check(
      "未ログイン GET /api/owner/coordinates → 401",
      owner.status === 401,
      `got ${owner.status}`,
    );

    const fav = await req("/api/me/favorites?kind=coordinates");
    check(
      "未ログイン GET /api/me/favorites → 401",
      fav.status === 401,
      `got ${fav.status}`,
    );
  }

  // --- ログイン ---
  const demoLogin = await login(DEMO);
  check("demo ログイン → 200", demoLogin.status === 200, `got ${demoLogin.status}`);
  check("demo Cookie あり", Boolean(demoLogin.cookie), demoLogin.cookie ? "set" : "empty");

  const otherLogin = await login(OTHER);
  check(
    "midori ログイン → 200",
    otherLogin.status === 200,
    `got ${otherLogin.status}`,
  );

  const demo = demoLogin.cookie;
  const midori = otherLogin.cookie;

  // --- admin ---
  {
    const ok = await req("/api/admin/stats", { cookie: demo });
    check(
      "demo(admin) GET /api/admin/stats → 200",
      ok.status === 200,
      `got ${ok.status}`,
    );

    const ng = await req("/api/admin/stats", { cookie: midori });
    check(
      "midori(非admin) GET /api/admin/stats → 403",
      ng.status === 403,
      `got ${ng.status}`,
    );

    const usersNg = await req("/api/admin/users", { cookie: midori });
    check(
      "midori GET /api/admin/users → 403",
      usersNg.status === 403,
      `got ${usersNg.status}`,
    );
  }

  // --- 非公開コンテンツ ---
  const privateId = await pickPrivateDemoCoord(demo);
  check("demo の非公開コーデを取得できる", Boolean(privateId), privateId || "none");

  if (privateId) {
    const pub = await req(`/api/public/coordinates/${privateId}`);
    check(
      "公開 API は非公開コーデ → 404",
      pub.status === 404,
      `${privateId} got ${pub.status}`,
    );

    const ownerOk = await req(`/api/owner/coordinates/${privateId}`, {
      cookie: demo,
    });
    check(
      "所有者は非公開コーデ → 200",
      ownerOk.status === 200,
      `got ${ownerOk.status}`,
    );

    const ownerNg = await req(`/api/owner/coordinates/${privateId}`, {
      cookie: midori,
    });
    check(
      "他人は非公開コーデ owner → 403",
      ownerNg.status === 403,
      `got ${ownerNg.status}`,
    );

    // 公開一覧に混ざらない
    const pages = [];
    for (let page = 1; page <= 3; page++) {
      const res = await req(
        `/api/public/coordinates?page=${page}&per_page=50&user=mckDemo`,
      );
      const ids = (res.json?.data ?? []).map((x) => x.id);
      pages.push(...ids);
      if ((res.json?.meta?.total_pages ?? 1) <= page) break;
    }
    check(
      "公開 user= 一覧に非公開 ID が混ざらない",
      !pages.includes(privateId),
      pages.includes(privateId) ? `found ${privateId}` : `scanned ${pages.length}`,
    );
  }

  // --- 公開一覧に scope=favorite を足しても会員専用扱いにしない（契約: 無視 or 400系でよいが、他人の非公開が漏れないこと） ---
  {
    const leak = await req(
      "/api/public/coordinates?scope=favorite&per_page=12",
      { cookie: demo },
    );
    const ids = (leak.json?.data ?? []).map((x) => x.id);
    const hasPrivate =
      privateId && ids.includes(privateId) ? privateId : null;
    check(
      "public+scope=favorite で非公開が漏れない",
      !hasPrivate && (leak.status === 200 || leak.status === 400),
      `status=${leak.status} leak=${hasPrivate || "no"}`,
    );
  }

  // --- me は本人セッション ---
  {
    const me = await req("/api/me", { cookie: demo });
    check(
      "demo GET /api/me → 200 かつ id=mckDemo",
      me.status === 200 && me.json?.user?.id === "mckDemo",
      `status=${me.status} id=${me.json?.user?.id}`,
    );
  }

  // --- パスワード変更: 現行必須・他セッション無効化 ---
  {
    const a = await login(DEMO);
    const b = await login(DEMO);
    check("同一ユーザーで2セッション取得", Boolean(a.cookie && b.cookie));

    const bad = await req("/api/me/password", {
      method: "POST",
      cookie: a.cookie,
      body: { current_password: "wrong-pass", password: "demo-pass" },
    });
    check(
      "現行パスワード違い → 400 current_password_invalid",
      bad.status === 400 && bad.json?.error === "current_password_invalid",
      `status=${bad.status} err=${bad.json?.error}`,
    );

    const ok = await req("/api/me/password", {
      method: "POST",
      cookie: a.cookie,
      body: { current_password: "demo-pass", password: "demo-pass" },
    });
    check(
      "パスワード変更（同じ値）→ 200",
      ok.status === 200,
      `got ${ok.status}`,
    );

    // Set-Cookie があれば a は新セッション。b の旧 Cookie は無効のはず
    const bAfter = await req("/api/me", { cookie: b.cookie });
    check(
      "パスワード変更後、他セッションは 401",
      bAfter.status === 401,
      `got ${bAfter.status}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    failed.length === 0
      ? `すべて成功 (${results.length})`
      : `失敗 ${failed.length} / ${results.length}`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
