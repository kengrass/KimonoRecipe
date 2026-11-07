"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { CONTENT_VISIBILITY_LABEL } from "@/lib/visibility";

export const GENDER_OPTIONS = [
  { id: "women", label: "女性" },
  { id: "men", label: "男性" },
  { id: "kids", label: "キッズ" },
] as const;

export const SEASON_OPTIONS = ["春", "夏", "秋", "冬"] as const;

const inputClass =
  "w-full rounded-lg border border-kr-border bg-white px-3.5 py-2.5 text-sm text-kr-text outline-none transition placeholder:text-kr-muted/70 focus:border-kr-navy/50 focus:ring-2 focus:ring-kr-navy/10";

const chipOn =
  "border border-kr-navy bg-kr-navy font-medium text-white";
const chipOff =
  "border border-kr-navy/25 bg-neutral-50 text-kr-text hover:border-kr-navy/50 hover:bg-white";

export function Field({
  id,
  label,
  hint,
  hintTone = "muted",
  children,
}: {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  hintTone?: "muted" | "warn" | "info";
  children: ReactNode;
}) {
  const hintClass =
    hintTone === "warn"
      ? "text-red-600/85"
      : hintTone === "info"
        ? "text-kr-link"
        : "text-kr-muted";

  return (
    <label id={id} className="block scroll-mt-24">
      <span className="mb-2 block text-sm font-medium text-kr-text">
        {label}
      </span>
      {children}
      {hint ? (
        <span
          role={hintTone === "warn" ? "alert" : undefined}
          className={`mt-2 block text-xs leading-relaxed ${hintClass}`}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput(props, ref) {
  return (
    <input
      {...props}
      ref={ref}
      className={`${inputClass} ${props.className ?? ""}`}
    />
  );
});

export function TextTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`${inputClass} min-h-[7rem] resize-y ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`} />
  );
}

/** ListTabs 相当のセグメント */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`min-w-[4.5rem] flex-1 rounded-lg px-3 py-2.5 text-center text-sm transition ${
              selected ? chipOn : "border border-kr-border text-kr-text hover:bg-neutral-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** NewPost の Choice に近いチップ */
export function ChoiceChips<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              selected ? chipOn : chipOff
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-medium text-kr-text">
      {children}
      <span className="ml-1.5 text-xs font-normal text-red-600/85">必須</span>
    </span>
  );
}

/** 公開／非公開のラベル横バッジ（文言は CONTENT_VISIBILITY_LABEL と同一） */
export function VisibilityBadge({
  tone,
}: {
  tone: "public" | "private";
}) {
  if (tone === "public") {
    return (
      <span className="rounded border border-kr-navy/40 px-1.5 py-0.5 text-[10px] font-normal text-kr-navy">
        {CONTENT_VISIBILITY_LABEL.public}
      </span>
    );
  }
  return (
    <span className="rounded border border-kr-border px-1.5 py-0.5 text-[10px] font-normal text-kr-muted">
      {CONTENT_VISIBILITY_LABEL.private}
    </span>
  );
}

/** 「メモ１」＋バッジ のようなラベル */
export function LabeledWithBadge({
  children,
  badge,
}: {
  children: ReactNode;
  badge: "public" | "private";
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {children}
      <VisibilityBadge tone={badge} />
    </span>
  );
}

/** 春夏秋冬（複数選択チップ） */
export function SeasonCheckboxes({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (season: string) => {
    onChange(
      value.includes(season)
        ? value.filter((s) => s !== season)
        : [...value, season],
    );
  };

  return (
    <div role="group" aria-label="季節" className="flex flex-wrap gap-2">
      {SEASON_OPTIONS.map((season) => {
        const on = value.includes(season);
        return (
          <button
            key={season}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(season)}
            className={`rounded-lg px-3 py-2 text-sm transition ${on ? chipOn : chipOff}`}
          >
            {season}
          </button>
        );
      })}
    </div>
  );
}

/** オン／オフ1項目（仮コーデ・断捨離など） */
export function FlagToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex rounded-lg px-3 py-2 text-sm transition ${
        checked ? chipOn : chipOff
      }`}
    >
      {label}
    </button>
  );
}
