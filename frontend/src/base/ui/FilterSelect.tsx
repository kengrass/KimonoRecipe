"use client";

const CLEAR = "__clear__";

type Props = {
  label: string;
  value: string;
  /** 未選択扱いする値（検索の gender=all など）。省略時は空文字 */
  unsetValue?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
};

/**
 * 外側ラベルなしのセレクト。
 * 未選択時はプレースホルダ文言、解除は「すべて」。
 * 検索フィルタ・紐付けダイアログで共通。
 */
export function FilterSelect({
  label,
  value,
  unsetValue = "",
  onChange,
  options,
  className = "",
}: Props) {
  const isUnset = value === unsetValue;
  const selectValue = isUnset ? "" : value;

  return (
    <label className={`relative block min-w-0 flex-1 ${className}`.trim()}>
      <span className="sr-only">{label}</span>
      <select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "" || next === CLEAR) onChange(unsetValue);
          else onChange(next);
        }}
        className={`w-full appearance-none rounded border border-kr-border bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-kr-navy ${
          isUnset ? "text-kr-muted" : "text-kr-text"
        }`}
      >
        <option value="" disabled hidden>
          {label}
        </option>
        <option value={CLEAR}>すべて</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-kr-muted"
        aria-hidden
      >
        ▾
      </span>
    </label>
  );
}
