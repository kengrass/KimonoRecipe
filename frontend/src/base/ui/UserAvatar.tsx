"use client";

type Props = {
  name: string;
  seed?: string;
  /** あれば写真アバター。なければイニシャル仮アバター */
  src?: string | null;
  className?: string;
};

/** 名前から安定した色相を決める */
function hueFromSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) % 360;
  }
  return h;
}

/** ユーザーアバター（CDN画像 or 名前ベースの仮） */
export function UserAvatar({ name, seed, src, className = "" }: Props) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 外部アバター想定
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  const key = seed || name;
  const hue = hueFromSeed(key);
  const bg = `hsl(${hue} 32% 78%)`;
  const fg = `hsl(${hue} 40% 28%)`;
  const initial = name.trim().slice(0, 1) || "?";

  return (
    <span
      className={`relative flex items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ background: bg, color: fg }}
      aria-hidden
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full opacity-35"
        fill="currentColor"
      >
        <circle cx="20" cy="15" r="7" />
        <path d="M6 36c0-8 6.3-13 14-13s14 5 14 13" />
      </svg>
      <span className="relative z-10 text-sm font-semibold leading-none">
        {initial}
      </span>
    </span>
  );
}
