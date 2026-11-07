"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CoordinateDetailView } from "@/base/detail/CoordinateDetailView";
import { APP_ROUTES } from "@/lib/laravel-urls";
import {
  getMockTempCoordinate,
  isMockTempCoordinateId,
  mockTempCoordinateDetail,
  mockTempCoordinateOwnerFields,
} from "@/lib/mock-temp-coordinate";
import type {
  OwnerCoordinateFields,
  PublicCoordinateDetail,
} from "@/lib/types";

type Props = { id: string };

/**
 * sessionStorage 上のモック仮コーデ詳細。
 * RSC では読めないためクライアントで組み立てる。
 */
export function MockTempCoordinateDetail({ id }: Props) {
  const [data, setData] = useState<{
    coordinate: PublicCoordinateDetail;
    ownerFields: OwnerCoordinateFields;
  } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!isMockTempCoordinateId(id)) {
      setMissing(true);
      return;
    }
    const item = getMockTempCoordinate(id);
    if (!item) {
      setMissing(true);
      return;
    }
    setData({
      coordinate: mockTempCoordinateDetail(item),
      ownerFields: mockTempCoordinateOwnerFields(id),
    });
  }, [id]);

  if (missing) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-kr-muted">仮コーデが見つかりません。</p>
        <Link
          href={APP_ROUTES.home}
          className="mt-3 inline-flex text-sm font-medium text-kr-link hover:underline"
        >
          トップへ
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-16 text-center text-sm text-kr-muted">
        読み込み中…
      </div>
    );
  }

  return (
    <CoordinateDetailView
      coordinate={data.coordinate}
      ownerFields={data.ownerFields}
      browseList={[]}
    />
  );
}
