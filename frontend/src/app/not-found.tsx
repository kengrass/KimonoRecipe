import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container-kr py-16 text-center">
      <h1 className="mb-3 text-2xl font-bold">ページが見つかりません</h1>
      <p className="mb-6 text-sm text-kr-muted">
        ページが存在しないか、公開されていないコンテンツです。
      </p>
      <Link href="/" className="text-kr-link hover:underline">
        トップへ戻る
      </Link>
    </div>
  );
}
