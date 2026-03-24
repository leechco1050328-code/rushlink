"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FeedbackFormState = {
  category: string;
  title: string;
  detail: string;
};

const defaultForm: FeedbackFormState = {
  category: "feature",
  title: "",
  detail: "",
};

const categoryOptions = [
  { value: "feature", label: "要望" },
  { value: "bug", label: "不具合" },
  { value: "ux", label: "使いづらさ" },
  { value: "other", label: "その他" },
];

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "送信に失敗しました。";
}

export function FeedbackForm() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [form, setForm] = useState<FeedbackFormState>(defaultForm);
  const [message, setMessage] = useState(
    "ベータ版のため、気になった点や欲しい機能を気軽に送ってください。",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase の接続情報が見つからないため、フォームを送信できません。");
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
      if (!mounted) {
        return;
      }

      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function updateField<Key extends keyof FeedbackFormState>(
    key: Key,
    value: FeedbackFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase の接続情報が見つからないため、フォームを送信できません。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.from("feedback_requests").insert({
          user_id: session?.user?.id ?? null,
          user_email: session?.user?.email ?? "",
          category: form.category,
          title: form.title.trim(),
          detail: form.detail.trim(),
          contact: "",
        });

        if (error) {
          throw error;
        }

        setForm(defaultForm);
        setMessage("要望を送信しました。ありがとうございます。");
      } catch (error: unknown) {
        setMessage(`送信に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <section className="panel rounded-[30px] px-6 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="display text-2xl text-white">要望フォーム</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            プレリリース版のため、使いづらい点や欲しい機能を集めています。
          </p>
        </div>
        <span className="pill-button rounded-full border border-[var(--secondary)]/35 bg-[var(--secondary)]/12 px-3 py-1 text-xs text-[var(--secondary)]">
          Beta Feedback
        </span>
      </div>

      <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[var(--muted)]">
        <p>{message}</p>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
        <p>細かい違和感でも大丈夫です。</p>
        <p>
          「どのページで」「何をしていた時に」「どうなってほしいか」を書いてもらえると対応しやすいです。
        </p>
      </div>

      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-[var(--muted)]">カテゴリ</span>
          <select
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden md:block" aria-hidden="true" />

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm text-[var(--muted)]">件名</span>
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            placeholder="例: 募集一覧の絞り込みを増やしてほしい"
            required
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm text-[var(--muted)]">内容</span>
          <textarea
            value={form.detail}
            onChange={(event) => updateField("detail", event.target.value)}
            className="min-h-40 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            placeholder="どのページで、何が起きたか、どうなってほしいかを書いてください。"
            required
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="primary-action disabled:opacity-60"
          >
            {isPending ? "送信中..." : "要望を送信する"}
          </button>
        </div>
      </form>
    </section>
  );
}
