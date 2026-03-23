"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  getMissingSupabaseEnv,
  getSupabaseBrowserClient,
  hasSupabaseEnv,
} from "@/lib/supabase/client";

type Mode = "sign-up" | "sign-in";

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "予期しないエラーが発生しました。";
}

export function AuthPanel({
  initialMode = "sign-up",
}: {
  initialMode?: Mode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  const isConfigured = hasSupabaseEnv();
  const missingEnv = getMissingSupabaseEnv();
  const origin =
    typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(isConfigured);
  const [message, setMessage] = useState(
    "メールアドレスとパスワードで登録できます。ログインするとトップページへ戻ります。",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) {
          return;
        }

        if (error) {
          setMessage(`セッション確認に失敗しました: ${error.message}`);
        } else {
          setSession(data.session);
        }

        setSessionLoading(false);
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        setMessage(`セッション確認に失敗しました: ${getMessageFromError(error)}`);
        setSessionLoading(false);
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

  function goTop() {
    if (pathname !== "/") {
      router.replace("/");
      router.refresh();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("`.env.local` に Supabase の設定を入れると利用できます。");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "sign-up") {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName.trim(),
              },
            },
          });

          if (error) {
            throw error;
          }

          setSession(data.session);
          setMessage(
            data.session
              ? "登録が完了しました。プロフィールを設定して使い始められます。"
              : "確認メールを送信しました。メール内リンクを開いて登録を完了してください。",
          );
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        setSession(data.session);
        setMessage("ログインしました。トップページへ移動します。");
        goTop();
      } catch (error: unknown) {
        setMessage(`認証に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleLogout() {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage(`ログアウトに失敗しました: ${error.message}`);
        return;
      }

      setSession(null);
      setMessage("ログアウトしました。");
    });
  }

  function handlePasswordReset() {
    if (!supabase) {
      setMessage("`.env.local` に Supabase の設定を入れると利用できます。");
      return;
    }

    if (!email.trim()) {
      setMessage("先にメールアドレスを入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${origin}/auth/update-password`,
        });

        if (error) {
          throw error;
        }

        setMessage("パスワード再設定メールを送信しました。");
      } catch (error: unknown) {
        setMessage(`再設定メール送信に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <section className="panel rounded-[30px] px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display text-2xl text-white">ユーザー登録 / ログイン</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Street Fighter 6 の対戦募集とリプレイコーチングに参加するための認証ページです。
          </p>
        </div>
        <span
          className={`pill-button px-3 py-1 text-xs ${
            isConfigured
              ? "bg-[var(--secondary)]/15 text-[var(--secondary)]"
              : "bg-[var(--accent)]/15 text-[var(--accent-soft)]"
          }`}
        >
          {isConfigured ? "設定済み" : "設定待ち"}
        </span>
      </div>

      {!isConfigured ? (
        <div className="mt-6 space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
          <p className="text-sm leading-7 text-[var(--muted)]">
            Supabase と接続すると本物の会員登録が使えます。
          </p>
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-[var(--muted)]">
            未設定の環境変数: {missingEnv.join(", ")}
          </div>
        </div>
      ) : session?.user ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
          <p className="text-sm text-[var(--muted)]">現在ログイン中です。</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            メール: {session.user.email}
            <br />
            表示名: {String(session.user.user_metadata.display_name ?? "").trim() || "未設定"}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="secondary-action mt-5 text-sm disabled:opacity-60"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="flex gap-3 text-sm">
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className={`pill-button px-4 py-2 ${
                mode === "sign-up"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-white/10 bg-white/5 text-[var(--muted)]"
              }`}
            >
              ユーザー登録
            </button>
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`pill-button px-4 py-2 ${
                mode === "sign-in"
                  ? "bg-[var(--accent)] text-white"
                  : "border border-white/10 bg-white/5 text-[var(--muted)]"
              }`}
            >
              ログイン
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "sign-up" ? (
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">表示名</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="例: RushLink Jamie"
                  required
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">メールアドレス</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">パスワード</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="8文字以上を推奨"
                required
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={isPending} className="primary-action disabled:opacity-60">
                {isPending
                  ? "送信中..."
                  : mode === "sign-up"
                    ? "ユーザー登録する"
                    : "ログインする"}
              </button>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isPending}
                className="secondary-action text-sm disabled:opacity-60"
              >
                パスワードを忘れた
              </button>
            </div>
          </form>
        </div>
      )}

      <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
        {sessionLoading ? "認証状態を確認しています..." : message}
      </p>
    </section>
  );
}
