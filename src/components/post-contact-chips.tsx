"use client";

import type { ProfileContactMap } from "@/lib/profile-contacts";

export function PostContactChips({
  userId,
  contacts,
}: {
  userId: string;
  contacts: ProfileContactMap;
}) {
  const contact = contacts[userId];
  const xAccount = contact?.x_account?.trim() ?? "";
  const discordAccount = contact?.discord_account?.trim() ?? "";

  if (!xAccount && !discordAccount) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {xAccount ? (
        <span className="pill-button border border-white/10 bg-white/5 px-3 py-2 text-[var(--muted)]">
          X: {xAccount}
        </span>
      ) : null}
      {discordAccount ? (
        <span className="pill-button border border-white/10 bg-white/5 px-3 py-2 text-[var(--muted)]">
          Discord: {discordAccount}
        </span>
      ) : null}
    </div>
  );
}
