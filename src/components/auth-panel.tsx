"use client";

import { useEffect, useState, useTransition } from "react";
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

  return "不明なエラーが発生しました。";
}

export function AuthPanel({
  initialMode = "sign-up",
}: {
  initialMode?: Mode;
}) {
  const supabase = getSupabaseBrowserClient();
  const isConfigured = hasSupabaseEnv();
  const missingEnv = getMissingSupabaseEnv();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState(
    "Supabase をつなぐと、ここで本物のユーザー登録ができます。",
  );
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(isConfigured);
  const [isPending, startTransition] = useTransition();

  const origin =
    typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
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
        } else {
          setSession(data.session);
        }

        setSessionLoading(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
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
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("先に .env.local に Supabase の接続情報を入れてください。");
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
                display_name: displayName,
              },
            },
          });

          if (error) {
            throw error;
          }

          setSession(data.session);
          setMessage(
            data.session
              ? "登録が完了し、そのままログインしました。"
              : "登録メールを送信しました。受信したメールのリンクを開いて登録を完了してください。",
          );
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          setSession(data.session);
          setMessage("ログインしました。");
        }
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
      setMessage("先に .env.local に Supabase の接続情報を入れてください。");
      return;
    }

    if (!email) {
      setMessage("先にメールアドレスを入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/update-password`,
        });

        if (error) {
          throw error;
        }

        setMessage(
          "パスワード再設定メールを送信しました。メール内のリンクから新しいパスワードを設定してください。",
        );
      } catch (error: unknown) {
        setMessage(`再設定メール送信に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <section className="panel rounded-[30px] px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display text-2xl text-white">ユーザー登録</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            メールアドレスとパスワードで登録できます。今は MVP として、まずは
            認証だけを先に入れています。
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
            まだ Supabase の接続情報が入っていません。次の 3 つを済ませると、
            下の登録フォームが本当に使えるようになります。
          </p>
          <ol className="space-y-2 text-sm leading-7 text-[var(--muted)]">
            <li>1. Supabase で新しいプロジェクトを作る</li>
            <li>2. `.env.local.example` を参考に `.env.local` を作る</li>
            <li>3. Project URL と Publishable key を貼り付ける</li>
          </ol>
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-[var(--muted)]">
            不足している環境変数: {missingEnv.join(", ")}
          </div>
          <a
            href="#setup"
            className="secondary-action w-fit text-sm"
          >
            設定手順を見る
          </a>
        </div>
      ) : session?.user ? null : (
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
              新規登録
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
                <span className="mb-2 block text-sm text-[var(--muted)]">
                  表示名
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="例: Kaito"
                  required
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">
                メールアドレス
              </span>
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
              <span className="mb-2 block text-sm text-[var(--muted)]">
                パスワード
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="8文字以上を推奨"
                required
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="primary-action disabled:opacity-60"
            >
              {isPending
                ? "送信中..."
                : mode === "sign-up"
                  ? "この内容で登録する"
                  : "ログインする"}
            </button>

            <div className="flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isPending}
                className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
              >
                パスワードを忘れた
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[var(--muted)]">
        <p>{message}</p>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
        <p className="text-sm font-semibold text-white">現在のログイン状態</p>
        {sessionLoading ? (
          <p className="mt-3 text-sm text-[var(--muted)]">確認中...</p>
        ) : session?.user ? (
          <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
            <p>メール: {session.user.email}</p>
            <p>
              表示名: {String(session.user.user_metadata.display_name ?? "未設定")}
            </p>
            <p>
              メール確認:
              {session.user.email_confirmed_at ? " 完了" : " 未確認"}
            </p>
            <p>ログイン中のため、登録フォームとログインフォームは非表示です。</p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            まだログインしていません。
          </p>
        )}
      </div>
    </section>
  );
}
