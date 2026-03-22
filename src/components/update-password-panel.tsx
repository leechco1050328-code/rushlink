"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { BrandPageHeader } from "@/components/brand-page-header";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "不明なエラーが発生しました。";
}

export function UpdatePasswordPanel() {
  const supabase = getSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [message, setMessage] = useState(
    "メールのリンクから開くと、新しいパスワードを設定できます。",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase の接続設定が見つかりません。");
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setMessage(`セッション確認に失敗しました: ${error.message}`);
          return;
        }

        if (data.session) {
          setIsRecoveryReady(true);
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setMessage(`セッション確認に失敗しました: ${getMessageFromError(error)}`);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsRecoveryReady(true);
        setMessage("新しいパスワードを入力して更新してください。");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase の接続設定が見つかりません。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          throw error;
        }

        setPassword("");
        setMessage("パスワードを更新しました。トップページからログインできます。");
      } catch (error: unknown) {
        setMessage(`パスワード更新に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/auth?mode=sign-in"
          kicker="Recovery"
          title="パスワード再設定"
          description="再設定メールから開いたら、このページで新しいパスワードへ更新できます。"
        />

        <div className="panel w-full rounded-[32px] px-6 py-8 md:px-10">
          <p className="display text-4xl text-white">RESET PASSWORD</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            パスワード再設定メールから開いた人向けのページです。
          </p>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[var(--muted)]">
            {message}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">
                新しいパスワード
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="8文字以上を推奨"
                minLength={6}
                required
                disabled={!isRecoveryReady || isPending}
              />
            </label>

            <button
              type="submit"
              disabled={!isRecoveryReady || isPending}
              className="primary-action disabled:opacity-50"
            >
              {isPending ? "更新中..." : "新しいパスワードに更新する"}
            </button>
          </form>

          <Link
            href="/"
            className="secondary-action mt-5 w-fit text-sm"
          >
            トップページに戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
