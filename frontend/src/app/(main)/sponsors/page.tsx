import type { Metadata } from "next";
import Link from "next/link";
import { APP_ROUTES, LARAVEL } from "@/lib/laravel-urls";

export const metadata: Metadata = {
  title: "協賛について",
  description:
    "きものレシピの協賛について。活動にご理解いただいている事業者さまのロゴ掲載と、お申し込みのご案内。",
};

const COMPANY_HREF = "https://grass.vc/";

/** 公開向け：協賛の説明と申し込み導線 */
export default function SponsorsAboutPage() {
  return (
    <div className="container-kr max-w-2xl py-10">
      <p className="text-[11px] font-medium tracking-wide text-kr-muted">
        <Link href={APP_ROUTES.home} className="hover:text-kr-text">
          トップ
        </Link>
        <span className="mx-1.5 text-kr-border">/</span>
        協賛について
      </p>

      <h1 className="mt-3 text-2xl font-bold text-kr-text">協賛について</h1>
      <p className="mt-3 text-sm leading-relaxed text-kr-muted">
        きものレシピは、着物・浴衣のコーデやアイテムを記録・共有する場です。協賛は、その活動を支えてくださる事業者さまをご紹介する枠です。
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-bold text-kr-text">協賛とは</h2>
        <p className="text-sm leading-relaxed text-kr-text">
          きものレシピの活動にご理解いただいている事業者さまです。サイト下部にロゴを掲載し、利用者のみなさまへ信頼あるご紹介をしています。売り込みのためのバナー広告とは別の、看板としての掲載です。
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-bold text-kr-text">掲載の考え方</h2>
        <p className="text-sm leading-relaxed text-kr-text">
          各カテゴリ原則1社とし、同じ領域で並ばないようにしています。枠は商材ではなく、利用者の暮らしに近い役割で分けています。
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-kr-text">
          <li>加工・ケア（はっ水・ガードなど）</li>
          <li>クリーニング・悉皆</li>
          <li>メーカー・ブランド</li>
          <li>小売・呉服店</li>
          <li>着付け・教室</li>
        </ul>
        <p className="text-sm leading-relaxed text-kr-muted">
          卸売など、利用者向けには見えにくい役割のご相談も受け付けています。掲載数は抑えめにし、看板としての見やすさを大切にします。
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-bold text-kr-text">お申し込み</h2>
        <p className="text-sm leading-relaxed text-kr-text">
          空き枠のご確認、掲載条件、お申し込みは運営会社までお問い合わせください。
        </p>
        <p>
          <a
            href={COMPANY_HREF}
            className="text-sm font-medium text-kr-link hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            運営会社へ問い合わせる
          </a>
        </p>
      </section>

      <p className="mt-10 text-sm text-kr-muted">
        <Link
          href={LARAVEL.about}
          className="hover:text-kr-text"
          target="_blank"
          rel="noreferrer"
        >
          きものレシピについて
        </Link>
      </p>
    </div>
  );
}
