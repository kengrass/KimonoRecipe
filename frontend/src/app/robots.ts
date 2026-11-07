import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/** 公開クローラ向け。ログイン専用・設定は遮断。 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/likes",
        "/following",
        "/compose",
        "/settings",
        "/login",
        "/regist",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
