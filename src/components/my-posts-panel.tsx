"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  fetchApplicationsForOwner,
  type CommunityApplication,
} from "@/lib/community-applications";
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

function buildPostHref(application: CommunityApplication) {
  if (application.post_source === "recruitment_posts") {
    return `/board/recruitment/${application.post_id}`;
  }

  return `/board/coaching/${application.post_id}`;
}

export function MyPostsPanel() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
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

    async function loadData() {
      const {
        data: { session: activeSession },
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      if (!activeSession?.user) {
        setPosts([]);
        setApplications([]);
        setIsLoading(false);
        setMessage("自分の投稿を見るにはログインしてください。");
        return;
      }

      const [recruitmentResult, coachingResult, replayResult, nextApplications] = await Promise.all([
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
        fetchApplicationsForOwner(client, activeSession.user.id),
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
      setApplications(nextApplications);
      setIsLoading(false);
      setMessage(
        `自分の投稿 ${merged.length} 件 / 応募通知 ${nextApplications.length} 件を表示しています。`,
      );
    }

    loadData().catch((error: unknown) => {
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
    <div className="grid gap-6">
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
                  <Link
                    href={post.href}
                    className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
                  >
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

      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">届いた応募</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              あなたの募集に届いた応募を確認できます。未読の整理は通知ページからできます。
            </p>
          </div>
          <Link
            href="/notifications"
            className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
          >
            通知ページへ
          </Link>
        </div>

        {!session?.user ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
            ログイン後に応募一覧が表示されます。
          </div>
        ) : isLoading ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
            読み込み中...
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
            まだ応募は届いていません。
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {applications.map((application) => (
              <article
                key={application.id}
                className="rounded-[24px] border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill-button rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                    {application.post_kind}
                  </span>
                  {!application.read_at ? (
                    <span className="rounded-full bg-[var(--secondary)]/15 px-3 py-1 text-xs text-[var(--secondary)]">
                      未読
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  <Link
                    href={`/players/${application.applicant_user_id}`}
                    className="text-[var(--accent-soft)] underline underline-offset-4"
                  >
                    {application.applicant_name}
                  </Link>
                  さんから「{application.application_type}」が届いています。
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{application.post_title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{application.message}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[var(--muted)]/80">
                    受信日時: {formatPostedAt(application.created_at)}
                  </p>
                  <Link
                    href={buildPostHref(application)}
                    className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
                  >
                    募集詳細を見る
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
