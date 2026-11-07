import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** メイン上の補助ブロック（プロフィール紹介など） */
  aside?: ReactNode;
  className?: string;
};

/** Next のページ本体割り付け（1カラム） */
export function PageShell({ children, aside, className = "" }: Props) {
  return (
    <div className={`page-shell ${className}`.trim()}>
      {aside ? <div className="mb-5 pb-1">{aside}</div> : null}
      <div className="page-shell__main">{children}</div>
    </div>
  );
}

/** @deprecated `PageShell` を使う。別名互換 */
export const PageWithSidebar = PageShell;
