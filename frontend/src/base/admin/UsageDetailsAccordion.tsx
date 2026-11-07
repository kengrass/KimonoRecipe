"use client";

import { useState, type ReactNode } from "react";
import type { UsageInsight } from "@/lib/admin/types";
import { formatPercent } from "@/lib/admin/format";

type Props = {
  usage: UsageInsight;
};

/** 画面別PV〜検索ワード。既定は閉じる。利用者基盤の下に置く。 */
export function UsageDetailsAccordion({ usage }: Props) {
  const [open, setOpen] = useState(false);

  const funnelToPrompt =
    usage.funnel.detailViews > 0
      ? usage.funnel.authPromptShown / usage.funnel.detailViews
      : 0;
  const funnelToAuth =
    usage.funnel.authPromptShown > 0
      ? usage.funnel.loginOrRegist / usage.funnel.authPromptShown
      : 0;

  return (
    <section className="rounded-[12px] border border-kr-border bg-white text-[15px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-[14px] py-3.5 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-[15px] font-bold text-kr-text">
            利用の詳細
          </span>
          <span className="mt-0.5 block text-[13px] text-slate-600">
            先々に詳細仕様を検討（画面別PV・会員化ファネル・閲覧ランキング・検索ワードなど）
          </span>
        </span>
        <span
          className={`shrink-0 text-slate-600 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-kr-border px-[14px] py-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="画面別 PV（今日）">
              <table className="min-w-full text-left text-[15px]">
                <thead>
                  <tr className="border-b border-kr-border text-[13px] text-slate-600">
                    <th className="py-2 font-semibold">画面</th>
                    <th className="py-2 text-right font-semibold">PV</th>
                    <th
                      className="py-2 text-right font-semibold"
                      title="その画面の PV のうち会員による割合"
                    >
                      会員比
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.pagePv.map((row) => (
                    <tr
                      key={row.pathLabel}
                      className="border-b border-kr-border/80 last:border-0"
                    >
                      <td className="py-2">{row.pathLabel}</td>
                      <td className="py-2 text-right tabular-nums">
                        {row.pv.toLocaleString("ja-JP")}
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-600">
                        {formatPercent(row.memberShare)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="会員化ファネル（今日）">
              <ol className="space-y-2 text-[15px]">
                <li className="flex justify-between gap-3 border-b border-kr-border/80 pb-2">
                  <span>詳細閲覧</span>
                  <span className="tabular-nums font-semibold">
                    {usage.funnel.detailViews.toLocaleString("ja-JP")}
                  </span>
                </li>
                <li className="flex justify-between gap-3 border-b border-kr-border/80 pb-2">
                  <span>
                    ログイン誘導表示
                    <span className="ml-2 text-[13px] text-slate-600">
                      （{formatPercent(funnelToPrompt)}）
                    </span>
                  </span>
                  <span className="tabular-nums font-semibold">
                    {usage.funnel.authPromptShown.toLocaleString("ja-JP")}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>
                    ログイン／登録完了
                    <span className="ml-2 text-[13px] text-slate-600">
                      （誘導→{formatPercent(funnelToAuth)}）
                    </span>
                  </span>
                  <span className="tabular-nums font-semibold">
                    {usage.funnel.loginOrRegist.toLocaleString("ja-JP")}
                  </span>
                </li>
              </ol>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="詳細閲覧ランキング（コーデ）">
              <RankList rows={usage.topCoordinates} />
            </Panel>
            <Panel title="詳細閲覧ランキング（アイテム）">
              <RankList rows={usage.topItems} />
            </Panel>
          </div>

          <Panel title="検索ワード（今日）">
            <table className="min-w-full text-left text-[15px]">
              <thead>
                <tr className="border-b border-kr-border text-[13px] text-slate-600">
                  <th className="py-2 font-semibold">クエリ</th>
                  <th className="py-2 text-right font-semibold">回数</th>
                  <th className="py-2 text-right font-semibold">結果</th>
                </tr>
              </thead>
              <tbody>
                {usage.searches.map((row) => (
                  <tr
                    key={row.query}
                    className="border-b border-kr-border/80 last:border-0"
                  >
                    <td className="py-2">{row.query}</td>
                    <td className="py-2 text-right tabular-nums">
                      {row.count.toLocaleString("ja-JP")}
                    </td>
                    <td className="py-2 text-right">
                      {row.zeroHit ? (
                        <span className="text-amber-800">ゼロ件</span>
                      ) : (
                        <span className="text-slate-600">ヒットあり</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      ) : null}
    </section>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-kr-border bg-[#fafafa] p-[14px]">
      <h3 className="mb-3 text-[14px] font-semibold text-kr-text">{title}</h3>
      {children}
    </div>
  );
}

function RankList({
  rows,
}: {
  rows: { id: string; title: string; pv: number }[];
}) {
  return (
    <ol className="space-y-2">
      {rows.map((row, i) => (
        <li
          key={row.id}
          className="flex items-baseline justify-between gap-3 border-b border-kr-border/80 pb-2 last:border-0 last:pb-0"
        >
          <span className="min-w-0">
            <span className="mr-2 tabular-nums text-slate-600">{i + 1}.</span>
            {row.title}
          </span>
          <span className="shrink-0 tabular-nums font-semibold">
            {row.pv.toLocaleString("ja-JP")}
          </span>
        </li>
      ))}
    </ol>
  );
}
