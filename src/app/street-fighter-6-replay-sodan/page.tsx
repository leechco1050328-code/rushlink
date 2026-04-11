import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardIcon,
  RelatedLandingLinks,
  ReplayIcon,
  SeoLandingHeader,
  SeoSectionHeading,
} from "@/components/seo-landing-shared";
import { SITE_NAME } from "@/lib/site";

const pagePath = "/street-fighter-6-replay-sodan";
const pageTitle = `スト6のリプレイ相談なら ${SITE_NAME} | リプレイIDで振り返るLP`;
const pageDescription =
  "スト6のリプレイ相談、リプレイ添削、リプレイIDを使った振り返り向けのLPです。試合後の課題整理から、次の練習メニューまでつなげる流れを見やすくまとめています。";

const reviewPoints = [
  { title: "立ち回り", body: "何を振るべきだったか、止まる位置が合っていたかを見直す。" },
  { title: "対空と守り", body: "飛びや暴れへの対応が合っていたかを確認する。" },
  { title: "起き攻め", body: "攻め継続や読み合いの組み立てを整理する。" },
];

const compareRows = [
  {
    topic: "感覚だけで終わらせたくない",
    withoutReplay: "言語化しづらい",
    withReplay: "リプレイIDを軸に話しやすい",
  },
  {
    topic: "どこで崩れたか知りたい",
    withoutReplay: "曖昧になりやすい",
    withReplay: "試合単位で切り出しやすい",
  },
  {
    topic: "次の練習につなげたい",
    withoutReplay: "課題が散らばりやすい",
    withReplay: "改善点を絞りやすい",
  },
];

const steps = [
  { step: "01", title: "リプレイIDを用意", body: "見てほしい試合を選ぶ" },
  { step: "02", title: "相談ポイントを書く", body: "何を見てほしいか一言で添える" },
  { step: "03", title: "次の練習に落とす", body: "改善点を1つ持ち帰る" },
];

const faqs = [
  {
    question: "1試合だけでも相談できますか？",
    answer: "はい。まずは1試合を切り出して相談する形が向いています。",
  },
  {
    question: "何を聞けばいいか分からない時は？",
    answer: "困った場面を1つだけ選んで書くと進めやすいです。",
  },
  {
    question: "対戦募集とは別に使えますか？",
    answer: "はい。試合後の振り返りに絞って使えるLPです。",
  },
];

const relatedLinks = [
  {
    href: "/street-fighter-6-taisen-boshu",
    kicker: "対戦募集",
    label: "対戦募集LP",
    description: "対戦相手探しから入りたい人向けです。",
  },
  {
    href: "/street-fighter-6-friend-boshu",
    kicker: "フレンド募集",
    label: "フレンド募集LP",
    description: "継続して遊ぶ相手探しに寄せたLPです。",
  },
  {
    href: "/street-fighter-6-coaching",
    kicker: "コーチング",
    label: "コーチングLP",
    description: "教わりたい内容を整理したい人向けです。",
  },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "スト6 リプレイ相談",
    "スト6 リプレイ 添削",
    "スト6 リプレイID 相談",
    "Street Fighter 6 replay review",
    "スト6 試合 振り返り",
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

export default function StreetFighter6ReplaySodanPage() {
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
            <SeoLandingHeader eyebrow="Street Fighter 6 Replay Review Landing" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] lg:items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.03]">
                    スト6のリプレイ相談を、
                    <br />
                    試合後すぐ使える
                    <br />
                    流れにするLP
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                    リプレイIDをもとに、どこで崩れたか、何を直すかを整理するためのページです。
                    感覚だけで終わらせず、次の練習へつなげることを前提にしています。
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/replay-review" className="primary-action w-auto min-w-[13rem]">
                    リプレイ相談を見る
                  </Link>
                  <Link href="/auth" className="secondary-action min-w-[11rem]">
                    無料で登録する
                  </Link>
                </div>
              </div>

              <div className="hero-card rounded-[2rem] p-5 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="display text-xs text-[var(--accent-soft)]">REPLAY LAB</p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                        相談の見え方
                      </h2>
                    </div>
                    <ReplayIcon />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { title: "INPUT", body: "リプレイIDを貼る" },
                      { title: "REVIEW", body: "見てほしい点を書く" },
                      { title: "NEXT", body: "次の課題にする" },
                    ].map((item) => (
                      <article
                        key={item.title}
                        className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-white/46">{item.title}</p>
                        <p className="mt-3 text-sm font-semibold text-white">{item.body}</p>
                      </article>
                    ))}
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(7,14,21,0.62)] p-4">
                    <p className="text-sm text-white/76">
                      例: 対空が遅れた試合を見てほしい / 起き攻めの選択が合っていたか確認したい
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SeoSectionHeading
            kicker="Review Points"
            title="リプレイ相談で見たいポイント"
            description="試合後の振り返りが散らからないよう、見る軸を先に3つに分けています。"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {reviewPoints.map((point) => (
              <article key={point.title} className="lp-visual-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">REVIEW</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{point.title}</h3>
                  </div>
                  <ClipboardIcon className="h-10 w-10 text-[var(--accent-soft)]" />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{point.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
          <div className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-6">
              <SeoSectionHeading
                kicker="Why Replay"
                title="リプレイIDがあると相談しやすい理由"
                description="感覚だけで終わる時と、試合を基準に見られる時の違いを表で見せます。"
              />

              <div className="overflow-hidden rounded-[1.6rem] border border-white/10">
                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(110px,0.8fr)_minmax(120px,0.9fr)] bg-white/6 text-xs uppercase tracking-[0.2em] text-white/54">
                  <div className="px-4 py-3">見たいこと</div>
                  <div className="px-4 py-3">リプレイなし</div>
                  <div className="px-4 py-3">リプレイあり</div>
                </div>
                {compareRows.map((row) => (
                  <div
                    key={row.topic}
                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(110px,0.8fr)_minmax(120px,0.9fr)] border-t border-white/10 bg-[rgba(255,255,255,0.03)] text-sm"
                  >
                    <div className="px-4 py-4 text-white/82">{row.topic}</div>
                    <div className="px-4 py-4 text-white/54">{row.withoutReplay}</div>
                    <div className="px-4 py-4 text-[var(--accent-soft)]">{row.withReplay}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-5">
              <p className="display text-sm text-[var(--accent-soft)]">LAB SNAPSHOT</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                試合後のメモを短く保つ
              </h2>

              <div className="space-y-3">
                {[
                  "見てほしい試合: 2本目",
                  "確認したい点: 対空が遅れた場面",
                  "次にやること: 対空練習を重点化",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4 text-sm text-white/78"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>

        <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <SeoSectionHeading
              kicker="How To Start"
              title="流れは3ステップ"
              description="試合後すぐに使えるように、流れを短くしています。"
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
                title="リプレイ相談で気になる点"
                description="最初に引っかかりやすい点だけ短く確認できます。"
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
                リプレイ相談一覧を開く
              </h2>
              <p className="text-sm leading-7 text-[var(--muted)] md:text-base">
                相談の雰囲気を掴むには、まず一覧を見るのが早いです。必要ならそのまま登録して進めます。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/replay-review" className="primary-action w-auto min-w-[13rem]">
                  リプレイ相談へ
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
          description="対戦相手探しやコーチング相談に寄せたLPへもつなげています。"
          links={relatedLinks}
        />
      </section>
    </main>
  );
}
