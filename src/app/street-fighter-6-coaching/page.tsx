import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardIcon,
  CoachIcon,
  RelatedLandingLinks,
  ReplayIcon,
  SeoLandingHeader,
  SeoSectionHeading,
} from "@/components/seo-landing-shared";
import { SITE_NAME } from "@/lib/site";

const pagePath = "/street-fighter-6-coaching";
const pageTitle = `スト6のコーチング相談なら ${SITE_NAME} | 教えてほしい人向けLP`;
const pageDescription =
  "スト6のコーチング相談、教えてほしい相手探し、教えたい募集向けのLPです。相談前に整理しておきたい情報や、教わりたいテーマを見やすくまとめています。";

const topics = [
  { title: "立ち回り", body: "何を振るか、どこで止めるかを整理したい時向けです。" },
  { title: "守り方", body: "対空、暴れ、投げ抜けなど守備面を見てもらいたい時向けです。" },
  { title: "起き攻め", body: "セットプレイや攻め継続を詰めたい時に向いています。" },
  { title: "練習メニュー", body: "次に何を練習するかを決めたい時に使えます。" },
];

const prepCards = [
  "今困っている場面を1つに絞る",
  "キャラとランク帯を先に書く",
  "教わりたいテーマを短く書く",
  "必要ならリプレイ相談にもつなげる",
];

const steps = [
  { step: "01", title: "教わりたい内容を決める", body: "まずはテーマを1つに絞る" },
  { step: "02", title: "相手を探す", body: "教えたい / 教わりたい募集を見る" },
  { step: "03", title: "練習に落とし込む", body: "相談後に次の課題へつなげる" },
];

const faqs = [
  {
    question: "初心者でもコーチング相談できますか？",
    answer: "はい。最初は広く書かず、1つ困りごとを決めて相談する形が向いています。",
  },
  {
    question: "教える側の募集にもつながりますか？",
    answer: "はい。教えたい / 教わりたいの両方を意識した導線です。",
  },
  {
    question: "リプレイを見てもらう流れもありますか？",
    answer: "はい。必要ならリプレイ相談ページへそのまま進めます。",
  },
];

const relatedLinks = [
  {
    href: "/street-fighter-6-taisen-boshu",
    kicker: "対戦募集",
    label: "対戦募集LP",
    description: "対戦相手探しの入口をまとめたLPです。",
  },
  {
    href: "/street-fighter-6-friend-boshu",
    kicker: "フレンド募集",
    label: "フレンド募集LP",
    description: "継続して遊ぶ相手を探す意図向けのLPです。",
  },
  {
    href: "/street-fighter-6-replay-sodan",
    kicker: "リプレイ相談",
    label: "リプレイ相談LP",
    description: "試合後の振り返りに寄せたLPです。",
  },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "スト6 コーチング",
    "スト6 教えてほしい",
    "スト6 教えてくれる人",
    "Street Fighter 6 coaching",
    "スト6 初心者 コーチング",
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

export default function StreetFighter6CoachingPage() {
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
            <SeoLandingHeader eyebrow="Street Fighter 6 Coaching Landing" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] lg:items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.03]">
                    スト6のコーチング相談を、
                    <br />
                    重たくしすぎず
                    <br />
                    始めやすくするLP
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                    何を教わりたいかを整理し、教えてくれる相手や相談の入口につなげるページです。
                    広すぎる悩みを、相談しやすい単位に整えることを重視しています。
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "テーマ", value: "1つに絞る" },
                    { label: "入口", value: "教える / 教わる" },
                    { label: "発展", value: "リプレイ相談" },
                  ].map((item) => (
                    <div key={item.label} className="lp-stat-tile">
                      <dt className="text-xs uppercase tracking-[0.22em] text-white/48">{item.label}</dt>
                      <dd className="mt-2 text-2xl font-bold text-white">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-wrap gap-3">
                  <Link href="/board?purpose=coaching" className="primary-action w-auto min-w-[13rem]">
                    教わりたい募集を見る
                  </Link>
                  <Link href="/replay-review" className="secondary-action min-w-[11rem]">
                    リプレイ相談へ
                  </Link>
                </div>
              </div>

              <div className="hero-card rounded-[2rem] p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-[1.6rem] border border-[var(--secondary)]/22 bg-[rgba(255,179,91,0.08)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--secondary)]">LEARNER</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">教わりたい側</h2>
                      </div>
                      <CoachIcon />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-white/76">
                      <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-3">
                        守り方を見てほしい
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-3">
                        起き攻めを整理したい
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-3">
                        何を練習すべきか決めたい
                      </div>
                    </div>
                  </article>

                  <article className="rounded-[1.6rem] border border-white/10 bg-white/6 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-soft)]">OPTION</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">相談を深める導線</h2>
                      </div>
                      <ReplayIcon />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-white/76">
                      <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-3">
                        試合後はリプレイ相談へ
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-3">
                        1テーマずつ詰める
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-3">
                        次の練習メニューに落とす
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SeoSectionHeading
            kicker="Focus Topics"
            title="相談テーマを先に絞りやすくする"
            description="何でも相談する形ではなく、まずどの軸で見てもらうかを整理できるようにしています。"
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {topics.map((topic) => (
              <article key={topic.title} className="lp-visual-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">TOPIC</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{topic.title}</h3>
                  </div>
                  <ClipboardIcon className="h-10 w-10 text-[var(--secondary)]" />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{topic.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
          <div className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-6">
              <SeoSectionHeading
                kicker="Before Posting"
                title="相談前に整理しておくと進みやすいこと"
                description="相談相手に伝える情報を、短いメモの単位で並べています。"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {prepCards.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.4rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4 text-sm text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-5">
              <p className="display text-sm text-[var(--accent-soft)]">COACHING NOTE</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                相談メモの形を先に見る
              </h2>

              <div className="rounded-[1.7rem] border border-white/10 bg-[rgba(7,14,21,0.62)] p-4">
                <div className="space-y-3">
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78">
                    キャラ: ジュリ / ランク帯: ダイヤ
                  </div>
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78">
                    相談テーマ: 守り方と対空を見てほしい
                  </div>
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78">
                    補足: 可能ならリプレイ相談にも進みたい
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <SeoSectionHeading
              kicker="How It Flows"
              title="相談から練習までの流れ"
              description="教わるだけで終わらず、次の練習につなげる流れを前提にしています。"
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
                title="コーチング相談で気になる点"
                description="最初に迷いやすいことだけ、短く確認できます。"
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
                まずは相談入口を見る
              </h2>
              <p className="text-sm leading-7 text-[var(--muted)] md:text-base">
                教えてほしいテーマが決まったら、募集一覧かリプレイ相談から入るのが分かりやすいです。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/board?purpose=coaching" className="primary-action w-auto min-w-[13rem]">
                  教わりたい募集へ
                </Link>
                <Link href="/replay-review" className="secondary-action min-w-[11rem]">
                  リプレイ相談へ
                </Link>
              </div>
            </div>
          </section>
        </section>

        <RelatedLandingLinks
          title="他の検索意図向けLPも用意"
          description="対戦相手探しやリプレイ相談に寄せたLPへもつなげています。"
          links={relatedLinks}
        />
      </section>
    </main>
  );
}
