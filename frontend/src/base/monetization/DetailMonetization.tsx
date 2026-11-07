"use client";

import { SponsorAd } from "./SponsorAd";

/**
 * マネタイズ枠（純広告のみ）。
 * - コーデ詳細 / アイテム詳細: 売れる本命枠。案件が無いときは何も出さない。
 */

export function CoordinateDetailMainMonetization() {
  return (
    <div className="detail-inset mt-6">
      <SponsorAd placement="coord_detail" />
    </div>
  );
}

export function ItemDetailMonetization() {
  return (
    <div className="detail-inset mt-6">
      <SponsorAd placement="item_detail" />
    </div>
  );
}
