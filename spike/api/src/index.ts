import { serve } from "@hono/node-server";
import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "./db/client.js";
import "./db/seed.js";
import {
  canReadMedia,
  isMediaPubliclyReadable,
  normalizeMediaPath,
} from "./lib/media-access.js";
import { SESSION_COOKIE, userFromToken } from "./lib/session.js";
import { authRoutes } from "./routes/auth.js";
import {
  ownerCoordinateRoutes,
  publicCoordinateRoutes,
} from "./routes/coordinates.js";
import { ownerImageRoutes } from "./routes/images.js";
import { ownerItemRoutes, publicItemRoutes } from "./routes/items.js";
import { adminRoutes } from "./routes/admin.js";
import { adminAdRoutes, publicAdRoutes } from "./routes/ads.js";
import { meRoutes, publicUserRoutes } from "./routes/profile.js";
import {
  publicCoordinateListRoutes,
  publicItemListRoutes,
} from "./routes/public-lists.js";
import { usageRoutes } from "./routes/usage.js";

migrate();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, "../data/uploads");

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
    credentials: true,
  }),
);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "internal" }, 500);
});

app.get("/health", (c) =>
  c.json({ ok: true, spike: true, store: "sqlite" }),
);

app.route("/api/auth", authRoutes);
app.route("/api/me", meRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/admin", adminAdRoutes);
app.route("/api/public/ads", publicAdRoutes);

app.route("/api/owner/images", ownerImageRoutes);
app.route("/api/owner/items", ownerItemRoutes);
app.route("/api/owner/coordinates", ownerCoordinateRoutes);

app.route("/api/public/users", publicUserRoutes);
app.route("/api/public/items", publicItemListRoutes);
app.route("/api/public/items", publicItemRoutes);
app.route("/api/public/coordinates", publicCoordinateListRoutes);
app.route("/api/public/coordinates", publicCoordinateRoutes);
app.route("/api/public/usage", usageRoutes);

/**
 * 画像配信。
 * 公開参照あり → 誰でも。非公開／仮／未使用のみ → 所有者セッション必須。
 * 存在有無を漏らさないよう拒否は 404。
 */
app.get("/media/*", async (c) => {
  const mediaPath = normalizeMediaPath(c.req.path);
  const rel = mediaPath.replace(/^\/media\//, "");
  const abs = path.normalize(path.join(uploadsRoot, rel));
  if (!abs.startsWith(uploadsRoot + path.sep) && abs !== uploadsRoot) {
    return c.body(null, 404);
  }

  const token = getCookie(c, SESSION_COOKIE);
  const viewer = userFromToken(token);
  if (!canReadMedia(mediaPath, viewer?.id ?? null)) {
    return c.body(null, 404);
  }

  try {
    let data: Buffer;
    try {
      data = await fs.readFile(abs);
    } catch {
      // 旧 square-タイムスタンプ.jpg 参照 → 安定 square.jpg へフォールバック
      const base = path.basename(abs);
      if (/^square-\d+\.jpe?g$/i.test(base)) {
        data = await fs.readFile(path.join(path.dirname(abs), "square.jpg"));
      } else {
        throw new Error("missing");
      }
    }
    const ext = path.extname(abs).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    // 正方形は差し替えがあるので長くキャッシュしない（stamp URL でも安全側）
    const baseName = path.basename(abs).toLowerCase();
    const mutableSquare =
      baseName === "square.jpg" || /^square-\d+\.jpe?g$/i.test(baseName);
    const cacheControl = mutableSquare
      ? "public, max-age=60, must-revalidate"
      : isMediaPubliclyReadable(mediaPath)
        ? "public, max-age=3600"
        : "private, no-store";
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": cacheControl,
      },
    });
  } catch {
    return c.body(null, 404);
  }
});

const port = Number(process.env.PORT ?? 4010);

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`spike api http://127.0.0.1:${info.port}`);
  console.log(`demo login: demo@example.com / demo-pass`);
});
