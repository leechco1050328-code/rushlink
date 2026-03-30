"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { SharePostActions } from "@/components/share-post-actions";
import { getComboFlowDetailHref, type ComboFlowPost } from "@/lib/combo-flow";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function formatPostedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "読み込みに失敗しました。";
}

export function ComboFlowDashboard() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<ComboFlowPost[]>([]);
  const [message, setMessage] = useState(
    supabase ? "コンボフローを読み込んでいます..." : "Supabase の設定待ちです。",
  );
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadDashboard() {
      const {
        data: { session: activeSession },
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      if (!activeSession?.user) {
        setPosts([]);
        setIsLoading(false);
        setMessage("ログインすると自分のコンボフローを作成・管理できます。");
        return;
      }

      const { data, error } = await client
        .from("combo_flow_posts")
        .select(
          "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at, updated_at",
        )
        .eq("user_id", activeSession.user.id)
        .order("updated_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (error) {
        setMessage(`読み込みに失敗しました: ${error.message}`);
        setIsLoading(false);
        return;
      }

      setPosts((data ?? []) as ComboFlowPost[]);
      setIsLoading(false);
      setMessage(`自分のコンボフローを ${data?.length ?? 0} 件表示しています。`);
    }

    loadDashboard().catch((error: unknown) => {
      if (!mounted) {
        return;
      }
      setMessage(`読み込みに失敗しました: ${getMessageFromError(error)}`);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [supabase]);

  function handleDelete(postId: number) {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.from("combo_flow_posts").delete().eq("id", postId);
        if (error) {
          throw error;
        }

        setPosts((current) => current.filter((post) => post.id !== postId));
        setMessage("コンボフローを削除しました。");
      } catch (error: unknown) {
        setMessage(`削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <section className="grid gap-6">
      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">自分のコンボフロー</h2>
            <p className="text-sm leading-7 text-[var(--muted)]">{message}</p>
          </div>
          {session?.user ? (
            <Link href="/combo-flow/new" className="primary-action w-auto min-w-[11rem]">
              新規作成
            </Link>
          ) : (
            <Link href="/auth?mode=sign-in" className="secondary-action min-h-0 px-4 py-3 text-sm">
              ログインする
            </Link>
          )}
        </div>
      </section>

      {!session?.user ? (
        <section className="panel rounded-[30px] px-6 py-6">
          <p className="text-sm leading-7 text-[var(--muted)]">
            ログインすると、キャラクターを選んで自分専用のコンボフローページを作成できます。
          </p>
        </section>
      ) : isLoading ? (
        <section className="panel rounded-[30px] px-6 py-6">
          <p className="text-sm leading-7 text-[var(--muted)]">読み込み中...</p>
        </section>
      ) : posts.length === 0 ? (
        <section className="panel rounded-[30px] px-6 py-6">
          <p className="text-sm leading-7 text-[var(--muted)]">
            まだコンボフローはありません。新規作成から最初の1件を作ってみましょう。
          </p>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.id}
              className="panel rounded-[30px] px-6 py-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <CharacterChip name={post.character_name} size="md" tone="accent" />
                  <h3 className="text-2xl font-semibold text-white">{post.title}</h3>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    作成: {formatPostedAt(post.created_at)}
                    {post.updated_at ? ` / 更新: ${formatPostedAt(post.updated_at)}` : ""}
                  </p>
                  {post.summary ? (
                    <p className="text-sm leading-7 text-[var(--muted)]">{post.summary}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                    <span className="rounded-full bg-white/8 px-3 py-1">
                      {post.flow_nodes.length} ノード
                    </span>
                    <span className="rounded-full bg-white/8 px-3 py-1">
                      {post.flow_edges.length} 矢印
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={getComboFlowDetailHref(post.id)}
                    className="secondary-action min-h-0 px-4 py-2 text-sm"
                  >
                    編集
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    disabled={isPending}
                    className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
                  >
                    削除
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <SharePostActions title={post.title} path={getComboFlowDetailHref(post.id)} />
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
