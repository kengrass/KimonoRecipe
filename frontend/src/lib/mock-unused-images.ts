import type { ComposePresetImage } from "@/lib/compose-preset";
import { MOCK_COORDINATE_LIST, MOCK_ITEM_LIST } from "@/lib/mock-data";
import { revokeBlobUrl } from "@/lib/blob-url";

/** 縦長・横長サンプル（ローカル静的） */
const ASPECT_SAMPLES: ComposePresetImage[] = [
  {
    id: "sample-portrait-tall",
    src: "/mock/crop/portrait-tall.jpg",
    alt: "サンプル（縦長 720×1280）",
  },
  {
    id: "sample-landscape-wide",
    src: "/mock/crop/landscape-wide.jpg",
    alt: "サンプル（横長 1280×720）",
  },
  {
    id: "sample-portrait-phone",
    src: "/mock/crop/portrait-phone.jpg",
    alt: "サンプル（縦長 540×960）",
  },
  {
    id: "sample-landscape-wide2",
    src: "/mock/crop/landscape-wide2.jpg",
    alt: "サンプル（横長 1600×900）",
  },
];

function buildSeedPool(): ComposePresetImage[] {
  const fromPosts: ComposePresetImage[] = [
    ...MOCK_COORDINATE_LIST.slice(0, 4),
    ...MOCK_ITEM_LIST.slice(0, 5),
  ].map((item, i) => ({
    id: `unused-${i}-${item.id}`,
    src: item.image_url,
    alt: item.title,
  }));
  return [...ASPECT_SAMPLES, ...fromPosts];
}

type Listener = () => void;

/** 整理画面と投稿ピッカーで共有する未使用画像プール（モック） */
let pool: ComposePresetImage[] | null = null;
const listeners = new Set<Listener>();

function ensurePool(): ComposePresetImage[] {
  if (!pool) pool = buildSeedPool();
  return pool;
}

function emit() {
  for (const listener of listeners) listener();
}

export function getMockUnusedImages(): ComposePresetImage[] {
  return [...ensurePool()];
}

export function subscribeMockUnusedImages(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 先頭に追加（アップロード直後など） */
export function prependMockUnusedImages(images: ComposePresetImage[]) {
  if (!images.length) return;
  pool = [...images, ...ensurePool()];
  emit();
}

/** id 指定で削除。blob: は revoke する */
export function deleteMockUnusedImages(ids: string[]) {
  if (!ids.length) return;
  const removing = new Set(ids);
  const next: ComposePresetImage[] = [];
  for (const img of ensurePool()) {
    if (removing.has(img.id)) {
      revokeBlobUrl(img.src);
      continue;
    }
    next.push(img);
  }
  pool = next;
  emit();
}
