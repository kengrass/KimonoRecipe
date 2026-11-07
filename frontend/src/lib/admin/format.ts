import type { AdminUserStatus } from "./types";

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

export function formatDate(iso: string): string {
  return formatDateTime(iso).slice(0, 10);
}

/** 「◯日前」（当日は 0日前） */
export function daysAgoLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const ms = now.getTime() - d.getTime();
  const days = Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
  return `${days}日前`;
}

export function formatDateTimeWithAgo(iso: string, now = new Date()): string {
  return `${formatDateTime(iso)}（${daysAgoLabel(iso, now)}）`;
}

export function formatPercent(ratio: number | null | undefined): string {
  if (typeof ratio !== "number" || !Number.isFinite(ratio)) return "—";
  return `${Math.round(ratio * 100)}%`;
}

/** yyyy-mm-dd → yyyy/mm/dd（空はそのまま） */
export function formatYmdSlash(ymd: string): string {
  return ymd.replaceAll("-", "/");
}

export function statusLabel(status: AdminUserStatus): string {
  switch (status) {
    case "active":
      return "有効";
    case "suspended":
      return "停止";
    case "withdrawn":
      return "退会";
    default:
      return status;
  }
}
