"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { getBlockedUserIds } from "@/lib/moderation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ReplayCoachingPost = {
  id: number;
  user_id: string;
  author_name: string;
  title: string;
  character_name: string;
  current_rank: string;
  current_mr: string;
  replay_id: string;
  body: string;
  status: string;
  created_at: string;
};

type ReplayCoachingComment = {
  id: number;
  post_id: number;
  user_id: string;
  author_name: string;
  body: string;
  reply_to_no: number | null;
  created_at: string;
};

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "不明なエラーが発生しました。";
}

function formatPostedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ReplayReviewDetail({ postId }: { postId: number | null }) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [post, setPost] = useState<ReplayCoachingPost | null>(null);
  const [comments, setComments] = useState<ReplayCoachingComment[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [replyToNo, setReplyToNo] = useState<number | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [message, setMessage] = useState("読み込み中です。");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setMessage("Supabase の設定情報がまだ入っていません。");
      return;
    }

    if (!postId) {
      setIsLoading(false);
      setMessage("投稿IDが不正です。");
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function loadThread(nextSession?: Session | null) {
      const activeSession =
        nextSession ??
        (await client.auth.getSession().then(({ data }) => data.session)) ??
        null;

      if (!isMounted) {
        return;
      }

      setSession(activeSession);
      const blockedIds = activeSession?.user
        ? await getBlockedUserIds(client, activeSession.user.id)
        : [];

      const [postResult, commentsResult] = await Promise.all([
        client
          .from("replay_review_posts")
          .select(
            "id, user_id, author_name, title, character_name, current_rank, current_mr, replay_id, body, status, created_at",
          )
          .eq("id", postId)
          .maybeSingle(),
        client
          .from("replay_review_comments")
          .select("id, post_id, user_id, author_name, body, reply_to_no, created_at")
          .eq("post_id", postId)
          .order("id", { ascending: true }),
      ]);

      if (!isMounted) {
        return;
      }

      if (postResult.error) {
        setPost(null);
        setComments([]);
        setMessage(`投稿の読み込みに失敗しました: ${postResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (!postResult.data) {
        setPost(null);
        setComments([]);
        setMessage("投稿が見つかりません。");
        setIsLoading(false);
        return;
      }

      if (commentsResult.error) {
        setPost(postResult.data as ReplayCoachingPost);
        setComments([]);
        setMessage(`コメントの読み込みに失敗しました: ${commentsResult.error.message}`);
        setIsLoading(false);
        return;
      }

      const nextPost = postResult.data as ReplayCoachingPost;
      if (blockedIds.includes(nextPost.user_id)) {
        setIsBlocked(true);
        setPost(null);
        setComments([]);
        setMessage("ブロック中のユーザーの投稿です。");
        setIsLoading(false);
        return;
      }

      setIsBlocked(false);
      setPost(nextPost);
      setComments(
        ((commentsResult.data ?? []) as ReplayCoachingComment[]).filter(
          (comment) => !blockedIds.includes(comment.user_id),
        ),
      );
      setMessage(
        activeSession?.user
          ? "コメントできます。返信する場合は対象コメントの返信リンクを押してください。"
          : "コメントするにはログインしてください。",
      );
      setIsLoading(false);
    }

    loadThread().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setMessage(`読み込みに失敗しました: ${getMessageFromError(error)}`);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);

      loadThread(nextSession).catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setMessage(`読み込みに失敗しました: ${getMessageFromError(error)}`);
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [postId, supabase]);

  async function reloadThread() {
    if (!supabase || !postId) {
      return;
    }

    const [postResult, commentsResult] = await Promise.all([
      supabase
        .from("replay_review_posts")
        .select(
          "id, user_id, author_name, title, character_name, current_rank, current_mr, replay_id, body, status, created_at",
        )
        .eq("id", postId)
        .maybeSingle(),
      supabase
        .from("replay_review_comments")
        .select("id, post_id, user_id, author_name, body, reply_to_no, created_at")
        .eq("post_id", postId)
        .order("id", { ascending: true }),
    ]);

    if (postResult.error) {
      throw postResult.error;
    }

    if (commentsResult.error) {
      throw commentsResult.error;
    }

    setPost((postResult.data ?? null) as ReplayCoachingPost | null);
    setComments((commentsResult.data ?? []) as ReplayCoachingComment[]);
  }

  function getAuthorName() {
    if (!session?.user) {
      return "ゲスト";
    }

    const fromMetadata = String(session.user.user_metadata.display_name ?? "").trim();
    if (fromMetadata) {
      return fromMetadata;
    }

    const email = session.user.email ?? "";
    return email.split("@")[0] || "プレイヤー";
  }

  function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user || !post) {
      setMessage("コメントするにはログインが必要です。");
      return;
    }

    if (post.status !== "open") {
      setMessage("終了済みの投稿にはコメントできません。");
      return;
    }

    const trimmedBody = commentBody.trim();
    if (!trimmedBody) {
      setMessage("コメント本文を入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.from("replay_review_comments").insert({
          post_id: post.id,
          user_id: session.user.id,
          author_name: getAuthorName(),
          body: trimmedBody,
          reply_to_no: replyToNo,
        });

        if (error) {
          throw error;
        }

        setCommentBody("");
        setReplyToNo(null);
        await reloadThread();
        setMessage("コメントを投稿しました。");
      } catch (error: unknown) {
        setMessage(`コメント投稿に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header className="panel rounded-[28px] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Image src="/logo-white.svg" alt="Rush Link" width={148} height={32} />
          <Link
            href="/#replay-review"
            className="secondary-action min-h-0 px-4 py-2 text-sm"
          >
            トップへ戻る
          </Link>
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{message}</p>
        </header>

        {isLoading ? (
          <section className="panel rounded-[30px] px-6 py-6">
            <p className="text-sm text-[var(--muted)]">読み込み中...</p>
          </section>
        ) : isBlocked ? (
          <section className="panel rounded-[30px] px-6 py-6">
            <p className="text-sm text-[var(--muted)]">
              ブロック中のユーザーの投稿は表示していません。
            </p>
          </section>
        ) : !post ? (
          <section className="panel rounded-[30px] px-6 py-6">
            <p className="text-sm text-[var(--muted)]">投稿が見つかりません。</p>
          </section>
        ) : (
          <>
            <section className="panel rounded-[30px] px-6 py-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--secondary)]/15 px-3 py-1 text-xs text-[var(--secondary)]">
                  リプレイコーチング
                </span>
                <CharacterChip name={post.character_name} />
              </div>

              <h1 className="mt-4 text-3xl font-bold text-white">{post.title}</h1>
              <p className="mt-3 text-sm text-[var(--muted)]">
                <Link
                  href={`/players/${post.user_id}`}
                  className="text-[var(--accent-soft)] underline underline-offset-4"
                >
                  {post.author_name}
                </Link>{" "}
                / {post.current_rank}
                {post.current_rank === "マスター" && post.current_mr
                  ? ` / MR ${post.current_mr}`
                  : ""}
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--accent-soft)]">
                Replay ID: {post.replay_id}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]/80">
                投稿日時: {formatPostedAt(post.created_at)}
              </p>
              <p className="mt-5 text-sm leading-8 text-[var(--muted)]">{post.body}</p>

              <ModerationActions
                targetUserId={post.user_id}
                targetName={post.author_name}
                targetKind="replay_review"
                targetSource="replay_review_posts"
                targetId={post.id}
                targetTitle={post.title}
              />
            </section>

            <section className="panel rounded-[30px] px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">コメント {comments.length}件</h2>
                {post.status !== "open" ? (
                  <span className="text-xs text-[var(--muted)]">
                    終了済みのため新規コメントはできません
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">まだコメントはありません。</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-[20px] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-white">No.{comment.id}</span>
                        <span className="text-[var(--muted)]">{comment.author_name}</span>
                        {comment.reply_to_no ? (
                          <span className="text-[var(--accent-soft)]">
                            No.{comment.reply_to_no} への返信
                          </span>
                        ) : null}
                        <span className="text-[var(--muted)]/80">
                          {formatPostedAt(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {comment.body}
                      </p>
                      {session?.user && post.status === "open" ? (
                        <button
                          type="button"
                          onClick={() => setReplyToNo(comment.id)}
                          className="mt-3 text-xs text-[var(--accent-soft)] underline underline-offset-4"
                        >
                          No.{comment.id} に返信する
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {session?.user ? (
                post.status === "open" ? (
                  <form className="mt-5 grid gap-3" onSubmit={handleCommentSubmit}>
                    {replyToNo ? (
                      <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--muted)]">
                        No.{replyToNo} への返信として投稿されます。
                        <button
                          type="button"
                          onClick={() => setReplyToNo(null)}
                          className="ml-2 text-[var(--accent-soft)] underline underline-offset-4"
                        >
                          解除
                        </button>
                      </div>
                    ) : null}
                    <textarea
                      value={commentBody}
                      onChange={(event) => setCommentBody(event.target.value)}
                      className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                      placeholder="コメントを入力してください。"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="primary-action"
                    >
                      {isPending ? "送信中..." : "コメントする"}
                    </button>
                  </form>
                ) : null
              ) : (
                <p className="mt-5 text-sm text-[var(--muted)]">
                  コメントするにはログインしてください。
                </p>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
