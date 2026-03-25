"use client";

import { useMemo, useState } from "react";

function resolveAbsoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (siteUrl) {
    return `${siteUrl}${normalizedPath}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalizedPath}`;
  }

  return normalizedPath;
}

type SharePostActionsProps = {
  title: string;
  path: string;
};

export function SharePostActions({ title, path }: SharePostActionsProps) {
  const [message, setMessage] = useState("");
  const shareUrl = useMemo(() => resolveAbsoluteUrl(path), [path]);
  const xShareUrl = useMemo(() => {
    const params = new URLSearchParams({
      text: title,
      url: shareUrl,
    });

    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [shareUrl, title]);

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      window.open(xShareUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      await navigator.share({
        title,
        text: title,
        url: shareUrl,
      });
      setMessage("共有シートを開きました。");
    } catch {
      setMessage("");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("リンクをコピーしました。");
    } catch {
      setMessage("リンクをコピーできませんでした。");
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleNativeShare}
        className="secondary-action min-h-0 px-4 py-2 text-sm"
      >
        共有
      </button>
      <a
        href={xShareUrl}
        target="_blank"
        rel="noreferrer"
        className="secondary-action min-h-0 px-4 py-2 text-sm"
      >
        Xで共有
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="secondary-action min-h-0 px-4 py-2 text-sm"
      >
        リンクをコピー
      </button>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
