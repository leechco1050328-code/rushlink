"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { PostContactChips } from "@/components/post-contact-chips";
import { SharePostActions } from "@/components/share-post-actions";
import { getBlockedUserIds } from "@/lib/moderation";
import { loadProfileContacts, type ProfileContactMap } from "@/lib/profile-contacts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type DetailKind = "recruitment" | "coaching";

type DetailPost = {
  id: number;
  user_id: string;
  author_name: string;
  title: string;
  character_name: string;
  self_rank?: string;
  self_mr?: string;
  opponent_character_name?: string;
  opponent_rank?: string;
  opponent_mr?: string;
  voice_option?: string;
  platform?: string;
  current_rank?: string;
  current_mr?: string;
  focus_topic?: string;
  lesson_method?: string;
  availability_start: string;
  availability_end: string;
  body: string;
  status: string;
  created_at: string;
};

function formatAvailability(start: string, end: string) {
  return start === "何時でも可" ? start : end ? `${start} - ${end}` : start;
}

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

  return "予期しないエラーが発生しました。";
}

export function CommunityPostDetail({
  kind,
  postId,
}: {
  kind: DetailKind;
  postId: number | null;
}) {
  const supabase = getSupabaseBrowserClient();
  const [post, setPost] = useState<DetailPost | null>(null);
  const [contacts, setContacts] = useState<ProfileContactMap>({});
  const [isBlocked, setIsBlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
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

    async function loadDetail() {
      const {
        data: { session },
      } = await client.auth.getSession();

      const blockedIds = session?.user?.id ? await getBlockedUserIds(client, session.user.id) : [];
      const source = kind === "recruitment" ? "recruitment_posts" : "coaching_posts";
      const columns =
        kind === "recruitment"
          ? "id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at"
          : "id, user_id, author_name, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at";

      const { data, error } = await client.from(source).select(columns).eq("id", postId).maybeSingle();

      if (!mounted) {
        return;
      }

      if (error) {
        setMessage(`読み込みに失敗しました: ${error.message}`);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setMessage("投稿が見つかりません。");
        setIsLoading(false);
        return;
      }

      const nextPost = data as unknown as DetailPost;
      if (blockedIds.includes(nextPost.user_id)) {
        setIsBlocked(true);
        setPost(null);
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
      setIsOwner(session?.user?.id === nextPost.user_id);
      setMessage("投稿詳細を表示しています。");
      setIsLoading(false);
    }

    loadDetail().catch((error: unknown) => {
      if (!mounted) {
        return;
      }

      setMessage(getMessageFromError(error));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [kind, postId, supabase]);

  function handleDelete() {
    if (!supabase || !post) {
      return;
    }

    const client = supabase;
    const source = kind === "recruitment" ? "recruitment_posts" : "coaching_posts";

    startTransition(async () => {
      try {
        const { error } = await client.from(source).delete().eq("id", post.id);
        if (error) {
          throw error;
        }

        window.location.href = "/board";
      } catch (error: unknown) {
        setMessage(`削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header className="panel rounded-[28px] px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Image src="/logo-white.svg" alt="Rush Link" width={148} height={32} />
            <Link href="/board" className="secondary-action min-h-0 px-4 py-2 text-sm">
              募集一覧へ戻る
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
          <section className="panel rounded-[30px] px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--secondary)]/15 px-3 py-1 text-xs text-[var(--secondary)]">
                    {kind === "recruitment" ? "対戦募集" : "教えたい / 教わりたい"}
                  </span>
                  <CharacterChip name={post.character_name} />
                </div>
                <h1 className="mt-4 text-3xl font-bold text-white">{post.title}</h1>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  投稿者:
                  <Link href={`/players/${post.user_id}`} className="ml-1 text-[var(--accent-soft)] underline underline-offset-4">
                    {post.author_name}
                  </Link>
                </p>
                <PostContactChips userId={post.user_id} contacts={contacts} />
                <p className="mt-3 text-sm text-[var(--muted)]">
                  募集時間: {formatAvailability(post.availability_start, post.availability_end)}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]/80">
                  投稿日: {formatPostedAt(post.created_at)}
                </p>
              </div>

              {isOwner ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <SharePostActions title={post.title} path={`/board/${kind}/${post.id}`} />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {isPending ? "削除中..." : "削除"}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {kind === "recruitment" ? (
                <>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-[var(--muted)]">自分のランク</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {post.self_rank || "未設定"}
                      {post.self_rank === "マスター" && post.self_mr ? ` / MR ${post.self_mr}` : ""}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-[var(--muted)]">通話 / プラットフォーム</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {post.voice_option || "未設定"} / {post.platform || "未設定"}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 md:col-span-2">
                    <p className="text-sm text-[var(--muted)]">相手条件</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-lg font-semibold text-white">
                      <CharacterChip name={post.opponent_character_name} size="md" />
                      <span>
                        {post.opponent_character_name ? "" : "任意"}
                        {post.opponent_rank ? ` / ${post.opponent_rank}` : ""}
                        {post.opponent_mr ? ` / MR ${post.opponent_mr}` : ""}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-[var(--muted)]">現在のランク</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {post.current_rank || "未設定"}
                      {post.current_rank === "マスター" && post.current_mr ? ` / MR ${post.current_mr}` : ""}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-[var(--muted)]">方法</p>
                    <p className="mt-2 text-lg font-semibold text-white">{post.lesson_method || "未設定"}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 md:col-span-2">
                    <p className="text-sm text-[var(--muted)]">教えてほしい / 教えたい内容</p>
                    <p className="mt-2 text-lg font-semibold text-white">{post.focus_topic || "未設定"}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-[var(--muted)]">本文</p>
              <p className="mt-3 text-sm leading-8 text-[var(--muted)]">{post.body}</p>
            </div>

            {!isOwner ? (
              <ModerationActions
                targetUserId={post.user_id}
                targetName={post.author_name}
                targetKind="community_post"
                targetSource={kind === "recruitment" ? "recruitment_posts" : "coaching_posts"}
                targetId={post.id}
                targetTitle={post.title}
              />
            ) : null}
          </section>
        )}
      </section>
    </main>
  );
}
