import { LARAVEL_ORIGIN } from "@/lib/config";

const FOOTER_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: `${LARAVEL_ORIGIN}/terms.html`, label: "利用規約", external: true },
  {
    href: `${LARAVEL_ORIGIN}/privacy.html`,
    label: "プライバシー",
    external: true,
  },
  { href: "https://grass.vc/", label: "運営会社", external: true },
  {
    href: "https://blog.kimonorecipe.com/how-to-use/",
    label: "ご利用方法",
    external: true,
  },
];

/** Next 用フッター */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-kr-border bg-white py-8 text-center text-sm text-kr-muted">
      <div className="container-kr flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-4">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-kr-text"
              {...(link.external
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
            >
              {link.label}
            </a>
          ))}
        </div>
        <p>© Copyright Kimono Recipe All rights reserved.</p>
      </div>
    </footer>
  );
}
