import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type BrandPageHeaderProps = {
  backHref: string;
  title: string;
  description: string;
  kicker?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function BrandPageHeader({
  backHref,
  title,
  description,
  kicker,
  backLabel = "トップへ戻る",
  actions,
}: BrandPageHeaderProps) {
  return (
    <header className="panel flex flex-col gap-5 rounded-[30px] px-6 py-6 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <Link
            href={backHref}
            className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
          >
            {backLabel}
          </Link>
          <Image
            src="/logo-white.svg"
            alt="Rush Link"
            width={400}
            height={120}
            className="h-9 w-auto md:h-10"
          />
          {kicker ? (
            <p className="display text-sm text-[var(--accent-soft)]">{kicker}</p>
          ) : null}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[var(--muted)] md:text-base">
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
