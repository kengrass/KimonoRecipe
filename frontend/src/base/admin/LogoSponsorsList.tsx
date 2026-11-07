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
import { isLogoSponsorShowing } from "@/lib/admin/logo-sponsors-store";
import type { AdminLogoSponsor } from "@/lib/admin/types";

function LogoStatusFlag({ row }: { row: AdminLogoSponsor }) {
  if (isLogoSponsorShowing(row)) {
    return <AdminStatusFlag tone="live">表示中</AdminStatusFlag>;
  }
  if (!row.enabled) {
    return <AdminStatusFlag tone="hidden">非表示</AdminStatusFlag>;
  }
  return <AdminStatusFlag tone="outside">期間外</AdminStatusFlag>;
}

type Props = {
  rows: AdminLogoSponsor[];
  onEdit: (row: AdminLogoSponsor) => void;
  onMove: (id: string, dir: -1 | 1) => void;
};

/** 協賛ロゴ一覧 */
export function LogoSponsorsList({ rows, onEdit, onMove }: Props) {
  return (
    <div className={ADMIN_TABLE_WRAP}>
      {rows.length === 0 ? (
        <p className={ADMIN_EMPTY}>
          まだありません。売れたらここに登録するとフッター上に出ます。
        </p>
      ) : (
        <table className={ADMIN_TABLE}>
          <thead className={ADMIN_THEAD}>
            <tr>
              <th className={ADMIN_TH}>表示順</th>
              <th className={ADMIN_TH}>ロゴ</th>
              <th className={ADMIN_TH}>スポンサー</th>
              <th className={ADMIN_TH}>期間</th>
              <th className={ADMIN_TH}>状態</th>
              <th className={`${ADMIN_TH} text-right`}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={ADMIN_TR}>
                <td className={ADMIN_TD}>
                  <div className="flex items-center gap-2 text-[13px] whitespace-nowrap">
                    <span className="tabular-nums">{row.sortOrder}</span>
                    {index > 0 ? (
                      <button
                        type="button"
                        className={ADMIN_LINK_ACTION}
                        onClick={() => onMove(row.id, -1)}
                      >
                        上へ
                      </button>
                    ) : null}
                    {index < rows.length - 1 ? (
                      <button
                        type="button"
                        className={ADMIN_LINK_ACTION}
                        onClick={() => onMove(row.id, 1)}
                      >
                        下へ
                      </button>
                    ) : null}
                  </div>
                </td>
                <td className={ADMIN_TD}>
                  {row.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.logoUrl}
                      alt=""
                      className="h-8 max-w-[6rem] object-contain"
                    />
                  ) : (
                    <span className="text-[13px] text-slate-600">テキスト</span>
                  )}
                </td>
                <td className={ADMIN_TD}>
                  <p className="font-medium">{row.sponsorName}</p>
                  {row.packageNote ? (
                    <p className="mt-0.5 text-[13px] text-slate-600">
                      {row.packageNote}
                    </p>
                  ) : null}
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
                  <LogoStatusFlag row={row} />
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
  );
}
