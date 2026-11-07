/**
 * PV 動線の回帰確認（Playwright + spike SQLite）。
 *
 * 前提: spike API + Next が起動済み（既定 127.0.0.1:3000）。
 * 他タブが同じ spike DB に PV を書き込むと汚染するので、検証中はローカルタブを閉じる／about:blank にする。
 *
 *   cd spike/scripts && npm i && node verify-pv.mjs
 *
 * 要: Chrome、sqlite3 CLI、このディレクトリの playwright-core。
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const BASE = process.env.PV_VERIFY_BASE || "http://127.0.0.1:3000";
const DB =
  process.env.PV_VERIFY_DB ||
  path.join(ROOT, "spike/api/data/spike.db");

const require = createRequire(path.join(__dirname, "package.json"));
let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch {
  console.error("playwright-core がありません。cd spike/scripts && npm i");
  process.exit(1);
}

function sql(q) {
  return execFileSync("sqlite3", [DB, q], { encoding: "utf8" }).trim();
}

function reset() {
  sql("DELETE FROM usage_page_views;");
  sql("PRAGMA wal_checkpoint(TRUNCATE);");
}

function rows() {
  const raw = sql(
    "SELECT viewed_at||'|'||path||'|'||viewer_kind FROM usage_page_views ORDER BY viewed_at;",
  );
  if (!raw) return [];
  return raw.split("\n").filter(Boolean);
}

function count() {
  return Number(sql("SELECT COUNT(*) FROM usage_page_views;"));
}

function paths() {
  return sql(
    "SELECT path||':'||COUNT(*) FROM usage_page_views GROUP BY path ORDER BY path;",
  )
    .split("\n")
    .filter(Boolean);
}

async function waitPv(ms = 700) {
  await new Promise((r) => setTimeout(r, ms));
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').last().fill("demo@example.com");
  await page.locator('input[type="password"]').last().fill("demo-pass");
  await Promise.all([
    page
      .waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 })
      .catch(() => {}),
    page.getByRole("button", { name: "ログイン" }).last().click(),
  ]);
  await waitPv(1200);
}

const results = [];

function check(name, cond, detail) {
  results.push({ name, ok: Boolean(cond), detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page);

    reset();
    await page.evaluate(() => sessionStorage.removeItem("kr-pv-commit-key"));
    await waitPv(300);

    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await waitPv();
    check(
      "1. 初回トップ = PV1",
      count() === 1 && paths().join() === "/:1",
      `total=${count()} paths=${paths().join(" ")} rows=${rows().join(" ; ")}`,
    );

    const before2 = count();
    await page.goto(`${BASE}/settings/profile`, { waitUntil: "networkidle" });
    await waitPv();
    check(
      "2. 設定へ +1",
      count() === before2 + 1 && paths().includes("/settings/profile:1"),
      `total=${count()} Δ=${count() - before2} paths=${paths().join(" ")}`,
    );

    const before3 = count();
    const accountTab = page.getByRole("tab", { name: "アカウント" });
    if (await accountTab.count()) {
      await accountTab.click();
      await waitPv(900);
      check(
        "3. 設定タブ切替（クエリのみ）で増えない",
        count() === before3,
        `total=${count()} Δ=${count() - before3} url=${page.url()}`,
      );
    } else {
      check("3. 設定タブ切替（クエリのみ）で増えない", false, "アカウント tab なし");
    }

    const before4 = count();
    await page.goto(`${BASE}/m/u2DGNh`, { waitUntil: "networkidle" });
    await waitPv(900);
    const my = paths().find((p) => p.startsWith("/m/u2DGNh:"));
    check(
      "4. マイページ +1（二重なし）",
      count() === before4 + 1 && my === "/m/u2DGNh:1",
      `total=${count()} Δ=${count() - before4} my=${my} all=${paths().join(" ")}`,
    );

    const before5 = count();
    await page.reload({ waitUntil: "networkidle" });
    await waitPv(900);
    check(
      "5. フルリロードで +1",
      count() === before5 + 1,
      `total=${count()} Δ=${count() - before5}`,
    );

    const before6 = count();
    await page.evaluate(() => window.scrollTo(0, 500));
    await waitPv(1200);
    check(
      "6. 同一画面の待機・スクロールで増えない",
      count() === before6,
      `total=${count()} Δ=${count() - before6}`,
    );

    const before7 = count();
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await waitPv(900);
    check(
      "7. /admin は数えない",
      count() === before7,
      `total=${count()} Δ=${count() - before7}`,
    );

    const before8 = count();
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await waitPv(900);
    check(
      "8. トップ再訪 +1",
      count() === before8 + 1,
      `total=${count()} Δ=${count() - before8}`,
    );

    const before9 = count();
    await page.goto(`${BASE}/c/BFetNyi`, { waitUntil: "networkidle" });
    await waitPv(900);
    check(
      "9. コーデ詳細 +1",
      count() === before9 + 1,
      `total=${count()} Δ=${count() - before9}`,
    );

    reset();
    await page.evaluate(() => sessionStorage.removeItem("kr-pv-commit-key"));
    await waitPv(200);
    await page.goto(`${BASE}/settings/profile`, { waitUntil: "networkidle" });
    await waitPv(900);
    const softBefore = count();
    await page.goto(`${BASE}/m/u2DGNh`, { waitUntil: "networkidle" });
    await waitPv(1000);
    const softAfter = count();
    const softPaths = paths();
    check(
      "10. 設定→マイページ 各1・合計2",
      softBefore === 1 &&
        softAfter === 2 &&
        softPaths.includes("/settings/profile:1") &&
        softPaths.includes("/m/u2DGNh:1"),
      `before=${softBefore} after=${softAfter} paths=${softPaths.join(" ")} rows=${rows().join(" ; ")}`,
    );

    reset();
    await page.evaluate(() => sessionStorage.removeItem("kr-pv-commit-key"));
    await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
    await waitPv(900);
    const s1 = count();
    check(
      "11. 検索トップ = 1",
      s1 === 1,
      `search_alone=${s1} paths=${paths().join(" ")}`,
    );

    console.log("\n=== SUMMARY ===");
    const failed = results.filter((r) => !r.ok);
    console.log(`passed ${results.length - failed.length}/${results.length}`);
    if (failed.length) {
      for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
