import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  moreHref?: string;
  onMoreClick?: () => void;
  moreLabel?: string;
  flush?: boolean;
  /** タイトル右（例: 操作結果の短い文言） */
  trailing?: ReactNode;
};

/** Next のセクション見出し */
export function SectionHeader({
  title,
  moreHref,
  onMoreClick,
  moreLabel = "もっと見る",
  flush = false,
  trailing,
}: Props) {
  const isExternal = Boolean(moreHref?.startsWith("http"));

  let action: ReactNode = null;
  if (onMoreClick) {
    action = (
      <button
        type="button"
        onClick={onMoreClick}
        className="text-sm text-kr-link hover:underline"
      >
        {moreLabel}
      </button>
    );
  } else if (moreHref) {
    action = isExternal ? (
      <a
        href={moreHref}
        className="text-sm text-kr-link hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        {moreLabel}
      </a>
    ) : (
      <Link href={moreHref} className="text-sm text-kr-link hover:underline">
        {moreLabel}
      </Link>
    );
  }

  return (
    <div
      className={`mb-4 flex items-end justify-between gap-3 ${
        flush ? "" : "detail-inset"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h2 className="shrink-0 text-base font-semibold tracking-tight text-kr-text md:text-lg">
          {title}
        </h2>
        {trailing ? <div className="flex min-w-0 items-center">{trailing}</div> : null}
      </div>
      {action}
    </div>
  );
}
