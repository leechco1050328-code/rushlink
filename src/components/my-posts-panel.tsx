"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { SharePostActions } from "@/components/share-post-actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type MyPost = {
  id: number;
  kind: "対戦募集" | "教えたい / 教わりたい" | "リプレイコーチング";
  title: string;
  created_at: string;
  href: string;
};

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

  return "エラーが発生しました。";
}

export function MyPostsPanel() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [message, setMessage] = useState(
    supabase ? "読み込み中です..." : "Supabase の設定が入っていません。",
  );
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadPosts() {
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
        setMessage("自分の投稿を見るにはログインしてください。");
        return;
      }

      const [recruitmentResult, coachingResult, replayResult] = await Promise.all([
        client
          .from("recruitment_posts")
          .select("id, title, created_at")
          .eq("user_id", activeSession.user.id)
          .order("created_at", { ascending: false }),
        client
          .from("coaching_posts")
          .select("id, title, created_at")
          .eq("user_id", activeSession.user.id)
          .order("created_at", { ascending: false }),
        client
          .from("replay_review_posts")
          .select("id, title, created_at")
          .eq("user_id", activeSession.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) {
        return;
      }

      if (recruitmentResult.error) {
        throw recruitmentResult.error;
      }

      if (coachingResult.error) {
        throw coachingResult.error;
      }

      if (replayResult.error) {
        throw replayResult.error;
      }

      const merged: MyPost[] = [
        ...((recruitmentResult.data ?? []) as Array<{ id: number; title: string; created_at: string }>).map(
          (row) => ({
            id: row.id,
            kind: "対戦募集" as const,
            title: row.title,
            created_at: row.created_at,
            href: `/board/recruitment/${row.id}`,
          }),
        ),
        ...((coachingResult.data ?? []) as Array<{ id: number; title: string; created_at: string }>).map((row) => ({
          id: row.id,
          kind: "教えたい / 教わりたい" as const,
          title: row.title,
          created_at: row.created_at,
          href: `/board/coaching/${row.id}`,
        })),
        ...((replayResult.data ?? []) as Array<{ id: number; title: string; created_at: string }>).map((row) => ({
          id: row.id,
          kind: "リプレイコーチング" as const,
          title: row.title,
          created_at: row.created_at,
          href: `/replay-review/${row.id}`,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(merged);
      setIsLoading(false);
      setMessage(`自分の投稿を ${merged.length} 件表示しています。`);
    }

    loadPosts().catch((error: unknown) => {
      if (!mounted) {
        return;
      }

      setIsLoading(false);
      setMessage(getMessageFromError(error));
    });

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <section className="panel rounded-[30px] px-6 py-6">
      <p className="text-sm leading-7 text-[var(--muted)]">{message}</p>

      {!session?.user ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
          ログイン後に一覧が表示されます。
        </div>
      ) : isLoading ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
          読み込み中...
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
          まだ投稿はありません。
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {posts.map((post) => (
            <article
              key={`${post.kind}-${post.id}`}
              className="rounded-[24px] border border-white/10 bg-black/20 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="pill-button rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                  {post.kind}
                </span>
                <Link href={post.href} className="text-sm text-[var(--accent-soft)] underline underline-offset-4">
                  詳細を見る
                </Link>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{post.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                投稿日: {formatPostedAt(post.created_at)}
              </p>
              <SharePostActions title={post.title} path={post.href} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
