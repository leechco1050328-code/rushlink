"use client";

import { useEffect } from "react";
import { getAdSenseClientId } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseSlotProps = {
  slot?: string;
  label?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
};

export function AdSenseSlot({
  slot,
  label = "Sponsored",
  format = "auto",
}: AdSenseSlotProps) {
  const clientId = getAdSenseClientId();

  useEffect(() => {
    if (!clientId || !slot) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // AdSense can throw if the script has not initialized yet.
    }
  }, [clientId, slot]);

  if (!clientId || !slot) {
    return null;
  }

  return (
    <div className="panel rounded-[28px] px-5 py-5">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
