import type { Metadata } from "next";
import Link from "next/link";
import {
  DuelIcon,
  FriendIcon,
  RadarIcon,
  RelatedLandingLinks,
  SeoLandingHeader,
  SeoSectionHeading,
} from "@/components/seo-landing-shared";
import { SITE_NAME } from "@/lib/site";

const pagePath = "/street-fighter-6-friend-boshu";
const pageTitle = `スト6のフレンド募集なら ${SITE_NAME} | 練習相手を探しやすいLP`;
const pageDescription =
  "スト6のフレンド募集や練習相手探し向けのランディングページです。ランク帯、時間帯、VC有無など、フレンド募集で見たい条件を視覚的にまとめています。";

const useCases = [
  {
    title: "同じくらいの強さで回したい",
    description: "ランク帯やMR付近の相手を探したい時の入口です。",
  },
  {
    title: "夜だけ軽く回せる相手がほしい",
    description: "時間帯で合う相手を探したい人向けの使い方です。",
  },
  {
    title: "通話なしで気軽に対戦したい",
    description: "プレイスタイルの相性を先に意識したい時に向いています。",
  },
];

const meters = [
  { label: "ランク帯の近さ", value: "高め", width: "78%" },
  { label: "時間帯の合わせやすさ", value: "見つけやすい", width: "70%" },
  { label: "募集の見返しやすさ", value: "一覧向き", width: "82%" },
  { label: "気軽さ", value: "高い", width: "74%" },
];

const steps = [
  { step: "01", title: "一覧を開く", body: "まずは今動いている募集をざっと見る" },
  { step: "02", title: "条件が近い相手を探す", body: "ランク帯や時間帯の相性で見る" },
  { step: "03", title: "登録して参加する", body: "気になる募集があればそのまま進む" },
];

const faqs = [
  {
    question: "フレンド募集にも使えますか？",
    answer: "はい。対戦相手だけでなく、継続して遊ぶ相手探しにも使えます。",
  },
  {
    question: "初心者でも見やすいですか？",
    answer: "はい。まずは一覧を見て、自分に近い募集を探す流れで始められます。",
  },
  {
    question: "通話ありなしの相性も気になります。",
    answer: "そうした条件も意識して相手を探したい人向けの導線です。",
  },
];

const relatedLinks = [
  {
    href: "/street-fighter-6-taisen-boshu",
    kicker: "対戦募集",
    label: "対戦募集LP",
    description: "全体の入り口をまとめたLPです。",
  },
  {
    href: "/street-fighter-6-coaching",
    kicker: "コーチング",
    label: "コーチングLP",
    description: "教えてほしい、教えたい探しに寄せたLPです。",
  },
  {
    href: "/street-fighter-6-replay-sodan",
    kicker: "リプレイ相談",
    label: "リプレイ相談LP",
    description: "試合後の振り返り導線に絞ったLPです。",
  },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "スト6 フレンド募集",
    "スト6 練習相手",
    "スト6 対戦仲間",
    "Street Fighter 6 フレンド募集",
    "スト6 一緒に練習",
  ],
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pagePath,
    type: "article",
    locale: "ja_JP",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/twitter-image"],
  },
};

export default function StreetFighter6FriendBoshuPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <section className="hero-banner px-6 py-6 md:px-10 md:py-8">
          <div className="relative z-10 space-y-10">
            <SeoLandingHeader eyebrow="Street Fighter 6 Friend Finder Landing" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.03]">
                    スト6のフレンド募集を、
                    <br />
                    条件で見やすくする
                    <br />
                    {SITE_NAME}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                    練習相手を探したい、同じくらいの相手と回したい、夜だけ気軽に遊びたい。
                    フレンド募集で見たい条件を、読み物ではなくカードでつかめるようにしたLPです。
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-white/72">
                  {["ランク帯", "時間帯", "VCありなし", "長く遊べる相手"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/12 bg-white/8 px-3 py-2"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/board" className="primary-action w-auto min-w-[13rem]">
                    フレンド募集を見る
                  </Link>
                  <Link href="/auth" className="secondary-action min-w-[11rem]">
                    無料で登録する
                  </Link>
                </div>
              </div>

              <div className="hero-card rounded-[2rem] p-5 md:p-6">
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="display text-xs text-[var(--accent-soft)]">FRIEND BOARD SIGNAL</p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                        練習相手の見つけ方
                      </h2>
                    </div>
                    <FriendIcon />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      "ランク帯が近い相手",
                      "夜に回せる相手",
                      "サブキャラ練習仲間",
                      "VCなしで気軽に回す",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/82"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(7,14,21,0.62)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/46">SEARCH SIGNAL</p>
                        <p className="mt-2 text-sm text-white/74">探す時に見たい条件がまとまる</p>
                      </div>
                      <RadarIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SeoSectionHeading
            kicker="Best Use Cases"
            title="こういうフレンド募集に向いています"
            description="遊び方の相性を先にイメージしやすいよう、使い方を3パターンに絞って見せます。"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {useCases.map((item) => (
              <article key={item.title} className="lp-visual-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">USE CASE</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <DuelIcon className="h-10 w-10 text-[var(--accent-soft)]" />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
          <div className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-6">
              <SeoSectionHeading
                kicker="What To Check"
                title="フレンド募集で見たい条件をまとめる"
                description="見落としやすい条件を、メーターとチップでさっと確認できる形にしています。"
              />

              <div className="space-y-4">
                {meters.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-xs uppercase tracking-[0.16em] text-[var(--accent-soft)]">
                        {item.value}
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#1f6feb,#8fd3ff)]"
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-5">
              <p className="display text-sm text-[var(--accent-soft)]">BOARD SNAPSHOT</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                見返しやすい募集の形
              </h2>

              <div className="space-y-3">
                {[
                  {
                    title: "夜に2先で回したい人募集",
                    meta: "ダイヤ帯 / 22時から / VCなし",
                  },
                  {
                    title: "週末に長めに遊べるフレンド募集",
                    meta: "マスター帯 / 土日中心",
                  },
                  {
                    title: "サブキャラ練習仲間を探したい",
                    meta: "カジュアル寄り / 1時間程度",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[1.4rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-xs leading-6 text-white/62">{item.meta}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </section>

        <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <SeoSectionHeading
              kicker="How To Start"
              title="始め方は3ステップ"
              description="まずは読むより見る、を優先した短い流れです。"
            />

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((item) => (
                <article key={item.step} className="lp-step-card">
                  <div className="lp-step-badge">{item.step}</div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
          <div className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-4">
              <SeoSectionHeading
                kicker="FAQ"
                title="フレンド募集で気になる点"
                description="短く確認できる形でよくある質問だけ残しています。"
              />

              <div className="grid gap-4">
                {faqs.map((item) => (
                  <article
                    key={item.question}
                    className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-5"
                  >
                    <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-5">
              <p className="display text-sm text-[var(--accent-soft)]">Next Step</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                募集一覧から探す
              </h2>
              <p className="text-sm leading-7 text-[var(--muted)] md:text-base">
                今出ている募集を見て、自分の遊び方に近い相手を探すのが最短です。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/board" className="primary-action w-auto min-w-[13rem]">
                  募集一覧へ
                </Link>
                <Link href="/auth" className="secondary-action min-w-[11rem]">
                  無料で登録
                </Link>
              </div>
            </div>
          </section>
        </section>

        <RelatedLandingLinks
          title="他の検索意図向けLPも用意"
          description="同じドメイン内で別の探し方に寄せたLPにもつなげています。"
          links={relatedLinks}
        />
      </section>
    </main>
  );
}
