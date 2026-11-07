import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  /** 既存 Laravel での本番操作へのリンク */
  liveHref?: string;
  liveLabel?: string;
};

/**
 * 見た目モック画面の明示バナー。
 * 保存・アップロード未接続であることを伝え、任意で本番 URL へ誘導する。
 */
export function MockPreviewBanner({
  children = "見た目プレビューです。保存・アップロードはまだ接続していません。",
  liveHref,
  liveLabel = "本番で操作する",
}: Props) {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-950"
    >
      <p>{children}</p>
      {liveHref ? (
        <p className="mt-2">
          <a
            href={liveHref}
            className="font-medium text-amber-950 underline decoration-amber-400 underline-offset-2 hover:decoration-amber-700"
            target="_blank"
            rel="noreferrer"
          >
            {liveLabel}
          </a>
          <span className="text-amber-800">（既存 Laravel・別タブ）</span>
        </p>
      ) : null}
    </div>
  );
}
