/** シェア（紙飛行機）アイコン — ボタン／骨格で共用 */
export function ShareIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M22 2L15 22l-4-9-9-4 20-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
