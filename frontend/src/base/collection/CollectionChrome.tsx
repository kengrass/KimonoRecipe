import Link from "next/link";
import { APP_ROUTES } from "@/lib/laravel-urls";
import type { ContentKind } from "@/lib/content-kind";
import { contentKindLabel } from "@/lib/content-kind";

/** 未ログイン時の会員一覧ゲート（データ取得前に出す想定） */
export function CollectionGuestGate({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="py-8 text-center sm:py-10">
      <h1 className="text-base font-semibold text-kr-text">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-kr-muted">
        {body}
      </p>
      <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link
          href={APP_ROUTES.regist}
          className="inline-flex min-w-40 items-center justify-center rounded bg-kr-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          メンバー登録
        </Link>
        <Link
          href={APP_ROUTES.login}
          className="inline-flex min-w-40 items-center justify-center rounded border border-kr-navy px-4 py-2.5 text-sm font-medium text-kr-navy hover:bg-neutral-50"
        >
          ログイン
        </Link>
      </div>
    </div>
  );
}

/**
 * コーデ／アイテム切替。
 * 高さ・タイポはマイページ `ListTabs` と同じ（意図せず小さくしない）。
 */
export function CollectionModeBar({
  mode,
  counts,
  hrefFor,
  showCounts = true,
}: {
  mode: ContentKind;
  counts?: { coordinates: number; items: number };
  hrefFor: (mode: ContentKind) => string;
  showCounts?: boolean;
}) {
  const options: { id: ContentKind; label: string; count?: number }[] = [
    {
      id: "coordinates",
      label: contentKindLabel("coordinates", "long"),
      count: counts?.coordinates,
    },
    {
      id: "items",
      label: contentKindLabel("items", "long"),
      count: counts?.items,
    },
  ];

  return (
    <div role="tablist" aria-label="一覧の種類" className="flex gap-2">
      {options.map((opt) => {
        const selected = mode === opt.id;
        return (
          <Link
            key={opt.id}
            href={hrefFor(opt.id)}
            role="tab"
            aria-selected={selected}
            scroll={false}
            className={`flex-1 rounded py-2.5 text-center text-sm font-medium transition ${
              selected
                ? "bg-kr-navy text-white"
                : "border border-kr-border text-kr-text hover:bg-neutral-50"
            }`}
          >
            {opt.label}
            {showCounts && opt.count !== undefined ? (
              <span
                className={`ml-1.5 text-xs tabular-nums ${
                  selected ? "text-white/80" : "text-kr-muted"
                }`}
              >
                {opt.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
