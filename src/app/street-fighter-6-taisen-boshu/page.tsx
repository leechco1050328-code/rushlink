import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SITE_NAME } from "@/lib/site";

const pagePath = "/street-fighter-6-taisen-boshu";
const pageTitle = `スト6の対戦募集なら ${SITE_NAME} | MR帯・目的別に相手を探せる`;
const pageDescription =
  "スト6の対戦募集、教えたい・教わりたい募集、リプレイIDを使った相談まで1か所で探せるページです。Street Fighter 6 で同じくらいのランク帯や目的に合う相手を見つけたい人向けにまとめました。";

const routes = [
  {
    label: "対戦募集",
    title: "今すぐ回せる相手を探す",
    description: "募集一覧から、動いている投稿をすぐ見つける導線です。",
    detail: "一覧を見る",
    Icon: DuelIcon,
  },
  {
    label: "教わりたい",
    title: "練習の目的が合う相手を探す",
    description: "教えてほしい、教えたいの目的別で探しやすくしています。",
    detail: "目的で選ぶ",
    Icon: CoachIcon,
  },
  {
    label: "リプレイ相談",
    title: "試合後に改善ポイントを詰める",
    description: "リプレイIDを使って、立ち回りやセットプレイを相談できます。",
    detail: "相談へ進む",
    Icon: ReplayIcon,
  },
];

const compareRows = [
  {
    topic: "今動いている募集を探したい",
    social: "投稿が流れやすい",
    rushLink: "一覧で見返しやすい",
  },
  {
    topic: "目的が合う相手を探したい",
    social: "文面を読まないと分かりにくい",
    rushLink: "対戦・教わりたい導線で分かれる",
  },
  {
    topic: "試合後に相談もしたい",
    social: "別の場所へ移動しがち",
    rushLink: "リプレイ相談につなげやすい",
  },
];

const steps = [
  {
    step: "01",
    title: "一覧で探す",
    description: "まずは今出ている募集を見る",
  },
  {
    step: "02",
    title: "目的で選ぶ",
    description: "対戦、教わりたい、相談の流れを選ぶ",
  },
  {
    step: "03",
    title: "登録して参加",
    description: "気になる募集があればそのまま進む",
  },
];

const faqs = [
  {
    question: "どんな人向けですか？",
    answer: "対戦相手、練習相手、相談相手をまとめて探したい人向けです。",
  },
  {
    question: "一覧を見るだけでも使えますか？",
    answer: "はい。まずは募集一覧を見て雰囲気を確認できます。",
  },
  {
    question: "対戦後の振り返りにも使えますか？",
    answer: "はい。リプレイIDを使った相談ページへそのまま進めます。",
  },
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "スト6 対戦募集",
    "Street Fighter 6 対戦募集",
    "スト6 フレンド募集",
    "スト6 教えてほしい",
    "スト6 コーチング",
    "MR 対戦募集",
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

function DuelIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 text-[var(--accent-soft)]" aria-hidden="true">
      <rect x="6" y="10" width="14" height="24" rx="5" fill="currentColor" fillOpacity="0.2" />
      <rect x="28" y="14" width="14" height="24" rx="5" fill="currentColor" fillOpacity="0.38" />
      <path
        d="M18 22h12m-9-6l3 6-3 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoachIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 text-[var(--secondary)]" aria-hidden="true">
      <path
        d="M10 14c0-2.2 1.8-4 4-4h20c2.2 0 4 1.8 4 4v12c0 2.2-1.8 4-4 4H24l-7 6v-6h-3c-2.2 0-4-1.8-4-4V14Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18 18h12m-12 6h8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 text-[var(--accent-soft)]" aria-hidden="true">
      <circle cx="24" cy="24" r="16" fill="currentColor" fillOpacity="0.16" />
      <path
        d="M21 18.5 31 24l-10 5.5v-11Z"
        fill="currentColor"
        fillOpacity="0.86"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M13 17.5a14 14 0 0 1 24-4.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="display text-sm text-[var(--accent-soft)]">{kicker}</p>
      <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
      <p className="text-sm leading-7 text-[var(--muted)] md:text-base">{description}</p>
    </div>
  );
}

function RouteMap() {
  return (
    <div className="hero-card rounded-[2rem] p-5 md:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display text-xs text-[var(--accent-soft)]">MATCH FLOW</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">3つの入口</h2>
          </div>
          <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/68">
            見る → 選ぶ → 参加
          </div>
        </div>

        <div className="lp-route-shell space-y-3">
          {routes.map((route, index) => (
            <article key={route.title} className="lp-route-card">
              <div className="lp-route-index">{index + 1}</div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/52">{route.label}</p>
                  <h3 className="text-lg font-semibold text-white">{route.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted)]">{route.description}</p>
                </div>
                <route.Icon />
              </div>
              <div className="mt-4 inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/74">
                {route.detail}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function BoardPreview() {
  return (
    <div className="panel rounded-[30px] p-5 md:p-6">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="display text-xs text-[var(--accent-soft)]">BOARD PREVIEW</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">一覧で見える形</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/72">
            <span className="lp-mini-chip">対戦募集</span>
            <span className="lp-mini-chip">教わりたい</span>
            <span className="lp-mini-chip">リプレイ相談</span>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(6,12,18,0.56)] p-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            <span className="lp-search-token">MR 1600-1800</span>
            <span className="lp-search-token">夜帯</span>
            <span className="lp-search-token">BO3</span>
          </div>

          <div className="mt-4 space-y-3">
            {[
              {
                label: "対戦募集",
                title: "仕事後に2先で回したい人募集",
                meta: "MR 1700付近 / 21:00以降",
              },
              {
                label: "教わりたい",
                title: "守り方を見てくれる人を探したい",
                meta: "ダイヤ帯 / 立ち回り相談",
              },
              {
                label: "リプレイ相談",
                title: "リプレイIDあり、起き攻めを確認したい",
                meta: "試合後の振り返り向け",
              },
            ].map((item) => (
              <article key={item.title} className="lp-mock-post">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span className="lp-mini-chip">{item.label}</span>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs leading-6 text-white/62">{item.meta}</p>
                  </div>
                  <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/8" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StreetFighter6TaisenBoshuPage() {
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
            <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <Image
                    src="/logo-white.svg"
                    alt="Rush Link"
                    width={400}
                    height={120}
                    priority
                    className="h-10 w-auto md:h-12"
                  />
                  <span className="pill-button rounded-full border border-[var(--secondary)]/35 bg-[var(--secondary)]/12 px-3 py-1 text-xs text-[var(--secondary)]">
                    Beta
                  </span>
                </Link>
                <p className="display text-sm text-[var(--accent-soft)]">
                  Street Fighter 6 Matchmaking Landing Page
                </p>
              </div>
              <SiteNav invert />
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.03]">
                    スト6の対戦募集を、
                    <br />
                    読み込まなくても
                    <br />
                    探しやすくするページ
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                    対戦したい、教わりたい、試合後に相談したい。
                    Rush Link ならその3つを別々の入口で見られます。
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "3", label: "入口" },
                    { value: "一覧", label: "見返しやすさ" },
                    { value: "相談", label: "試合後も継続" },
                  ].map((item) => (
                    <div key={item.label} className="lp-stat-tile">
                      <dt className="text-xs uppercase tracking-[0.22em] text-white/48">{item.label}</dt>
                      <dd className="mt-2 text-3xl font-bold text-white">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-wrap gap-3">
                  <Link href="/board" className="primary-action w-auto min-w-[13rem]">
                    募集一覧を見る
                  </Link>
                  <Link href="/auth" className="secondary-action min-w-[11rem]">
                    無料で登録する
                  </Link>
                  <Link
                    href="/replay-review"
                    className="pill-button min-h-[3.2rem] min-w-[11rem] rounded-full border border-white/18 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors hover:bg-white/14"
                  >
                    リプレイ相談を見る
                  </Link>
                </div>
              </div>

              <RouteMap />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            kicker="Three Routes"
            title="使い方を3枚で把握できる構成"
            description="長い説明を読む代わりに、どの入口から使うかをカードで見分けられるようにしました。"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {routes.map((route) => (
              <article key={route.title} className="lp-visual-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">{route.label}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{route.title}</h3>
                  </div>
                  <route.Icon />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{route.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
          <div className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-6">
              <SectionHeading
                kicker="Quick Comparison"
                title="SNSより見やすい点を表で整理"
                description="どこが違うのかを文章ではなく比較表で確認できるようにしています。"
              />

              <div className="overflow-hidden rounded-[1.6rem] border border-white/10">
                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(110px,0.8fr)_minmax(120px,0.9fr)] bg-white/6 text-xs uppercase tracking-[0.2em] text-white/54">
                  <div className="px-4 py-3">見たいこと</div>
                  <div className="px-4 py-3">SNS</div>
                  <div className="px-4 py-3">Rush Link</div>
                </div>
                {compareRows.map((row) => (
                  <div
                    key={row.topic}
                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(110px,0.8fr)_minmax(120px,0.9fr)] border-t border-white/10 bg-[rgba(255,255,255,0.03)] text-sm"
                  >
                    <div className="px-4 py-4 text-white/82">{row.topic}</div>
                    <div className="px-4 py-4 text-white/54">{row.social}</div>
                    <div className="px-4 py-4 text-[var(--accent-soft)]">{row.rushLink}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <BoardPreview />
        </section>

        <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <SectionHeading
              kicker="How To Start"
              title="最初の動きは3ステップだけ"
              description="入ってきた人が迷わないように、使い始めの順番を短くまとめています。"
            />

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((item) => (
                <article key={item.step} className="lp-step-card">
                  <div className="lp-step-badge">{item.step}</div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
          <div className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-6">
              <SectionHeading
                kicker="FAQ"
                title="よくある確認だけ残す"
                description="FAQは短くして、最初に気になる点だけを拾えるようにしました。"
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
                まずは一覧を開く
              </h2>
              <p className="text-sm leading-7 text-[var(--muted)] md:text-base">
                いちばん情報量が多いのは募集一覧です。雰囲気をつかんだあと、必要なら登録や相談に進めます。
              </p>

              <div className="rounded-[1.8rem] border border-white/10 bg-[rgba(7,14,21,0.62)] p-4">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <span className="text-sm font-semibold text-white">募集一覧</span>
                  <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs text-white/64">
                    最初に見るページ
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {["対戦募集を見る", "教わりたい募集を見る", "リプレイ相談へ進む"].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/board" className="primary-action w-auto min-w-[13rem]">
                  対戦募集一覧へ
                </Link>
                <Link href="/replay-review" className="secondary-action min-w-[11rem]">
                  リプレイ相談へ
                </Link>
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
