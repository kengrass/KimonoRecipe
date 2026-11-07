"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ModeOption<T extends string> = { id: T; label: string };

/** 見方切替（季節・カテゴリ・断捨離など） */
export function ModeSwitch<T extends string>({
  label,
  options,
  value,
  hrefFor,
  ariaLabel,
}: {
  label: string;
  options: ModeOption<T>[];
  value: T;
  hrefFor: (id: T) => string;
  ariaLabel: string;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs font-semibold text-kr-text">{label}</p>
      {options.length > 1 ? (
        <div
          className="flex max-w-full flex-wrap justify-end rounded border border-kr-border p-0.5 text-[11px]"
          role="tablist"
          aria-label={ariaLabel}
        >
          {options.map((opt) => {
            const active = value === opt.id;
            return (
              <Link
                key={opt.id}
                href={hrefFor(opt.id)}
                role="tab"
                aria-selected={active}
                scroll={false}
                className={`rounded px-2 py-0.5 ${
                  active
                    ? "bg-kr-navy font-medium text-white"
                    : "text-kr-muted hover:text-kr-text"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export type FilterChipItem = {
  id: string;
  label: string;
  count?: number;
  href: string;
};

const chipClass = (active: boolean) =>
  `rounded px-2.5 py-1 text-xs ${
    active
      ? "bg-kr-navy font-medium text-white"
      : "bg-neutral-100 text-kr-text hover:bg-neutral-200"
  }`;

/** 絞り込みチップ（Link ベース。件数は括弧なし） */
export function FilterChips({
  items,
  allHref,
  allCount,
  activeId,
  trailing,
  emptyMessage,
}: {
  items: FilterChipItem[];
  allHref?: string;
  allCount?: number;
  activeId?: string;
  trailing?: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {allHref !== undefined ? (
        <Link href={allHref} scroll={false} className={chipClass(!activeId)}>
          すべて
          {allCount !== undefined ? (
            <span className="ml-1 text-[10px] tabular-nums opacity-80">
              {allCount}
            </span>
          ) : null}
        </Link>
      ) : null}
      {items.length > 0
        ? items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              scroll={false}
              className={chipClass(activeId === item.id)}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className="ml-1 text-[10px] tabular-nums opacity-80">
                  {item.count}
                </span>
              ) : null}
            </Link>
          ))
        : emptyMessage ? (
            <p className="text-xs text-kr-muted">{emptyMessage}</p>
          ) : null}
      {trailing}
    </div>
  );
}
