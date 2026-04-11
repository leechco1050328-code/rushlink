import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

type IconProps = {
  className?: string;
};

type RelatedLink = {
  href: string;
  kicker: string;
  label: string;
  description: string;
};

export function SeoLandingHeader({ eyebrow }: { eyebrow: string }) {
  return (
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
        <p className="display text-sm text-[var(--accent-soft)]">{eyebrow}</p>
      </div>
      <SiteNav invert />
    </header>
  );
}

export function SeoSectionHeading({
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

export function RelatedLandingLinks({
  title,
  description,
  links,
}: {
  title: string;
  description: string;
  links: RelatedLink[];
}) {
  return (
    <section className="panel rounded-[30px] px-6 py-6 md:px-8 md:py-8">
      <div className="space-y-6">
        <SeoSectionHeading kicker="Related LPs" title={title} description={description} />
        <div className="grid gap-4 md:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-[1.7rem] border border-white/10 bg-white/6 px-5 py-5 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/8"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/48">{link.kicker}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{link.label}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{link.description}</p>
              <p className="mt-5 text-sm font-semibold text-[var(--accent-soft)]">このLPを見る</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DuelIcon({ className = "h-11 w-11 text-[var(--accent-soft)]" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
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

export function CoachIcon({ className = "h-11 w-11 text-[var(--secondary)]" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
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

export function ReplayIcon({ className = "h-11 w-11 text-[var(--accent-soft)]" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
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

export function FriendIcon({ className = "h-11 w-11 text-[var(--accent-soft)]" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="18" cy="18" r="6" fill="currentColor" fillOpacity="0.24" />
      <circle cx="31" cy="20" r="5" fill="currentColor" fillOpacity="0.42" />
      <path
        d="M10 34c1.8-4.8 5.6-7 10.3-7 4.3 0 8 2.2 9.7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M26.5 33.5c1.1-2.8 3.2-4.3 5.9-4.3 2.1 0 4 0.9 5.3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClipboardIcon({ className = "h-11 w-11 text-[var(--secondary)]" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="12" y="10" width="24" height="28" rx="5" fill="currentColor" fillOpacity="0.18" />
      <rect x="18" y="8" width="12" height="6" rx="3" fill="currentColor" fillOpacity="0.38" />
      <path
        d="M18 20h12M18 26h12M18 32h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RadarIcon({ className = "h-11 w-11 text-[var(--accent-soft)]" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeOpacity="0.2" />
      <circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" strokeOpacity="0.28" />
      <path
        d="M24 9v30M9 24h30M24 24l10-8"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="34" cy="16" r="2.3" fill="currentColor" />
    </svg>
  );
}
