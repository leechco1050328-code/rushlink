import type { Metadata } from "next";
import Link from "next/link";

const pageTitle = "Ember Mines";
const pageDescription =
  "盤面を読み、鍵を見つけ、報酬を積み上げながら降りていくローグライト型マインスイーパーです。";

export const metadata: Metadata = {
  title: `${pageTitle} | Rush Link`,
  description: pageDescription,
  alternates: {
    canonical: "/ember-mines",
  },
  openGraph: {
    title: `${pageTitle} | Rush Link`,
    description: pageDescription,
    url: "/ember-mines",
  },
  twitter: {
    title: `${pageTitle} | Rush Link`,
    description: pageDescription,
  },
};

export default function EmberMinesPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <section className="hero-banner px-6 py-6 md:px-10 md:py-8">
          <div className="relative z-10 space-y-5">
            <p className="display text-sm text-[var(--accent-soft)]">Playable Side Project</p>
            <div className="space-y-3">
              <h1 className="display text-5xl leading-[0.9] text-white md:text-7xl">{pageTitle}</h1>
              <p className="max-w-3xl text-sm leading-7 text-white/72 md:text-base">
                {pageDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/ember-mines/play.html" className="primary-action w-auto min-w-[13rem]" target="_blank">
                別タブで開く
              </Link>
              <Link
                href="/"
                className="pill-button min-h-[3.2rem] min-w-[11rem] rounded-full border border-white/18 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors hover:bg-white/14"
              >
                Rush Link に戻る
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#041011] shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
            <iframe
              src="/ember-mines/play.html"
              title="Ember Mines"
              className="block h-[78vh] min-h-[620px] w-full bg-transparent"
            />
          </div>

          <aside className="grid gap-4 self-start">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display text-xs text-[var(--accent-soft)]">How To Play</p>
              <h2 className="mt-2 text-xl font-semibold text-white">進め方</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                数字を読みながら安全マスを広げ、鍵を見つけて階段を解放します。宝箱、ギミック、ショップを活用しながら深く潜ってください。
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="display text-xs text-[var(--accent-soft)]">Highlights</p>
              <ul className="mt-3 space-y-3 text-sm leading-7 text-[var(--muted)]">
                <li>3ステージ構成のローグライト進行</li>
                <li>クラス、レリック、ボス能力によるビルド差</li>
                <li>Rush Link 上でそのまま遊べるブラウザ版</li>
              </ul>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
