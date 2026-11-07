"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/base/admin/StatCard";
import { UsageDetailsAccordion } from "@/base/admin/UsageDetailsAccordion";
import type { AdminDataSource } from "@/lib/admin/admin-data";
import type {
  ActivityBucket,
  AdminKpis,
  UsageInsight,
} from "@/lib/admin/types";
import { formatPercent, formatYmdSlash } from "@/lib/admin/format";
import { buildMockUsageInsight } from "@/lib/usage-tracking";

type Props = {
  source: AdminDataSource;
  kpis: AdminKpis;
  activity: ActivityBucket[];
  /** null = 日次UU等の計測基盤未接続 */
  usage: UsageInsight | null;
  liveError?: string;
};

/**
 * 統計トップ。
 * 概況（登録ストック）→ 会員の最終利用／日次推移（横並び）→ 詳細
 */
export function StatsDashboard({
  source,
  kpis,
  activity,
  usage: usageProp,
  liveError,
}: Props) {
  const [usage, setUsage] = useState<UsageInsight | null>(usageProp);

  useEffect(() => {
    setUsage(usageProp);
  }, [usageProp]);

  useEffect(() => {
    if (source !== "mock") return;
    setUsage(buildMockUsageInsight());
  }, [source]);

  return (
    <div className="space-y-8 text-[15px]">
      {liveError ? (
        <p className="text-[13px] text-amber-800">{liveError}</p>
      ) : null}

      <section>
        <h2 className="mb-3 text-[15px] font-bold text-kr-text">概況</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="登録会員"
            value={
              <>
                {kpis.userCount.toLocaleString("ja-JP")}
                <span className="ml-0.5 text-[15px] font-semibold text-slate-600">
                  人
                </span>
              </>
            }
          />
          <StatCard
            label="本コーデ"
            value={
              <>
                {kpis.coordinateCount.toLocaleString("ja-JP")}
                <span className="ml-0.5 text-[15px] font-semibold text-slate-600">
                  件
                </span>
              </>
            }
          />
          <StatCard
            label="仮コーデ"
            value={
              <>
                {kpis.tempCoordinateCount.toLocaleString("ja-JP")}
                <span className="ml-0.5 text-[15px] font-semibold text-slate-600">
                  件
                </span>
              </>
            }
          />
          <StatCard
            label="アイテム"
            value={
              <>
                {kpis.itemCount.toLocaleString("ja-JP")}
                <span className="ml-0.5 text-[15px] font-semibold text-slate-600">
                  件
                </span>
              </>
            }
          />
          <StatCard
            label="画像"
            value={
              <>
                {kpis.imageCount.toLocaleString("ja-JP")}
                <span className="ml-0.5 text-[15px] font-semibold text-slate-600">
                  枚
                </span>
              </>
            }
          />
          <StatCard
            label="紐付率"
            value={formatPercent(kpis.attachmentRate)}
            hint="本コーデ・1件以上"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:items-start">
        <section className="min-w-0">
          <h2 className="mb-3 text-[15px] font-bold text-kr-text">
            会員の最終利用
          </h2>
          <p className="mb-3 text-[13px] text-slate-600">
            会員の最終利用からの経過
          </p>
          <div className="-mx-1 overflow-x-auto overscroll-x-contain rounded-[12px] border border-kr-border bg-white sm:mx-0">
            <table className="w-full min-w-[30rem] table-fixed text-left text-[13px] sm:text-[15px]">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-kr-border bg-[#f7f7f7] text-[12px] text-slate-600 sm:text-[13px]">
                  <th className="whitespace-nowrap px-2.5 py-2 font-semibold sm:px-3 sm:py-2.5">
                    期間
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold sm:px-3 sm:py-2.5">
                    人数
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold sm:px-3 sm:py-2.5">
                    構成比
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold sm:px-3 sm:py-2.5">
                    累計人数
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold sm:px-3 sm:py-2.5">
                    累計構成比
                  </th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-kr-border/80 last:border-0"
                  >
                    <td className="whitespace-nowrap px-2.5 py-2 sm:px-3 sm:py-2.5">
                      {row.label}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-right tabular-nums sm:px-3 sm:py-2.5">
                      {row.count.toLocaleString("ja-JP")}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-right tabular-nums text-slate-600 sm:px-3 sm:py-2.5">
                      {formatPercent(row.share)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-right tabular-nums sm:px-3 sm:py-2.5">
                      {row.cumulativeCount.toLocaleString("ja-JP")}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-right tabular-nums text-slate-600 sm:px-3 sm:py-2.5">
                      {formatPercent(row.cumulativeShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {usage ? (
          <section className="min-w-0">
            <h2 className="mb-3 text-[15px] font-bold text-kr-text">日次推移</h2>
            <p className="mb-3 text-[13px] text-slate-600">
              直近7日。新規コーデ／アイテムはその日の投稿数
            </p>
            <div className="-mx-1 overflow-x-auto overscroll-x-contain rounded-[12px] border border-kr-border bg-white sm:mx-0">
              <table className="w-full min-w-[32rem] table-fixed text-left text-[13px] sm:text-[15px]">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[21%]" />
                  <col className="w-[21%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-kr-border bg-[#f7f7f7] text-[12px] text-slate-600 sm:text-[13px]">
                    <th className="whitespace-nowrap px-2.5 py-2 font-semibold sm:px-3 sm:py-2.5">
                      日
                    </th>
                    <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold sm:px-3 sm:py-2.5">
                      会員UU
                    </th>
                    <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold sm:px-3 sm:py-2.5">
                      ゲストUU
                    </th>
                    <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold sm:px-3 sm:py-2.5">
                      PV
                    </th>
                    <th
                      className="whitespace-nowrap py-2 pl-1.5 pr-2.5 text-right font-semibold sm:py-2.5 sm:pl-2 sm:pr-3"
                      title="その日に追加されたコーデ"
                    >
                      新規コーデ
                    </th>
                    <th
                      className="whitespace-nowrap py-2 pl-1.5 pr-2.5 text-right font-semibold sm:py-2.5 sm:pl-2 sm:pr-3"
                      title="その日に追加されたアイテム"
                    >
                      新規アイテム
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...usage.last7Days].reverse().map((row) => (
                    <tr
                      key={row.date}
                      className="border-b border-kr-border/80 last:border-0"
                    >
                      <td className="whitespace-nowrap px-2.5 py-2 tabular-nums sm:px-3 sm:py-2.5">
                        {formatYmdSlash(row.date)}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right tabular-nums sm:px-3 sm:py-2.5">
                        {row.memberUu.toLocaleString("ja-JP")}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right tabular-nums sm:px-3 sm:py-2.5">
                        {row.guestUu.toLocaleString("ja-JP")}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right tabular-nums sm:px-3 sm:py-2.5">
                        {row.pv.toLocaleString("ja-JP")}
                      </td>
                      <td className="whitespace-nowrap py-2 pl-1.5 pr-2.5 text-right tabular-nums sm:py-2.5 sm:pl-2 sm:pr-3">
                        {row.coordinateCount.toLocaleString("ja-JP")}
                      </td>
                      <td className="whitespace-nowrap py-2 pl-1.5 pr-2.5 text-right tabular-nums sm:py-2.5 sm:pl-2 sm:pr-3">
                        {row.itemCount.toLocaleString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      {usage ? <UsageDetailsAccordion usage={usage} /> : null}

      <section>
        <h2 className="mb-3 text-[15px] font-bold text-kr-text">集計の定義</h2>
        <div className="rounded-[12px] bg-[#ececec] px-4 py-4 text-[13px] leading-relaxed text-slate-700 sm:px-5">
          <p>
            <span className="font-semibold text-kr-text">紐付率</span>
            … 本コーデのうち、アイテムが1件以上付いている割合（仮コーデは対象外）。
          </p>
          <p className="mt-2">
            <span className="font-semibold text-kr-text">会員UU／ゲストUU</span>
            … その日に閲覧したユニーク数。会員はログイン中のuid、ゲストは匿名ID。
          </p>
          <p className="mt-2">
            <span className="font-semibold text-kr-text">PV</span>
            … メインサイトで画面遷移が確定するたびに1回（pathname単位。一般的なSPAのページビュー）。
            同一画面の再マウント・認証の後追い・ごく短いリダイレクト連鎖・クエリのみの変化・管理画面は数えない。
            フルリロードはその画面を1回数え直す。
          </p>
          <p className="mt-2">
            <span className="font-semibold text-kr-text">新規コーデ／新規アイテム</span>
            … その日に追加された投稿数。
          </p>
          <p className="mt-2">
            <span className="font-semibold text-kr-text">会員の最終利用</span>
            … 会員のみ。最終利用からの経過帯。若い帯から累計を積む。
          </p>
        </div>
      </section>
    </div>
  );
}
