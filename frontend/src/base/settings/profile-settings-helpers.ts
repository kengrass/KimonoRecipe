export type SnsKey =
  | "twitter"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "facebook";

export const SNS_FIELDS: {
  key: SnsKey;
  label: string;
  prefix: string;
  placeholder: string;
}[] = [
  {
    key: "twitter",
    label: "X",
    prefix: "x.com/",
    placeholder: "username",
  },
  {
    key: "instagram",
    label: "Instagram",
    prefix: "instagram.com/",
    placeholder: "username",
  },
  {
    key: "tiktok",
    label: "TikTok",
    prefix: "tiktok.com/@",
    placeholder: "username",
  },
  {
    key: "youtube",
    label: "YouTube",
    prefix: "youtube.com/@",
    placeholder: "channel",
  },
  {
    key: "facebook",
    label: "Facebook",
    prefix: "facebook.com/",
    placeholder: "username",
  },
];

/** URL／フルパスから表示用ハンドルだけ残す */
export function snsHandleFromStored(raw: string, prefix: string): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    const withProto = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProto);
    const path = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    if (prefix.includes("@")) {
      return path.replace(/^@/, "");
    }
    return path.split("/")[0] ?? "";
  } catch {
    return value
      .replace(/^https?:\/\//i, "")
      .replace(
        new RegExp(
          `^(www\\.)?${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "i",
        ),
        "",
      )
      .replace(/^@/, "")
      .split("/")[0]
      .trim();
  }
}

export function snsUrlFromHandle(handle: string, prefix: string): string {
  const cleaned = handle
    .trim()
    .replace(/^@/, "")
    .replace(/^\/+/, "")
    // ハンドルは英数・._- のみ（スキームやパス混入を防ぐ）
    .replace(/[^A-Za-z0-9._-]/g, "")
    .slice(0, 64);
  if (!cleaned) return "";
  return `https://www.${prefix}${cleaned}`;
}
