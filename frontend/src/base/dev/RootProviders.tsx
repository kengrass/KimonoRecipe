"use client";

import type { ReactNode } from "react";
import { MockAuthProvider } from "@/lib/auth";

/** ルート共通（モック認証のみ）。シェルは (main) レイアウトが持つ */
export function RootProviders({ children }: { children: ReactNode }) {
  return <MockAuthProvider>{children}</MockAuthProvider>;
}
