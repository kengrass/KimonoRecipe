"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Next のクライアント遷移は hash までスクロールしないことが多い。
 * マウント／pathname 更新後に #id へ合わせる。
 */
export function ScrollToHash() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    let cancelled = false;
    const scroll = () => {
      if (cancelled) return;
      const el = document.getElementById(hash);
      if (!el) return;
      el.scrollIntoView({ behavior: "auto", block: "start" });
    };

    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scroll);
    });
    const t1 = window.setTimeout(scroll, 50);
    const t2 = window.setTimeout(scroll, 200);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}
