import Link from "next/link";
import type { ReactNode } from "react";
import { MockPreviewBanner } from "@/base/form/MockPreviewBanner";
import { PageShell } from "@/base/PageShell";

type Props = {
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  /** false で「← 戻る」を出さない（投稿編集など。既定は表示） */
  showBackLink?: boolean;
  /** false でプレビューバナーを出さない（既定は表示） */
  showPreviewBanner?: boolean;
  previewNote?: ReactNode;
  /** 既存 Laravel での本番操作 */
  liveHref?: string;
  liveLabel?: string;
};

/** 投稿・設定画面の共通シェル（左右余白＋任意で戻る／プレビュー） */
export function FormPageShell({
  backHref,
  backLabel = "トップへ",
  children,
  showBackLink = true,
  showPreviewBanner = true,
  previewNote,
  liveHref,
  liveLabel,
}: Props) {
  return (
    <PageShell className="page-shell--form page-enter pb-10">
      {showBackLink && backHref ? (
        <div className="mb-4">
          <Link
            href={backHref}
            className="text-sm text-kr-link hover:underline"
          >
            ← {backLabel}
          </Link>
        </div>
      ) : null}
      {showPreviewBanner ? (
        <div className="mb-6">
          {previewNote ? (
            <MockPreviewBanner liveHref={liveHref} liveLabel={liveLabel}>
              {previewNote}
            </MockPreviewBanner>
          ) : (
            <MockPreviewBanner liveHref={liveHref} liveLabel={liveLabel} />
          )}
        </div>
      ) : null}
      {children}
    </PageShell>
  );
}
