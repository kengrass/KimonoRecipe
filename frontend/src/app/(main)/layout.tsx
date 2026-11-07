import type { ReactNode } from "react";
import { SiteChrome } from "@/base/shell/SiteChrome";

/** Next レイアウト */
export default function MainLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
