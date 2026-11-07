import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
};

/** 参考UIの .stat 相当 */
export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="flex flex-col rounded-[12px] border border-kr-border bg-white p-[14px]">
      <p className="text-[13px] font-medium text-slate-600">{label}</p>
      <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-kr-text">
        {value}
      </div>
      {hint ? (
        <p className="mt-1 text-[13px] leading-snug text-slate-600">{hint}</p>
      ) : null}
    </div>
  );
}
