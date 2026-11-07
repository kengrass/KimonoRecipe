"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMockAuth } from "@/lib/auth";
import { trackPageView } from "@/lib/usage-tracking";

/**
 * メインサイトの PV／UU 計測。
 * pathname が変わったときだけ trackPageView に渡す（定義・重複抑止は usage-tracking 側）。
 */
export function UsageBeacon() {
  const pathname = usePathname();
  const { currentUser, ready } = useMockAuth();

  useEffect(() => {
    if (!ready) return;
    if (!pathname || pathname.startsWith("/admin")) return;
    trackPageView({ path: pathname, memberId: currentUser?.id ?? null });
    // 認証 id の後追いでは打ち直さない（ready 後の pathname 変化のみ）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate 二重防止
  }, [pathname, ready]);

  return null;
}
