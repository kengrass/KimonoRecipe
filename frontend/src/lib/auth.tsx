"use client";

/**
 * サイト認証コンテキスト。モック Cookie または spike セッションを hydrate。
 * UsageBeacon 等は `ready` 後に計測する。本番は同じ口を正式セッションへ。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { USE_SPIKE_API } from "./config";
import {
  MOCK_AUTH_COOKIE,
  parseMockAuthMode,
  userForMockAuthMode,
  writeMockAuthCookie,
} from "./mock-session";
import {
  getSpikeAuthUserCached,
  refreshSpikeAuthUser,
  setSpikeAuthUser,
  subscribeSpikeAuth,
  type SpikeAuthUser,
} from "./spike-auth";
import type { MockAuthMode, PublicUser } from "./types";

const STORAGE_KEY = "kr-mock-auth-mode";

type AuthContextValue = {
  /** モックログイン状態（guest / member / owner） */
  authMode: MockAuthMode;
  setAuthMode: (mode: MockAuthMode) => void;
  isLoggedIn: boolean;
  /** localStorage と同期済み（常に true。互換のため残す） */
  ready: boolean;
  /** ログイン中の自分。guest は null */
  currentUser: PublicUser | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthMode(): MockAuthMode {
  if (typeof window === "undefined") return "guest";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return parseMockAuthMode(saved);
  } catch {
    return "guest";
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("kr-mock-auth", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("kr-mock-auth", onStoreChange);
  };
}

function persistAuthMode(next: MockAuthMode) {
  window.localStorage.setItem(STORAGE_KEY, next);
  writeMockAuthCookie(next);
  window.dispatchEvent(new Event("kr-mock-auth"));
}

function MockAuthProviderInner({ children }: { children: ReactNode }) {
  const authMode = useSyncExternalStore<MockAuthMode>(
    subscribe,
    readAuthMode,
    () => "guest",
  );

  useEffect(() => {
    writeMockAuthCookie(authMode);
  }, [authMode]);

  const setAuthMode = useCallback((next: MockAuthMode) => {
    persistAuthMode(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authMode,
      setAuthMode,
      isLoggedIn: authMode !== "guest",
      ready: true,
      currentUser: userForMockAuthMode(authMode),
      logout: () => setAuthMode("guest"),
    }),
    [authMode, setAuthMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function SpikeAuthProviderInner({ children }: { children: ReactNode }) {
  // SSR / 初回クライアントは必ず null（hydration 差分を避ける）
  const [user, setUser] = useState<SpikeAuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return subscribeSpikeAuth(() => {
      setUser(getSpikeAuthUserCached() ?? null);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    void refreshSpikeAuthUser().finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authMode: user ? "owner" : "guest",
      setAuthMode: () => {
        /* spike ではモック切替なし */
      },
      isLoggedIn: Boolean(user),
      ready,
      currentUser: user,
      logout: () => {
        void (async () => {
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
            });
          } finally {
            setSpikeAuthUser(null);
          }
        })();
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  if (USE_SPIKE_API) {
    return <SpikeAuthProviderInner>{children}</SpikeAuthProviderInner>;
  }
  return <MockAuthProviderInner>{children}</MockAuthProviderInner>;
}

export function useMockAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useMockAuth must be used within MockAuthProvider");
  }
  return ctx;
}

export { MOCK_AUTH_COOKIE };
