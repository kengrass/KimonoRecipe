import { normalizeCropState } from "@/base/compose/compose-crop-math";
import type { ComposeCropState } from "@/lib/compose-preset";

const PREFIX = "kr-crop-vp:";

function storageKey(imageId: string) {
  return `${PREFIX}${imageId}`;
}

/** 同一タブで画像 id → 直近確定枠（sessionStorage なので HMR でも残る） */
export function rememberCropViewport(
  imageId: string,
  crop: ComposeCropState | null | undefined,
) {
  const normalized = normalizeCropState(crop);
  if (!imageId || !normalized) return;
  try {
    sessionStorage.setItem(storageKey(imageId), JSON.stringify(normalized));
  } catch {
    /* private mode 等 */
  }
}

export function recallCropViewport(
  imageId: string,
  fallback?: ComposeCropState | null,
): ComposeCropState | null {
  const fromFallback = normalizeCropState(fallback);
  if (fromFallback) return fromFallback;
  if (!imageId || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(imageId));
    if (!raw) return null;
    return normalizeCropState(JSON.parse(raw) as ComposeCropState);
  } catch {
    return null;
  }
}

export function forgetCropViewport(imageId: string) {
  if (!imageId || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(imageId));
  } catch {
    /* ignore */
  }
}

/** 関連しそうな id すべてに同じ枠を書く */
export function rememberCropViewportKeys(
  keys: Array<string | null | undefined>,
  crop: ComposeCropState | null | undefined,
) {
  const seen = new Set<string>();
  for (const key of keys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    rememberCropViewport(key, crop);
  }
}

export function recallCropViewportKeys(
  keys: Array<string | null | undefined>,
  fallback?: ComposeCropState | null,
): ComposeCropState | null {
  const fromFallback = normalizeCropState(fallback);
  if (fromFallback) return fromFallback;
  for (const key of keys) {
    if (!key) continue;
    const hit = recallCropViewport(key);
    if (hit) return hit;
  }
  return null;
}
