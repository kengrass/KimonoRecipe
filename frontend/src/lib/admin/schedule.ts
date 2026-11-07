/** yyyy-mm-dd の掲載期間判定（広告・協賛で共用） */

export function todayYmd(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWithinScheduleYmd(
  startOn: string,
  endOn: string,
  today = todayYmd(),
): boolean {
  if (startOn && startOn > today) return false;
  if (endOn && endOn < today) return false;
  return true;
}
