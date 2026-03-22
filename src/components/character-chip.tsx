"use client";

import Image from "next/image";
import { getCharacterIconSrc } from "@/lib/characters";

type CharacterChipProps = {
  name: string | null | undefined;
  labelPrefix?: string;
  size?: "sm" | "md";
  tone?: "accent" | "muted";
};

const sizeClassMap = {
  sm: {
    wrap: "gap-2 px-3 py-1 text-xs",
    icon: 24,
  },
  md: {
    wrap: "gap-3 px-3.5 py-2 text-sm",
    icon: 28,
  },
} as const;

export function CharacterChip({
  name,
  labelPrefix,
  size = "sm",
  tone = "muted",
}: CharacterChipProps) {
  if (!name) {
    return null;
  }

  const iconSrc = getCharacterIconSrc(name);
  const sizeClasses = sizeClassMap[size];
  const toneClasses =
    tone === "accent"
      ? "bg-[var(--secondary)]/15 text-[var(--secondary)]"
      : "bg-white/8 text-[var(--muted)]";

  return (
    <span
      className={`inline-flex items-center rounded-full ${sizeClasses.wrap} ${toneClasses}`}
    >
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt={name}
          width={sizeClasses.icon}
          height={sizeClasses.icon}
          className="rounded-full border border-white/10 bg-white/80 object-cover"
        />
      ) : null}
      <span>
        {labelPrefix ? `${labelPrefix}: ` : ""}
        {name}
      </span>
    </span>
  );
}
