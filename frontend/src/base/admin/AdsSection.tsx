"use client";

import { useState } from "react";
import { AdsManager } from "@/base/admin/AdsManager";
import { LogoSponsorsManager } from "@/base/admin/LogoSponsorsManager";

/** 商品レイヤーだけ分ける（実績は広告の中） */
type Tab = "ads" | "logos";

const TABS: { id: Tab; label: string }[] = [
  { id: "ads", label: "広告" },
  { id: "logos", label: "協賛" },
];

export function AdsSection() {
  const [tab, setTab] = useState<Tab>("ads");

  return (
    <div className="space-y-4">
      <div className="flex gap-0 border-b border-kr-border">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-0 border-b-2 bg-transparent px-3 py-2.5 text-[15px] font-bold transition-colors ${
                active
                  ? "border-[var(--fg)] text-[color:var(--fg)]"
                  : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--fg)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "ads" ? <AdsManager /> : <LogoSponsorsManager />}
    </div>
  );
}
