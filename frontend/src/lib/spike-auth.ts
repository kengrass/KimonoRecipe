/**
 * spike 接続時のクライアント側ログイン状態。
 * Header / SiteMenu / SpikeAuthBar が共有する。
 */
import type { PublicUser } from "@/lib/types";

export type SpikeAuthUser = PublicUser & { email?: string };

const EVENT = "kr-spike-auth";
let cached: SpikeAuthUser | null | undefined;

export function getSpikeAuthUserCached(): SpikeAuthUser | null | undefined {
  return cached;
}

export function setSpikeAuthUser(user: SpikeAuthUser | null) {
  cached = user;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeSpikeAuth(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** `/api/me` でセッションを確認してキャッシュ更新 */
export async function refreshSpikeAuthUser(): Promise<SpikeAuthUser | null> {
  try {
    const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      setSpikeAuthUser(null);
      return null;
    }
    const json = (await res.json()) as {
      user?: {
        id: string;
        name: string;
        profile_url?: string;
        email?: string;
        avatar_url?: string | null;
      };
    };
    if (!json.user?.id) {
      setSpikeAuthUser(null);
      return null;
    }
    const next: SpikeAuthUser = {
      id: json.user.id,
      name: json.user.name,
      profile_url: json.user.profile_url ?? `/m/${json.user.id}`,
      email: json.user.email,
      avatar_url: json.user.avatar_url ?? null,
    };
    setSpikeAuthUser(next);
    return next;
  } catch {
    setSpikeAuthUser(null);
    return null;
  }
}
