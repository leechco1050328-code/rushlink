import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SITE_NAME } from "@/lib/site";

const pagePath = "/street-fighter-6-taisen-boshu";
const pageTitle = `スト6の対戦募集なら ${SITE_NAME} | MR帯・目的別に相手を探せる`;
const pageDescription =
  "スト6の対戦募集、教えたい・教わりたい募集、リプレイIDを使った相談まで1か所で探せるページです。Street Fighter 6 で同じくらいのランク帯や目的に合う相手を見つけたい人向けにまとめました。";

const featureCards = [
  {
    title: "対戦募集を一覧で探せる",
    description:
      "Street Fighter 6 の対戦募集をまとめて確認できます。募集一覧から、今動いている投稿を見つけやすい構成です。",
    points: ["新しい募集をまとめて確認できる", "対戦相手を探している人を見つけやすい"],
  },
  {
    title: "教えたい / 教わりたい募集にも対応",
    description:
      "ただ対戦するだけでなく、教えてほしい人や教えたい人向けの募集も扱えます。目的が合う相手を探しやすくなります。",
    points: ["対戦だけでなく練習相手探しにも使える", "目的が伝わりやすいのでミスマッチを減らしやすい"],
  },
  {
    title: "リプレイIDを使った相談もできる",
    description:
      "対戦相手探しだけで終わらず、リプレイIDをもとに立ち回りやセットプレイの相談につなげられます。",
    points: ["プレイ内容を具体的に相談しやすい", "次の課題を見つけたい人にも向いている"],
  },
];

const steps = [
  {
    title: "1. 募集一覧を見る",
    description:
      "まずは今出ている対戦募集や教えてほしい募集を見て、自分に近い条件の投稿があるか確認します。",
  },
  {
    title: "2. 合う使い方を選ぶ",
    description:
      "対戦相手を探す、教えてほしい相手を探す、リプレイ相談を見るなど、目的に合う導線から進めます。",
  },
  {
    title: "3. 登録して参加する",
    description:
      "参加したいと思ったらユーザー登録して、募集の投稿や詳細のやり取りに進めます。",
  },
];

const faqs = [
  {
    question: "このページはどんな人向けですか？",
    answer:
      "Street Fighter 6 で対戦相手を探したい人、同じくらいのランク帯の相手を見つけたい人、教えてほしい相手を探したい人向けです。",
  },
  {
    question: "対戦募集以外にも使えますか？",
    answer:
      "はい。教えたい / 教わりたい募集や、リプレイIDを使った相談ページにもつながっています。",
  },
  {
    question: "最初に見るべきページはどこですか？",
    answer:
      "まずは募集一覧ページを見るのがおすすめです。現在出ている投稿を確認して、サービスの雰囲気をつかめます。",
  },
  {
    question: "登録しないと内容は見られませんか？",
    answer:
      "一覧ページでは公開されている募集を確認できます。実際に参加したり投稿したりするにはユーザー登録が必要です。",
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

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:items-end">
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-[1.05]">
                  スト6の対戦募集を探すなら、
                  <br />
                  目的別に相手を見つけやすい
                  <br />
                  {SITE_NAME}
                </h1>
                <p className="max-w-3xl text-base leading-8 text-white/78 md:text-lg">
                  スト6で対戦相手が見つからない、同じくらいのランク帯で回したい、
                  教えてくれる相手を探したい。そんな時に、対戦募集、教えたい /
                  教わりたい募集、リプレイIDを使った相談までひとつの流れで見られるページです。
                </p>
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
                <p className="text-sm leading-7 text-white/64">
                  対戦募集を探している人向けに、Rush Link
                  の使い方とページ導線をわかりやすくまとめています。
                </p>
              </div>

              <div className="hero-card rounded-[2rem] p-5 md:p-6">
                <div className="space-y-4">
                  <p className="display text-sm text-[var(--accent-soft)]">Why This Page Works</p>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    スト6の対戦募集で探しやすいこと
                  </h2>
                  <div className="space-y-3">
                    {[
                      "対戦相手を探したい",
                      "教えてほしい相手を探したい",
                      "リプレイIDから相談したい",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/82"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article key={feature.title} className="panel rounded-[28px] px-5 py-5 md:px-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
                <p className="text-sm leading-7 text-[var(--muted)]">{feature.description}</p>
                <ul className="space-y-2 text-sm leading-7 text-white/82">
                  {feature.points.map((point) => (
                    <li key={point} className="rounded-[1rem] border border-white/10 bg-white/6 px-3 py-2">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
            <SectionHeading
              kicker="Search Intent"
              title="スト6で対戦相手を探す時によくある悩み"
              description="SNSでは投稿が流れやすく、条件が合う相手を見つけにくいことがあります。Rush Link では、対戦募集を見る導線と、教えてほしい・相談したい導線を分けて探しやすくしています。"
            />

            <div className="space-y-3">
              {[
                "対戦募集の投稿がすぐ流れて見つけ直しにくい",
                "同じくらいの強さや目的の相手を探しにくい",
                "対戦後にリプレイの相談までつなげにくい",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.45rem] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-7 text-white/82"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            kicker="How To Start"
            title="このLPから進むおすすめの順番"
            description="検索でこのページに入った人が迷わないように、最初の動線を3段階でまとめています。"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="panel rounded-[28px] px-5 py-5 md:px-6">
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <SectionHeading
              kicker="FAQ"
              title="スト6の対戦募集ページについてよくある質問"
              description="検索流入の人が気にしやすいポイントを、短く確認できるようにしています。"
            />

            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map((item) => (
                <article key={item.question} className="rounded-[1.6rem] border border-white/10 bg-white/6 px-5 py-5">
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-3">
              <p className="display text-sm text-[var(--accent-soft)]">Next Step</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                スト6の対戦募集を見に行く
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-[var(--muted)] md:text-base">
                まずは募集一覧を見て、今どんな投稿が出ているか確認できます。教えてほしい相手を探したい場合や、
                リプレイIDで相談したい場合も関連ページから進めます。
              </p>
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
    </main>
  );
}
