const jpFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** 既存サイト同様に Asia/Tokyo で `YYYY.MM.DD HH:mm` 表示 */
export function formatPostedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const parts = jpFormatter.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

/** 着用日など日付のみ `YYYY.MM.DD` */
export function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const parts = jpFormatter.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}.${get("month")}.${get("day")}`;
}
