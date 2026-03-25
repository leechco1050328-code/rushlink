import Image from "next/image";
import Link from "next/link";
import { AdSenseSlot } from "@/components/adsense-slot";
import { CommunityBoard } from "@/components/community-board";
import { ReplayReviewBoard } from "@/components/replay-review-board";
import { SiteNav } from "@/components/site-nav";
import { getAdSenseMidSlot, getAdSenseTopSlot } from "@/lib/adsense";

const siteDescription =
  "Street Fighter 6 でMR帯別の対戦募集、教えたい / 教わりたい募集、リプレイIDを使ったコーチング相談まで扱うコミュニティーです。";

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
                <p className="max-w-2xl text-sm leading-7 text-white/72">
                  {siteDescription}
                </p>
              </div>
              <SiteNav invert />
            </header>

            <div className="mt-10">
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
            </div>
          </div>
        </section>

        {topAdSlot ? (
          <section className="pt-2">
            <AdSenseSlot slot={topAdSlot} label="Advertisement" format="horizontal" />
          </section>
        ) : null}

        <section id="board" className="space-y-8 pt-4">
          <SectionTitle
            kicker="Community Board"
            title="対戦募集と教えたい / 教わりたい募集をまとめて探す"
            description="募集目的と対象キャラクターで絞り込みできます。ホームでは新着5件だけを表示し、続きは一覧ページで確認できます。"
          />

          <CommunityBoard listLimit={5} listPageHref="/board" />
        </section>

        <section id="replay-review" className="space-y-8 pt-6">
          <SectionTitle
            kicker="Replay Coaching"
            title="リプレイIDから相談できるコーチングボード"
            description="ゲーム内のリプレイIDを使って立ち回りやセットプレイの相談ができます。ホームでは新着5件だけを表示します。"
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
