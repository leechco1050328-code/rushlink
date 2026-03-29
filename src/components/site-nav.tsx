"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { fetchUnreadApplicationCount } from "@/lib/community-applications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SiteNav({ invert = false }: { invert?: boolean }) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let mounted = true;

    async function refresh(nextSession?: Session | null) {
      const activeSession =
        nextSession ?? (await client.auth.getSession().then(({ data }) => data.session)) ?? null;

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      if (!activeSession?.user) {
        setUnreadCount(0);
        return;
      }

      try {
        const count = await fetchUnreadApplicationCount(client, activeSession.user.id);
        if (!mounted) {
          return;
        }
        setUnreadCount(count);
      } catch {
        if (!mounted) {
          return;
        }
        setUnreadCount(0);
      }
    }

    refresh().catch(() => undefined);

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      refresh(nextSession).catch(() => undefined);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function handleLogout() {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      await supabase.auth.signOut();
      setSession(null);
      setUnreadCount(0);
      window.location.href = "/";
    });
  }

  const pillClass = `pill-button rounded-full px-4 py-2 transition-colors ${
    invert
      ? "border border-white/18 bg-white/10 hover:bg-white/14"
      : "border border-white/15 bg-white/5 hover:bg-white/10"
  }`;

  return (
    <nav
      className={`flex flex-wrap items-center justify-end gap-2 text-sm ${
        invert ? "text-white/84" : "text-[var(--muted)]"
      }`}
    >
      {session?.user ? (
        <>
          <Link href="/notifications" className={`${pillClass} relative`}>
            通知
            {unreadCount > 0 ? (
              <span className="ml-2 rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-semibold text-[#09111f]">
                {unreadCount}
              </span>
            ) : null}
          </Link>
          <Link href="/myposts" className={pillClass}>
            自分の投稿
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className={`${pillClass} disabled:opacity-60`}
          >
            ログアウト
          </button>
        </>
      ) : (
        <>
          <Link href="/auth" className={pillClass}>
            ユーザー登録
          </Link>
          <Link href="/auth?mode=sign-in" className={pillClass}>
            ログイン
          </Link>
        </>
      )}

      <Link href="/profile" className={pillClass}>
        プロフィール編集
      </Link>
      <Link href="/#board" className={pillClass}>
        募集ボード
      </Link>
      <Link href="/#replay-review" className={pillClass}>
        リプレイコーチング
      </Link>
      <Link href="/combo-flow" className={pillClass}>
        コンボフロー
      </Link>
      <Link href="/feedback" className={pillClass}>
        要望フォーム
      </Link>
    </nav>
  );
}
