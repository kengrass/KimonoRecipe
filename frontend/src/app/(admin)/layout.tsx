import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "運営管理",
    template: "%s | 運営管理",
  },
  robots: { index: false, follow: false },
};

/** Next SiteChrome を使わない運営管理レイアウト */
export default function AdminGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
