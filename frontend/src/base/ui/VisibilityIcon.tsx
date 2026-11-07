import type { ContentVisibility } from "@/lib/types";
import { CONTENT_VISIBILITY_LABEL } from "@/lib/visibility";

type Props = {
  visibility: ContentVisibility;
  className?: string;
  /** true のときラベルも併記 */
  withLabel?: boolean;
  /** 写真上など暗い背景向け（白アイコン） */
  inverse?: boolean;
  /** 親の text color を継承（現行 openstatus の #c0c0c0 など） */
  tone?: "muted" | "inherit";
};

/** 公開範囲アイコン：公開＝地球、非公開＝鍵 */
export function VisibilityIcon({
  visibility,
  className = "h-3.5 w-3.5",
  withLabel = false,
  inverse = false,
  tone = "muted",
}: Props) {
  const label = CONTENT_VISIBILITY_LABEL[visibility];
  const icon =
    visibility === "public" ? (
      <GlobeIcon className={className} />
    ) : (
      <LockIcon className={className} />
    );
  const colorClass = inverse
    ? "text-white"
    : tone === "inherit"
      ? "text-inherit"
      : "text-kr-muted";

  if (!withLabel) {
    return (
      <span
        className={`inline-flex shrink-0 leading-none ${colorClass}`}
        title={label}
        aria-label={label}
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 leading-none ${colorClass}`}
      title={label}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </span>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6-5c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3z" />
    </svg>
  );
}
