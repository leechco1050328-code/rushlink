import Image from "next/image";
import Link from "next/link";
import { AdSenseSlot } from "@/components/adsense-slot";
import { CommunityBoard } from "@/components/community-board";
import { ProfileSetupGate } from "@/components/profile-setup-gate";
import { ReplayReviewBoard } from "@/components/replay-review-board";
import { SiteNav } from "@/components/site-nav";
import { getAdSenseMidSlot, getAdSenseTopSlot } from "@/lib/adsense";

const siteDescription =
  "Street Fighter 6 でMR帯別の対戦募集、教えたい / 教わりたい募集、リプレイIDを使ったコーチング相談まで扱うコミュニティーです。";

const quickFlow = [
  "プロフィールを保存する",
  "MR帯や使いキャラで募集を出すか一覧から相手を探す",
  "詳細ページで条件とキャラを確認する",
  "SNSから連絡を取り、セットを始める",
];

const featureCards = [
  {
    title: "対戦相手を探す",
    description:
      "MR帯や使用キャラを合わせて、今やりたい相手を見つけやすくしています。",
  },
  {
    title: "教えたい / 教わりたい",
    description:
      "対戦募集だけでなく、学びたい内容や教えられる内容も同じ場所で扱えます。",
  },
  {
    title: "リプレイ相談",
    description:
      "ゲーム内のリプレイIDを使って、立ち回りやセットプレイの相談ができます。",
  },
];

type SectionTitleProps = {
  kicker: string;
  title: string;
  description: string;
};

function SectionTitle({ kicker, title, description }: SectionTitleProps) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="display text-sm text-[var(--accent-soft)]">{kicker}</p>
      <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="text-sm leading-7 text-[var(--muted)] md:text-base">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const topAdSlot = getAdSenseTopSlot();
  const midAdSlot = getAdSenseMidSlot();

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 md:py-10">
        <section className="hero-banner px-6 py-6 md:px-10 md:py-8">
          <div className="relative z-10">
            <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
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
                </div>
                <p className="max-w-xl text-sm leading-7 text-white/72">
                  {siteDescription}
                </p>
              </div>
              <SiteNav invert />
            </header>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
              <div>
                <div className="space-y-5">
                  <h1 className="display text-6xl leading-[0.88] text-white md:text-[7rem]">
                    FIND
                    <br />
                    YOUR
                    <br />
                    NEXT SET
                  </h1>
                  <p className="max-w-2xl text-balance text-base leading-8 text-white/78 md:text-lg">
                    {siteDescription}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/auth" className="primary-action w-auto min-w-[13rem]">
                    登録フォームを見る
                  </Link>
                  <Link
                    href="/feedback"
                    className="pill-button min-h-[3.2rem] min-w-[11rem] rounded-full border border-white/18 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors hover:bg-white/14"
                  >
                    要望フォームへ
                  </Link>
                </div>

                <div className="mt-8 rounded-[24px] border border-[var(--secondary)]/18 bg-[var(--secondary)]/8 p-5">
                  <p className="display text-sm text-[var(--secondary)]">Pre Release</p>
                  <p className="mt-2 text-sm leading-7 text-white/78">
                    Rush Link は現在ベータ版です。細かい違和感や欲しい機能も含めて、要望フォームから送ってもらえると改善に反映しやすいです。
                  </p>
                </div>

                <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/18 to-transparent" />

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {featureCards.map((item) => (
                    <article key={item.title} className="hero-card p-5">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-white/72">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <article className="hero-card px-6 py-6 md:px-7">
                  <p className="display text-sm text-[#9fd4ff]">Match Flow</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    1つの導線で対戦相手までたどり着く
                  </h2>

                  <div className="mt-6 space-y-3">
                    {quickFlow.map((step, index) => (
                      <div
                        key={step}
                        className="flex items-center gap-4 rounded-[22px] border border-white/12 bg-white/10 p-4"
                      >
                        <div className="display min-w-12 text-center text-2xl text-[#9fd4ff]">
                          0{index + 1}
                        </div>
                        <p className="text-sm leading-7 text-white/76">{step}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {topAdSlot ? (
          <section className="pt-2">
            <AdSenseSlot slot={topAdSlot} label="Advertisement" format="horizontal" />
          </section>
        ) : null}

        <ProfileSetupGate>
          <section id="profiles" className="space-y-8 pt-10">
            <SectionTitle
              kicker="Profiles"
              title="プロフィール未設定だと始まらない"
              description="先にプロフィールを保存しておくと、対戦募集とリプレイコーチング相談が使えるようになります。"
            />

            <div className="panel rounded-[32px] px-6 py-6">
              <p className="display text-2xl text-white">最初の設定手順</p>
              <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--muted)]">
                <p>1. ログイン後にプロフィールを保存します。</p>
                <p>2. 使いキャラ、ランク、MR、SNS を入れると募集相手に伝わりやすくなります。</p>
                <p>3. 保存後はメニューの「プロフィール編集」からいつでも更新できます。</p>
              </div>
            </div>
          </section>
        </ProfileSetupGate>

        <section id="board" className="space-y-8 pt-10">
          <SectionTitle
            kicker="Community Board"
            title="対戦募集と教えたい / 教わりたいを同じ画面で探す"
            description="募集目的と対象キャラクターで絞り込みできます。ホームでは新着5件だけを表示し、続きは一覧ページで確認できます。"
          />

          <CommunityBoard listLimit={5} listPageHref="/board" />
        </section>

        <section id="replay-review" className="space-y-8 pt-10">
          <SectionTitle
            kicker="Replay Coaching"
            title="リプレイIDから相談できる添削ボード"
            description="募集一覧とは別に、リプレイコーチング専用の投稿画面を用意しています。気になる投稿は詳細画面でコメントできます。"
          />

          <ReplayReviewBoard listLimit={5} listPageHref="/replay-review" />
        </section>

        {midAdSlot ? (
          <section className="pt-2">
            <AdSenseSlot slot={midAdSlot} label="Advertisement" />
          </section>
        ) : null}
      </section>
    </main>
  );
}
