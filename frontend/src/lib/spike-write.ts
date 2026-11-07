/**
 * spike API への書き込みクライアント（ブラウザ・同オリジン rewrite 前提）。
 * USE_SPIKE_API のときだけ使う。読み取りは `api.ts`。
 * 投稿・画像・紐付け・設定・仮コーデなど。手続きの正は spike/docs/API.md。
 */

import type { PublicListItem } from "@/lib/types";
import { preferSquareMediaUrl } from "@/lib/spike-media";

export type SpikeUploadedImage = {
  id: string;
  url: string;
  master_url: string;
  square_url: string;
};

async function spikeFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    credentials: "include",
    ...init,
  });
}

function asImageFile(blob: Blob, fileName: string) {
  const type =
    blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  return new File([blob], fileName, { type });
}

export type SpikeUploadOptions = {
  /** true のとき未使用プールへ入れる（整理画面アップロード用） */
  unused?: boolean;
};

export async function spikeUploadImage(
  blob: Blob,
  fileName = "crop.jpg",
  opts: SpikeUploadOptions = {},
) {
  const form = new FormData();
  form.append("file", asImageFile(blob, fileName));
  if (opts.unused) form.append("unused", "1");
  const res = await spikeFetch("/api/owner/images", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`upload_failed:${res.status}`);
  }
  return (await res.json()) as SpikeUploadedImage;
}

/** 原寸→マスター、任意でクライアント焼き込み正方形を同梱 */
export async function spikeUploadImagePair(
  masterBlob: Blob,
  squareBlob: Blob,
  fileName = "master.jpg",
  opts: SpikeUploadOptions = {},
) {
  const form = new FormData();
  form.append("file", asImageFile(masterBlob, fileName));
  form.append("square", asImageFile(squareBlob, "square.jpg"));
  if (opts.unused) form.append("unused", "1");
  const res = await spikeFetch("/api/owner/images", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`upload_failed:${res.status}`);
  }
  return (await res.json()) as SpikeUploadedImage;
}

/** 投稿から外した画像を未使用プールへ */
export async function spikeParkUnusedImage(id: string) {
  const res = await spikeFetch(`/api/owner/images/${id}/park`, {
    method: "POST",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`image_park_failed:${res.status}`);
  return (await res.json()) as SpikeUploadedImage;
}

/** マスター維持のまま表示用正方形だけ差し替え */
export async function spikeReplaceSquare(imageId: string, squareBlob: Blob) {
  const form = new FormData();
  form.append("file", asImageFile(squareBlob, "square.jpg"));
  const res = await spikeFetch(`/api/owner/images/${imageId}/square`, {
    method: "PUT",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`square_replace_failed:${res.status}`);
  }
  return (await res.json()) as SpikeUploadedImage;
}

/** マスターから初期正方形を再生成（トリミング・リセット） */
export async function spikeResetSquareFromMaster(imageId: string) {
  const res = await spikeFetch(`/api/owner/images/${imageId}/square/reset`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`square_reset_failed:${res.status}`);
  }
  return (await res.json()) as SpikeUploadedImage;
}

export async function spikeListUnusedImages() {
  const res = await spikeFetch("/api/owner/images");
  if (!res.ok) throw new Error(`images_list_failed:${res.status}`);
  const json = (await res.json()) as {
    data: Array<{
      id: string;
      url: string;
      square_url?: string;
      master_url?: string;
    }>;
  };
  return json.data.map((row) => ({
    id: row.id,
    src: row.url || row.square_url || "",
    alt: "未使用画像",
    masterSrc: row.master_url,
  }));
}

export async function spikeDeleteUnusedImage(id: string): Promise<"ok" | "in_use"> {
  const res = await spikeFetch(`/api/owner/images/${id}`, { method: "DELETE" });
  if (res.status === 204 || res.ok) return "ok";
  if (res.status === 409) return "in_use";
  throw new Error(`image_delete_failed:${res.status}`);
}

export async function spikeCheckFavorite(kind: "coordinates" | "items", id: string) {
  const res = await spikeFetch(
    `/api/me/favorites/check?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`,
  );
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`favorite_check_failed:${res.status}`);
  return (await res.json()) as { liked: boolean; like_count: number };
}

export async function spikeToggleFavorite(kind: "coordinates" | "items", id: string) {
  const res = await spikeFetch("/api/me/favorites/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id }),
  });
  if (!res.ok) throw new Error(`favorite_toggle_failed:${res.status}`);
  return (await res.json()) as { liked: boolean; like_count: number };
}

export async function spikeCheckFollow(userId: string) {
  const res = await spikeFetch(
    `/api/me/following/check?user_id=${encodeURIComponent(userId)}`,
  );
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`follow_check_failed:${res.status}`);
  return (await res.json()) as { following: boolean };
}

export async function spikeToggleFollow(userId: string) {
  const res = await spikeFetch("/api/me/following/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error(`follow_toggle_failed:${res.status}`);
  return (await res.json()) as { following: boolean };
}

export type SpikeCreateItemBody = {
  title?: string;
  description?: string;
  category: string;
  gender: "women" | "men" | "kids";
  visibility: "public" | "private";
  color_tone?: string | null;
  tags?: string[];
  image_urls: string[];
  private_note?: string;
  favorite_rank?: number | null;
  declutter_candidate?: boolean;
};

export async function spikeCreateItem(body: SpikeCreateItemBody) {
  const res = await spikeFetch("/api/owner/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`item_create_failed:${res.status}`);
  return (await res.json()) as { id: string };
}

export async function spikeUpdateItem(
  id: string,
  body: Partial<SpikeCreateItemBody>,
) {
  const res = await spikeFetch(`/api/owner/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`item_update_failed:${res.status}`);
  return (await res.json()) as { id: string };
}

export async function spikeDeleteItem(id: string) {
  const res = await spikeFetch(`/api/owner/items/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`item_delete_failed:${res.status}`);
  }
}

export type SpikeCreateCoordinateBody = {
  title?: string;
  description?: string;
  gender: "women" | "men" | "kids";
  visibility: "public" | "private";
  obi_knot?: string;
  tags?: string[];
  image_urls?: string[];
  private_note?: string;
  is_temp?: boolean;
  worn_on?: string | null;
  item_ids?: string[];
};

export async function spikeCreateCoordinate(body: SpikeCreateCoordinateBody) {
  const res = await spikeFetch("/api/owner/coordinates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`coord_create_failed:${res.status}`);
  return (await res.json()) as {
    id: string;
    title?: string;
    image_url?: string;
    images?: string[];
    detail_url?: string;
    gender?: string;
    tags?: string[];
    seasons?: string[];
    posted_at?: string;
    like_count?: number;
    obi_knot?: string;
    user?: PublicListItem["user"];
    is_temp?: boolean;
  };
}

/** 本人の仮コーデ一覧（temp=1）。未ログインは null */
export async function spikeListTempCoordinates(
  perPage = 50,
  opts: { sort?: string } = {},
): Promise<{
  items: PublicListItem[];
  total: number;
} | null> {
  const sp = new URLSearchParams({
    temp: "1",
    per_page: String(perPage),
    include_facets: "1",
  });
  if (opts.sort && opts.sort !== "newest") sp.set("sort", opts.sort);
  const res = await spikeFetch(`/api/owner/coordinates?${sp.toString()}`);
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`temp_list_failed:${res.status}`);
  const json = (await res.json()) as {
    data: PublicListItem[];
    meta: { total: number };
  };
  return { items: json.data, total: json.meta.total };
}

export async function spikeUpdateCoordinate(
  id: string,
  body: Partial<SpikeCreateCoordinateBody>,
) {
  const res = await spikeFetch(`/api/owner/coordinates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`coord_update_failed:${res.status}`);
  return (await res.json()) as { id: string; image_url?: string; images?: string[] };
}

export async function spikeDeleteCoordinate(id: string) {
  const res = await spikeFetch(`/api/owner/coordinates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`coord_delete_failed:${res.status}`);
  }
}

export async function spikePutCoordinateItems(id: string, itemIds: string[]) {
  const res = await spikeFetch(`/api/owner/coordinates/${id}/items`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_ids: itemIds }),
  });
  if (!res.ok) throw new Error(`coord_attach_failed:${res.status}`);
  return (await res.json()) as {
    id: string;
    image_url?: string;
    images?: string[];
    items?: Array<{
      id: string;
      title: string;
      category: string;
      image_url: string;
      detail_url: string;
    }>;
    is_temp?: boolean;
  };
}

/**
 * アイテム詳細からの紐付け確定。
 * 正は各コーデの PUT .../items（アイテム側専用口は置かない）。
 */
export async function spikeSyncItemAttachedCoordinates(
  itemId: string,
  previousCoordinateIds: string[],
  nextCoordinateIds: string[],
) {
  const prev = new Set(previousCoordinateIds);
  const next = new Set(nextCoordinateIds);
  const added = nextCoordinateIds.filter((id) => !prev.has(id));
  const removed = previousCoordinateIds.filter((id) => !next.has(id));

  for (const coordId of [...added, ...removed]) {
    const res = await spikeFetch(`/api/owner/coordinates/${coordId}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`coord_load_failed:${res.status}`);
    const detail = (await res.json()) as {
      items?: Array<{ id: string }>;
    };
    const current = (detail.items ?? []).map((i) => i.id);
    const itemIds = added.includes(coordId)
      ? current.includes(itemId)
        ? current
        : [...current, itemId]
      : current.filter((id) => id !== itemId);
    await spikePutCoordinateItems(coordId, itemIds);
  }
}

export type SpikeMeUser = {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string | null;
  profile_url?: string;
  mail_opt_in?: boolean;
  links?: Array<{ title: string; url: string }>;
  sns?: Record<string, string>;
  public_size?: Array<{ label: string; value: string }>;
};

export async function spikeGetMe(): Promise<SpikeMeUser | null> {
  const res = await spikeFetch("/api/me", { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { user?: SpikeMeUser };
  return json.user ?? null;
}

export async function spikePatchMe(body: {
  name?: string;
  bio?: string;
  avatar_url?: string | null;
  mail_opt_in?: boolean;
  links?: Array<{ title: string; url: string }>;
  sns?: Record<string, string>;
  public_size?: Array<{ label: string; value: string }>;
}) {
  const res = await spikeFetch("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (json?.error) throw new Error(json.error);
    throw new Error(`me_patch_failed:${res.status}`);
  }
  return res.json();
}

export async function spikeRequestEmailChange(email: string) {
  const res = await spikeFetch("/api/me/email/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = (await res.json().catch(() => null)) as {
    error?: string;
    sent?: boolean;
    email?: string;
    dev_code?: string;
  } | null;
  if (!res.ok) throw new Error(json?.error ?? `email_request_failed:${res.status}`);
  return json!;
}

export async function spikeConfirmEmailChange(email: string, code: string) {
  const res = await spikeFetch("/api/me/email/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const json = (await res.json().catch(() => null)) as {
    error?: string;
    user?: SpikeMeUser;
  } | null;
  if (!res.ok) throw new Error(json?.error ?? `email_confirm_failed:${res.status}`);
  return json!;
}

export async function spikeChangePassword(password: string) {
  const res = await spikeFetch("/api/me/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? `password_failed:${res.status}`);
  }
}

/** 退会（本人削除）。成功後はセッションなし */
export async function spikeWithdrawMe() {
  const res = await spikeFetch("/api/me", { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`withdraw_failed:${res.status}`);
  }
}

/** blob:/data: を File 化してアップロードし、サーバ URL にする */
export async function spikeEnsureUploadedUrl(src: string): Promise<string> {
  // 表示用キャッシュバスト (?v=) は保存しない。master 参照は square に寄せる
  const bare = preferSquareMediaUrl(src).split("?")[0] ?? src;
  if (bare.startsWith("/media/") || bare.startsWith("http")) return bare;
  const res = await fetch(src);
  if (!res.ok) throw new Error("blob_fetch_failed");
  const blob = await res.blob();
  const uploaded = await spikeUploadImage(
    blob,
    src.startsWith("blob:") ? "crop.jpg" : "image.jpg",
  );
  return uploaded.url;
}

export async function spikeEnsureUploadedUrls(srcs: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const src of srcs) {
    out.push(await spikeEnsureUploadedUrl(src));
  }
  return out;
}
