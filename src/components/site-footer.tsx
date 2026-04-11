import Image from "next/image";
import Link from "next/link";
import { SITE_BETA_NOTE, SITE_DESCRIPTION } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative mx-auto mt-10 w-full max-w-7xl px-6 pb-8 md:px-10 md:pb-10">
      <div className="panel flex flex-col gap-5 rounded-[28px] px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Image
              src="/logo-white.svg"
              alt="Rush Link"
              width={400}
              height={120}
              className="h-8 w-auto"
            />
            <span className="pill-button rounded-full border border-[var(--secondary)]/35 bg-[var(--secondary)]/12 px-3 py-1 text-xs text-[var(--secondary)]">
              Beta
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{SITE_DESCRIPTION}</p>
          <p className="text-xs leading-6 text-[var(--muted)]">{SITE_BETA_NOTE}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <Link
            href="/street-fighter-6-taisen-boshu"
            className="pill-button rounded-full border border-white/15 bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
          >
            スト6対戦募集
          </Link>
          <Link
            href="/feedback"
            className="pill-button rounded-full border border-white/15 bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
          >
            要望フォーム
          </Link>
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
