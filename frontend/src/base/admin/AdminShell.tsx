import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/base/admin/AdminNav";

type Props = {
  children: ReactNode;
  /** 画面見出し（参考UI同様、セクション側が主なので控えめ） */
  title?: string;
  description?: string;
};

/**
 * 運営管理シェル。
 * 参考: 上ナビ＋白／薄灰カード。アクセントはテーマの navy。
 */
export function AdminShell({ children, title, description }: Props) {
  return (
    <div className="admin-ui min-h-full bg-[#f5f5f5] text-[15px] text-kr-text">
      <header className="border-b border-kr-border bg-white">
        <div className="relative mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-5">
          <Link
            href="/"
            className="absolute right-3 top-4 text-[13px] text-slate-600 underline-offset-2 hover:text-kr-navy hover:underline sm:right-6 sm:top-5"
          >
            サイトへ
          </Link>
          <div className="text-center text-kr-navy">
            <p className="text-xs font-semibold tracking-wide sm:text-sm">
              きものレシピ
            </p>
            <p className="mt-0.5 font-bold leading-none" style={{ fontSize: 23 }}>
              管理
            </p>
          </div>
          <div className="mt-3">
            <AdminNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-6">
        {title ? (
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-kr-text">{title}</h1>
            {description ? (
              <p className="mt-1 text-[14px] text-slate-600">{description}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
