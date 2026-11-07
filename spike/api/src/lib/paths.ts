import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.resolve(__dirname, "../../data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** パス部品として許す ID（トラバーサル防止） */
const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,80}$/;

export function assertSafePathSegment(segment: string): string {
  if (!SAFE_SEGMENT.test(segment)) {
    throw new Error(`invalid_path_segment:${segment}`);
  }
  return segment;
}

/** 公開URL用（API オリジン相対） */
export function mediaUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  return `/media/${clean}`;
}

export function absoluteUploadPath(...parts: string[]): string {
  const safeParts = parts.map((p) => {
    // 拡張子付きファイル名（master.jpg 等）は末尾のみ許容
    if (p.includes("/") || p.includes("\\") || p.includes("..")) {
      throw new Error(`invalid_path_segment:${p}`);
    }
    const base = p.includes(".") ? p.slice(0, p.indexOf(".")) : p;
    const ext = p.includes(".") ? p.slice(p.indexOf(".")) : "";
    if (ext && !/^\.[A-Za-z0-9]+$/.test(ext)) {
      throw new Error(`invalid_path_segment:${p}`);
    }
    if (base) assertSafePathSegment(base);
    return p;
  });
  const resolved = path.resolve(UPLOAD_DIR, ...safeParts);
  const root = path.resolve(UPLOAD_DIR) + path.sep;
  if (resolved !== path.resolve(UPLOAD_DIR) && !resolved.startsWith(root)) {
    throw new Error("path_escape");
  }
  return resolved;
}
