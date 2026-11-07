/**
 * ユーザー入力の軽いクライアント側ガード。
 * 本命の拒否は API（spike/sanitize）側。表示用の URL もここで絞る。
 */

const HTML_OR_CODE =
  /[<>]|javascript:|vbscript:|data:\s*text\/html|<\s*script|on\w+\s*=/i;

export const INPUT_LIMITS = {
  name: 80,
  bio: 500,
  title: 120,
  memo: 500,
  tag: 40,
  linkTitle: 80,
  linkUrl: 500,
  snsHandle: 64,
  query: 100,
  email: 254,
  password: 200,
} as const;

export function stripControlChars(raw: string, multiline = false): string {
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

export function hasUnsafeMarkup(raw: string): boolean {
  return HTML_OR_CODE.test(raw);
}

/** 1行テキストを保存前に整形。危険なマークアップは null */
export function sanitizePlainLine(
  raw: string,
  max: number,
): string | null {
  const cleaned = stripControlChars(raw, false).trim().slice(0, max);
  if (hasUnsafeMarkup(cleaned)) return null;
  return cleaned;
}

export function sanitizePlainMultiline(
  raw: string,
  max: number,
): string | null {
  const cleaned = stripControlChars(raw, true)
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
  if (hasUnsafeMarkup(cleaned)) return null;
  return cleaned;
}

/**
 * 外部リンク用。http(s) のみ許可。それ以外は null（描画しない）。
 */
export function safeExternalHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes("\0")) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** サイト内パスのみ（オープンリダイレクト防止） */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("\\") || raw.includes("\0")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  return raw;
}
