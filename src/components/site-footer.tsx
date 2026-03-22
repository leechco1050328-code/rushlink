import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative mx-auto mt-10 w-full max-w-7xl px-6 pb-8 md:px-10 md:pb-10">
      <div className="panel flex flex-col gap-5 rounded-[28px] px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="space-y-3">
          <Image
            src="/logo-white.svg"
            alt="Rush Link"
            width={400}
            height={120}
            className="h-8 w-auto"
          />
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Street Fighter 6 でMR帯別の対戦募集、教えたい / 教わりたい募集、リプレイIDを使ったコーチング相談まで扱うコミュニティーです。
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <Link
            href="/terms"
            className="pill-button rounded-full border border-white/15 bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="pill-button rounded-full border border-white/15 bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
          >
            プライバシーポリシー
          </Link>
        </nav>
      </div>
    </footer>
  );
}
