"use client";

import { AdminPeriodLines } from "@/base/admin/AdminPeriodLines";
import { AdminStatusFlag } from "@/base/admin/AdminStatusFlag";
import {
  ADMIN_EMPTY,
  ADMIN_LINK_ACTION,
  ADMIN_TABLE,
  ADMIN_TABLE_WRAP,
  ADMIN_TD,
  ADMIN_TH,
  ADMIN_THEAD,
  ADMIN_TR,
} from "@/base/admin/admin-form-styles";
import {
  adCtr,
  isAdDelivering,
  placementLabel,
} from "@/lib/admin/ads-store";
import { formatPercent } from "@/lib/admin/format";
import type { AdminAd } from "@/lib/admin/types";

function AdDeliveryFlag({ ad }: { ad: AdminAd }) {
  if (isAdDelivering(ad)) {
    return <AdminStatusFlag tone="live">配信中</AdminStatusFlag>;
  }
  if (!ad.enabled) {
    return <AdminStatusFlag tone="stopped">停止</AdminStatusFlag>;
  }
  return <AdminStatusFlag tone="outside">期間外</AdminStatusFlag>;
}

function AdMetricsLines({ ad }: { ad: AdminAd }) {
  return (
    <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-1 text-[13px] leading-snug whitespace-nowrap">
      <span className="text-slate-600" title="ビューアブル（半分以上が1秒）">
        表示
      </span>
      <span className="tabular-nums text-right text-kr-text">
        {ad.impressions.toLocaleString("ja-JP")}
      </span>
      <span className="text-slate-600">クリック</span>
      <span className="tabular-nums text-right text-kr-text">
        {ad.clicks.toLocaleString("ja-JP")}
      </span>
      <span className="text-slate-600">CTR</span>
      <span className="tabular-nums text-right text-kr-text">
        {formatPercent(adCtr(ad))}
      </span>
    </div>
  );
}

export type AdsListFilter = "all" | "live";

type Props = {
  rows: AdminAd[];
  visibleRows: AdminAd[];
  listFilter: AdsListFilter;
  onListFilterChange: (filter: AdsListFilter) => void;
  copiedId: string | null;
  onCopy: (ad: AdminAd) => void;
  onEdit: (ad: AdminAd) => void;
};

/** 純広告一覧＋配信中／全てタブ */
export function AdsManagerList({
  rows,
  visibleRows,
  listFilter,
  onListFilterChange,
  copiedId,
  onCopy,
  onEdit,
}: Props) {
  return (
    <>
      <div
        role="tablist"
        aria-label="案件の表示"
        className="flex gap-1 border-b border-kr-border"
      >
        {(
          [
            { id: "live", label: "配信中" },
            { id: "all", label: "全て" },
          ] as const
        ).map((opt) => {
          const active = listFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onListFilterChange(opt.id)}
              className={`border-0 border-b-2 bg-transparent px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-kr-navy text-kr-navy"
                  : "border-transparent text-kr-muted hover:text-kr-text"
              }`}
            >
              {opt.label}
              <span className="ml-1.5 tabular-nums text-xs text-kr-muted">
                {opt.id === "live"
                  ? rows.filter(isAdDelivering).length
                  : rows.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className={ADMIN_TABLE_WRAP}>
        {rows.length === 0 ? (
          <p className={ADMIN_EMPTY}>案件がまだありません</p>
        ) : visibleRows.length === 0 ? (
          <p className={ADMIN_EMPTY}>
            配信中の案件はありません。「全て」で終了・停止中も表示できます。
          </p>
        ) : (
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_THEAD}>
              <tr>
                <th className={ADMIN_TH}>クリエイティブ</th>
                <th className={ADMIN_TH}>案件 / 広告主</th>
                <th className={ADMIN_TH}>枠</th>
                <th className={ADMIN_TH}>期間</th>
                <th className={ADMIN_TH}>状態</th>
                <th className={ADMIN_TH}>指標</th>
                <th className={ADMIN_TH} aria-label="コピー" />
                <th className={`${ADMIN_TH} text-right`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className={ADMIN_TR}>
                  <td className={ADMIN_TD}>
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="h-28 w-28 rounded border border-kr-border object-cover"
                      />
                    ) : (
                      <span className="text-[13px] text-slate-600">なし</span>
                    )}
                  </td>
                  <td className={ADMIN_TD}>
                    <p className="font-medium leading-snug">{row.name}</p>
                    <p className="mt-1 text-[13px] leading-snug text-slate-600">
                      {row.advertiser}
                    </p>
                  </td>
                  <td className={ADMIN_TD}>
                    <div className="flex flex-col gap-1 text-[13px] leading-snug">
                      {row.placements.length > 0 ? (
                        row.placements.map((p) => (
                          <span key={p}>{placementLabel(p)}</span>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </td>
                  <td className={ADMIN_TD}>
                    <div className="flex flex-col gap-1 text-[13px] tabular-nums leading-snug whitespace-nowrap">
                      <AdminPeriodLines
                        startOn={row.startOn}
                        endOn={row.endOn}
                      />
                    </div>
                  </td>
                  <td className={`${ADMIN_TD} whitespace-nowrap`}>
                    <AdDeliveryFlag ad={row} />
                  </td>
                  <td className={ADMIN_TD}>
                    <AdMetricsLines ad={row} />
                  </td>
                  <td className={`${ADMIN_TD} text-right whitespace-nowrap`}>
                    <button
                      type="button"
                      className={ADMIN_LINK_ACTION}
                      onClick={() => onCopy(row)}
                      title="広告主向け実績レポートをクリップボードへ"
                    >
                      {copiedId === row.id ? "コピー済" : "コピー"}
                    </button>
                  </td>
                  <td className={`${ADMIN_TD} text-right whitespace-nowrap`}>
                    <button
                      type="button"
                      className={ADMIN_LINK_ACTION}
                      onClick={() => onEdit(row)}
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
