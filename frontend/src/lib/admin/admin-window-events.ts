/**
 * 管理ストア ↔ 画面の同期。
 * React state の外（保存・他コンポーネント・実績加算）から「一覧を読み直せ」と伝えるだけ。
 * ライブラリ無しの window Event。イベント名は各 store が定数で持つ。
 *
 * @see ./README.md
 */

export function dispatchAdminEvent(name: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(name));
}

export function subscribeAdminEvent(
  name: string,
  onChange: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}

/** 複数イベントを同じ同期関数に繋ぐ（広告の CHANGE + STATS など） */
export function subscribeAdminEvents(
  names: string[],
  onChange: () => void,
): () => void {
  const offs = names.map((name) => subscribeAdminEvent(name, onChange));
  return () => {
    for (const off of offs) off();
  };
}
