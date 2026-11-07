"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Field,
  GENDER_OPTIONS,
  LabeledWithBadge,
  RequiredLabel,
  SeasonCheckboxes,
  Segmented,
  TextTextarea,
} from "@/base/form/form-ui";
import { INPUT_LIMITS, hasUnsafeMarkup } from "@/lib/safe-input";
import { CONTENT_VISIBILITY_LABEL } from "@/lib/visibility";

type Gender = "women" | "men" | "kids";
type Visibility = "public" | "private" | "limited";

function normalizeTag(raw: string) {
  return raw.replace(/^#+/, "").trim().slice(0, INPUT_LIMITS.tag);
}

function commitTags(draft: string, existing: string[]): string[] | null {
  const parts = draft
    .split(/[,、]+/)
    .map(normalizeTag)
    .filter((part) => part && !hasUnsafeMarkup(part));
  if (!parts.length) return null;
  const next = [...existing];
  for (const part of parts) {
    if (next.length >= 30) break;
    if (!next.includes(part)) next.push(part);
  }
  return next;
}

export function GenderField({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (next: Gender) => void;
}) {
  return (
    <Field label={<RequiredLabel>対象</RequiredLabel>}>
      <Segmented
        ariaLabel="対象"
        value={value}
        options={[...GENDER_OPTIONS]}
        onChange={onChange}
      />
    </Field>
  );
}

export function VisibilityField({
  value,
  onChange,
  includeLimited = false,
}: {
  value: Visibility;
  onChange: (next: Visibility) => void;
  includeLimited?: boolean;
}) {
  const options: { id: Visibility; label: string }[] = [
    { id: "public", label: CONTENT_VISIBILITY_LABEL.public },
    { id: "private", label: CONTENT_VISIBILITY_LABEL.private },
  ];
  if (includeLimited) {
    options.push({ id: "limited", label: "限定公開" });
  }
  const safeValue =
    value === "limited" && !includeLimited ? "private" : value;

  return (
    <Field label={<RequiredLabel>公開範囲</RequiredLabel>}>
      <Segmented
        ariaLabel="公開範囲"
        value={safeValue}
        options={options}
        onChange={onChange}
      />
    </Field>
  );
}

/** 対象 → 公開範囲（縦積み） */
export function AudienceFields({
  gender,
  visibility,
  onGenderChange,
  onVisibilityChange,
  includeLimited = false,
}: {
  gender: Gender;
  visibility: Visibility;
  onGenderChange: (next: Gender) => void;
  onVisibilityChange: (next: Visibility) => void;
  includeLimited?: boolean;
}) {
  return (
    <>
      <GenderField value={gender} onChange={onGenderChange} />
      <VisibilityField
        value={visibility}
        onChange={onVisibilityChange}
        includeLimited={includeLimited}
      />
    </>
  );
}

export function SeasonField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <Field label="季節">
      <SeasonCheckboxes value={value} onChange={onChange} />
    </Field>
  );
}

/** 帯結び・色調・日付など幅を抑える入力のラッパ */
export function CompactControl({ children }: { children: ReactNode }) {
  return <div className="max-w-[11.5rem]">{children}</div>;
}

export function TagField({
  value,
  onChange,
  showHashHint = true,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  showHashHint?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const tryCommit = (raw: string) => {
    const next = commitTags(raw, value);
    if (!next) return false;
    onChange(next);
    setDraft("");
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME 変換中の Enter / スペースは確定に使わない
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" || e.key === "," || e.key === "、") {
      e.preventDefault();
      tryCommit(draft);
      return;
    }
    if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <Field
      label={
        showHashHint ? (
          <span className="inline-flex flex-wrap items-baseline gap-2">
            タグ
            <span className="text-[11px] font-normal text-kr-muted">
              Enter / カンマで確定 · #は不要
            </span>
          </span>
        ) : (
          "タグ"
        )
      }
    >
      <div className="rounded-lg border border-kr-border bg-white px-2.5 py-2 focus-within:border-kr-navy/50 focus-within:ring-2 focus-within:ring-kr-navy/10">
        <ul className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="inline-flex items-center gap-1 rounded-md bg-kr-navy/8 px-2 py-1 text-xs font-medium text-kr-navy transition hover:bg-kr-navy/12"
                aria-label={`${tag}を外す`}
              >
                <span>#{tag}</span>
                <span className="text-kr-muted" aria-hidden>
                  ×
                </span>
              </button>
            </li>
          ))}
          <li className="min-w-[7rem] flex-1">
            <input
              value={draft}
              maxLength={INPUT_LIMITS.tag}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => {
                if (draft.trim()) tryCommit(draft);
              }}
              placeholder={value.length ? "" : "タグを入力"}
              className="w-full border-0 bg-transparent px-1 py-1 text-sm text-kr-text outline-none placeholder:text-kr-muted/70"
            />
          </li>
        </ul>
      </div>
    </Field>
  );
}

/**
 * お気に入り度 1〜5（星タップ）。
 * 同じ星を再タップで未設定。詳細表示の ★ と揃える。
 */
export function FavoriteRankStars({
  value,
  onChange,
}: {
  /** `"1"`〜`"5"`。空文字は未設定 */
  value: string;
  onChange: (next: string) => void;
}) {
  const n = Number(value);
  const rank =
    Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : 0;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="お気に入り度"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rank;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rank === star}
            aria-label={`${star}`}
            onClick={() => onChange(rank === star ? "" : String(star))}
            className={`min-h-11 min-w-11 text-2xl leading-none transition ${
              filled
                ? "text-kr-owner"
                : "text-kr-border hover:text-kr-muted"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

/** @deprecated FavoriteRankStars を使う */
export const FavoriteRankSlider = FavoriteRankStars;

/** 公開／非公開メモの上限（短文メモ想定。2,000は冗長） */
export const MEMO_MAX_LENGTH = 500;

export function MemoPairFields({
  memo1,
  memo2,
  onMemo1Change,
  onMemo2Change,
}: {
  memo1: string;
  memo2: string;
  onMemo1Change: (next: string) => void;
  onMemo2Change: (next: string) => void;
}) {
  return (
    <>
      <Field label="公開メモ">
        <TextTextarea
          value={memo1}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(e) => onMemo1Change(e.target.value)}
          placeholder={`みんなに見えるメモ（最大${MEMO_MAX_LENGTH.toLocaleString("ja-JP")}文字）`}
        />
      </Field>
      <Field
        label={<LabeledWithBadge badge="private">非公開メモ</LabeledWithBadge>}
      >
        <TextTextarea
          value={memo2}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(e) => onMemo2Change(e.target.value)}
          placeholder={`自分だけが見えるメモ（最大${MEMO_MAX_LENGTH.toLocaleString("ja-JP")}文字）`}
        />
      </Field>
    </>
  );
}
