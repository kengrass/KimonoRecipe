import type { Metadata } from "next";
import { RootProviders } from "@/base/dev/RootProviders";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getSiteUrl,
  siteDefaultOgImages,
} from "@/lib/seo";
import "./globals.css";

const defaultOgImages = siteDefaultOgImages();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: defaultOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: defaultOgImages.map((i) => i.url),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="flex min-h-full flex-col font-sans antialiased">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
