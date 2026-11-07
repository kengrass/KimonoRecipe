/**
 * 確定時のトリミング枠（再オープン時に復元）。
 * offset は当時の stage 一辺に対する比率。
 */
export type ComposeCropState = {
  zoom: number;
  offsetXRatio: number;
  offsetYRatio: number;
  rotation: number;
  flipHorizontal: boolean;
};

/**
 * 未使用画像 → 投稿画面へのプリセット受け渡し（モック・sessionStorage）。
 */
export type ComposePresetImage = {
  id: string;
  /** 表示用（正方形など） */
  src: string;
  alt: string;
  /**
   * 再クロップ／リセット用マスター。
   * spike では `/media/.../master.jpg`。無いときは src から推測することもある。
   */
  masterSrc?: string;
  /** 直近確定の枠。再トリミング開始位置 */
  crop?: ComposeCropState;
};

const KEY = "kr-compose-preset-images";

export function setComposePreset(images: ComposePresetImage[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(images));
}

/** 読み出してクリア（1回限り） */
export function takeComposePreset(): ComposePresetImage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ComposePresetImage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    sessionStorage.removeItem(KEY);
    return [];
  }
}
