import { z } from "zod";

/** 表示名・メモなどユーザー入力の上限（UI と揃える） */
export const LIMITS = {
  name: 80,
  bio: 500,
  title: 120,
  memo: 500,
  tag: 40,
  tags: 30,
  query: 100,
  id: 32,
  email: 254,
  password: 200,
  obiKnot: 80,
  category: 80,
  colorTone: 40,
  imageUrls: 20,
} as const;

const HTML_OR_CODE =
  /[<>]|javascript:|vbscript:|data:\s*text\/html|<\s*script|on\w+\s*=/i;

/** NULL・制御文字を除去。multiline は改行のみ残す */
export function stripControls(raw: string, multiline = false): string {
  let out = "";
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 0) continue;
    if (ch === "\n" || ch === "\r") {
      if (multiline) out += ch === "\r" ? "\n" : ch;
      continue;
    }
    if (ch === "\t") {
      out += " ";
      continue;
    }
    if (code < 32 || (code >= 0x7f && code <= 0x9f)) continue;
    out += ch;
  }
  return out;
}

export function hasDangerousMarkup(raw: string): boolean {
  return HTML_OR_CODE.test(raw);
}

/** LIKE 用に % _ \ をエスケープ（ユーザー入力をワイルドカードにしない） */
export function escapeLike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function likeContains(needle: string): string {
  return `%${escapeLike(needle)}%`;
}

function failMarkup(message = "unsafe_content") {
  return { message };
}

/** 1行テキスト：trim・制御除去・危険マークアップ拒否 */
export function plainLine(max: number, opts?: { min?: number }) {
  const min = opts?.min ?? 0;
  return z
    .string()
    .transform((v) => stripControls(v, false).trim())
    .pipe(
      z
        .string()
        .min(min)
        .max(max)
        .refine((v) => !hasDangerousMarkup(v), failMarkup()),
    );
}

/** 複数行テキスト */
export function plainMultiline(max: number) {
  return z
    .string()
    .transform((v) =>
      stripControls(v, true)
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    )
    .pipe(
      z
        .string()
        .max(max)
        .refine((v) => !hasDangerousMarkup(v), failMarkup()),
    );
}

/** 公開 ID（英数・-_） */
export const publicIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.id)
  .regex(/^[A-Za-z0-9_-]+$/, "invalid_id");

const ALLOWED_STATIC_IMAGE_URLS = new Set([
  "/mock/temp-coordinate-placeholder.png",
]);

/** spike 内メディアのみ（相対パス）。`..`・外部スキーム不可 */
export const mediaUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .transform((v) => v.split("?")[0]?.split("#")[0] ?? v)
  .refine((v) => {
    if (ALLOWED_STATIC_IMAGE_URLS.has(v)) return true;
    if (!v.startsWith("/media/")) return false;
    if (v.includes("..") || v.includes("\\") || v.includes("\0")) return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return false;
    return /^\/media\/[A-Za-z0-9/_.-]+$/.test(v);
  }, "invalid_media_url");

export const optionalMediaUrlSchema = z
  .union([mediaUrlSchema, z.null()])
  .optional();

export const tagSchema = plainLine(LIMITS.tag, { min: 1 });

export const tagsSchema = z
  .array(tagSchema)
  .max(LIMITS.tags)
  .transform((tags) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of tags) {
      const key = t.toLocaleLowerCase("ja");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  });

/** 検索クエリ：長さ制限＋制御除去。空は undefined */
export function sanitizeQuery(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const cleaned = stripControls(raw, false).trim().slice(0, LIMITS.query);
  if (!cleaned || hasDangerousMarkup(cleaned)) return undefined;
  return cleaned;
}

export const emailSchema = z
  .string()
  .trim()
  .max(LIMITS.email)
  .email()
  .transform((v) => v.toLowerCase());
