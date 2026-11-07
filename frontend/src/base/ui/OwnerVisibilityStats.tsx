import type { ContentVisibility } from "@/lib/types";
import { CONTENT_VISIBILITY_LABEL } from "@/lib/visibility";
import { VisibilityIcon } from "./VisibilityIcon";

type Props = {
  visibility: ContentVisibility;
  viewCount: number;
  className?: string;
};

/** 所有者向け：公開範囲アイコン＋表示回数（目アイコン） */
export function OwnerVisibilityStats({
  visibility,
  viewCount,
  className = "",
}: Props) {
  const label = CONTENT_VISIBILITY_LABEL[visibility];
  const views = viewCount.toLocaleString("ja-JP");

  return (
    <p
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-kr-muted ${className}`.trim()}
    >
      <span className="inline-flex items-center gap-1">
        <VisibilityIcon visibility={visibility} className="h-3.5 w-3.5" />
        <span>{label}</span>
      </span>
      <span
        className="inline-flex items-center gap-1"
        title={`表示 ${views}回`}
      >
        <EyeIcon />
        <span className="tabular-nums">{views}</span>
        <span className="sr-only">表示回数</span>
      </span>
    </p>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 5.5C7 5.5 2.7 8.6 1 12c1.7 3.4 6 6.5 11 6.5s9.3-3.1 11-6.5c-1.7-3.4-6-6.5-11-6.5zm0 10a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
    </svg>
  );
}
