import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/base/auth/AuthForm";
import { PageShell } from "@/base/PageShell";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "新規登録",
  robots: NOINDEX_ROBOTS,
};

export default function RegistPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-8 sm:py-10">
        <h1 className="text-lg font-semibold text-kr-text">新規登録</h1>
        <p className="mt-1 text-sm text-kr-muted">
          無料でメンバー登録できます。
        </p>
        <div className="mt-5">
          <Suspense fallback={<p className="text-sm text-kr-muted">読み込み中…</p>}>
            <AuthForm mode="regist" />
          </Suspense>
        </div>
      </div>
    </PageShell>
  );
}
