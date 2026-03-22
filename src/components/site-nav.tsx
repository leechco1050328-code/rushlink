"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SiteNav({ invert = false }: { invert?: boolean }) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
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
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className={`${pillClass} disabled:opacity-60`}
        >
          ログアウト
        </button>
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
      <a href="#board" className={pillClass}>
        募集ボード
      </a>
      <a href="#replay-review" className={pillClass}>
        リプレイコーチング
      </a>
    </nav>
  );
}
