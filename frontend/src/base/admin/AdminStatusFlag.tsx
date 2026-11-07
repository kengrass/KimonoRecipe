import type { ReactNode } from "react";

type AdminStatusTone = "live" | "stopped" | "hidden" | "outside";

const TONE_CLASS: Record<AdminStatusTone, string> = {
  live: "inline-block rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800",
  /** 広告「停止」 */
  stopped:
    "inline-block rounded border border-kr-border bg-[#f7f7f7] px-1.5 py-0.5 text-[11px] font-medium text-kr-muted",
  /** 協賛「非表示」（既存クラスを維持） */
  hidden:
    "inline-block rounded border border-kr-border bg-[#f7f7f7] px-1.5 py-0.5 text-[11px] font-medium text-slate-600",
  outside:
    "inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900",
};

/** 配信／表示状態バッジ（見た目クラスは既存据え置き） */
export function AdminStatusFlag({
  tone,
  children,
}: {
  tone: AdminStatusTone;
  children: ReactNode;
}) {
  return <span className={TONE_CLASS[tone]}>{children}</span>;
}
