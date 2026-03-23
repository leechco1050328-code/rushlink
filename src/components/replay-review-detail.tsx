"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { PostContactChips } from "@/components/post-contact-chips";
import { getBlockedUserIds } from "@/lib/moderation";
import { loadProfileContacts, type ProfileContactMap } from "@/lib/profile-contacts";
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

  return "予期しないエラーが発生しました。";
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
  const [contacts, setContacts] = useState<ProfileContactMap>({});
  const [isBlocked, setIsBlocked] = useState(false);
  const [replyToNo, setReplyToNo] = useState<number | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [message, setMessage] = useState("読み込み中です...");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setMessage("Supabase の設定が入っていません。");
      return;
    }

    if (!postId) {
      setIsLoading(false);
      setMessage("投稿IDが不正です。");
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadThread(nextSession?: Session | null) {
      const activeSession =
        nextSession ??
        (await client.auth.getSession().then(({ data }) => data.session)) ??
        null;

      if (!mounted) {
        return;
      }

      setSession(activeSession);
      const blockedIds = activeSession?.user ? await getBlockedUserIds(client, activeSession.user.id) : [];

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

      if (!mounted) {
        return;
      }

      if (postResult.error) {
        setMessage(`読み込みに失敗しました: ${postResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (!postResult.data) {
        setMessage("投稿が見つかりません。");
        setIsLoading(false);
        return;
      }

      if (commentsResult.error) {
        setMessage(`コメント取得に失敗しました: ${commentsResult.error.message}`);
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

      const nextContacts = await loadProfileContacts(client, [nextPost.user_id]);

      if (!mounted) {
        return;
      }

      setIsBlocked(false);
      setPost(nextPost);
      setContacts(nextContacts);
      setComments(
        ((commentsResult.data ?? []) as ReplayCoachingComment[]).filter(
          (comment) => !blockedIds.includes(comment.user_id),
        ),
      );
      setMessage(
        activeSession?.user
          ? "コメントできます。返信する場合はコメントの返信リンクを押してください。"
          : "コメントするにはログインしてください。",
      );
      setIsLoading(false);
    }

    loadThread().catch((error: unknown) => {
      if (!mounted) {
        return;
      }

      setMessage(getMessageFromError(error));
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);
      loadThread(nextSession).catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        setMessage(getMessageFromError(error));
        setIsLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [postId, supabase]);

  async function reloadThread() {
    if (!supabase || !postId) {
      return;
    }

    const client = supabase;
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

    if (postResult.error) {
      throw postResult.error;
    }

    if (commentsResult.error) {
      throw commentsResult.error;
    }

    const nextPost = (postResult.data ?? null) as ReplayCoachingPost | null;
    setPost(nextPost);
    setComments((commentsResult.data ?? []) as ReplayCoachingComment[]);
    setContacts(await loadProfileContacts(client, nextPost ? [nextPost.user_id] : []));
  }

  function getAuthorName() {
    if (!session?.user) {
      return "ゲスト";
    }

    const displayName = String(session.user.user_metadata.display_name ?? "").trim();
    if (displayName) {
      return displayName;
    }

    return (session.user.email ?? "").split("@")[0] || "プレイヤー";
  }

  function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user || !post) {
      setMessage("コメントするにはログインしてください。");
      return;
    }

    const client = supabase;
    if (post.status !== "open") {
      setMessage("受付中の投稿にのみコメントできます。");
      return;
    }

    const trimmedBody = commentBody.trim();
    if (!trimmedBody) {
      setMessage("コメント本文を入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await client.from("replay_review_comments").insert({
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
            <Link href="/#replay-review" className="secondary-action min-h-0 px-4 py-2 text-sm">
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
            <p className="text-sm text-[var(--muted)]">ブロック中のユーザーの投稿は表示されません。</p>
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
                <Link href={`/players/${post.user_id}`} className="text-[var(--accent-soft)] underline underline-offset-4">
                  {post.author_name}
                </Link>{" "}
                / {post.current_rank}
                {post.current_rank === "マスター" && post.current_mr ? ` / MR ${post.current_mr}` : ""}
              </p>
              <PostContactChips userId={post.user_id} contacts={contacts} />
              <p className="mt-2 font-mono text-sm text-[var(--accent-soft)]">Replay ID: {post.replay_id}</p>
              <p className="mt-1 text-xs text-[var(--muted)]/80">投稿日: {formatPostedAt(post.created_at)}</p>
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
                {replyToNo ? (
                  <button
                    type="button"
                    onClick={() => setReplyToNo(null)}
                    className="secondary-action min-h-0 px-4 py-2 text-sm"
                  >
                    返信先を解除
                  </button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4">
                {comments.length === 0 ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
                    まだコメントはありません。
                  </div>
                ) : (
                  comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold text-white">No.{comment.id}</span>
                        <span className="text-sm text-[var(--muted)]">{comment.author_name}</span>
                        {comment.reply_to_no ? (
                          <span className="text-sm text-[var(--accent-soft)]">
                            No.{comment.reply_to_no} への返信
                          </span>
                        ) : null}
                        <span className="text-xs text-[var(--muted)]/80">
                          {formatPostedAt(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{comment.body}</p>
                      <button
                        type="button"
                        onClick={() => setReplyToNo(comment.id)}
                        className="mt-4 text-sm text-[var(--accent-soft)] underline underline-offset-4"
                      >
                        No.{comment.id} に返信する
                      </button>
                    </article>
                  ))
                )}
              </div>

              <form className="mt-6 grid gap-4" onSubmit={handleCommentSubmit}>
                {replyToNo ? (
                  <p className="text-sm text-[var(--muted)]">返信先: No.{replyToNo}</p>
                ) : null}
                <label>
                  <span className="mb-2 block text-sm text-[var(--muted)]">コメント本文</span>
                  <textarea
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                    placeholder="気になった点や改善案を書いてください。"
                    required
                  />
                </label>
                <button type="submit" disabled={isPending} className="primary-action disabled:opacity-60">
                  {isPending ? "投稿中..." : "コメントする"}
                </button>
              </form>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
