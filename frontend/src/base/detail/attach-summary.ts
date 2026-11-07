"use client";

/** 紐付け確定後の要約（モック反映用） */
export type AttachSummary = {
  added: number;
  removed: number;
};

export function buildAttachSummary(
  added: number,
  removed: number,
): AttachSummary | null {
  if (added <= 0 && removed <= 0) return null;
  return { added, removed };
}
