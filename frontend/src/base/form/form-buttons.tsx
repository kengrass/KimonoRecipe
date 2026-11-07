"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex w-full items-center justify-center rounded-lg bg-kr-teal px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/** 右寄せの Primary（設定の保存ボタン用） */
export function EndPrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end">
      <PrimaryButton className="w-auto px-4" onClick={onClick}>
        {children}
      </PrimaryButton>
    </div>
  );
}

export function SecondaryButton({
  children,
  tone = "neutral",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "neutral" | "owner" | "danger" | "soft";
}) {
  const tones = {
    neutral:
      "border-kr-navy/30 bg-neutral-50 text-kr-text hover:border-kr-navy/55 hover:bg-white hover:shadow-sm",
    owner: "border-transparent bg-kr-owner text-white hover:opacity-90",
    soft: "border-kr-border bg-white text-kr-link hover:border-kr-navy/35 hover:text-kr-navy",
    danger:
      "border-kr-border bg-white text-red-600/85 hover:border-red-300 hover:bg-red-50",
  } as const;

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center rounded-lg border px-3.5 py-2.5 text-sm font-medium transition ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconDeleteButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-kr-muted transition hover:bg-neutral-100 hover:text-red-600 ${className}`}
    >
      <span aria-hidden className="text-base leading-none">
        ×
      </span>
    </button>
  );
}

/** 「+ カテゴリ追加」系の行追加 */
export function AddRowButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-sm font-medium text-kr-link hover:text-kr-navy"
      onClick={onClick}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-kr-border text-kr-navy">
        +
      </span>
      {label}
    </button>
  );
}
