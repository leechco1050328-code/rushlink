"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { PostContactChips } from "@/components/post-contact-chips";
import { SharePostActions } from "@/components/share-post-actions";
import {
  getApplicationActionLabel,
  type ApplicationKind,
  type ApplicationSource,
} from "@/lib/community-applications";
import { hasSavedProfile } from "@/lib/has-saved-profile";
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
  post_type?: "教えたい" | "教わりたい";
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

  return "エラーが発生しました。";
}

function getPostKind(kind: DetailKind, post: DetailPost): ApplicationKind {
  if (kind === "recruitment") {
    return "対戦募集";
  }

  return post.post_type === "教わりたい" ? "教わりたい" : "教えたい";
}

function getPostSource(kind: DetailKind): ApplicationSource {
  return kind === "recruitment" ? "recruitment_posts" : "coaching_posts";
}

export function CommunityPostDetail({
  kind,
  postId,
}: {
  kind: DetailKind;
  postId: number | null;
}) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [post, setPost] = useState<DetailPost | null>(null);
  const [contacts, setContacts] = useState<ProfileContactMap>({});
  const [hasProfile, setHasProfile] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
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
        data: { session: activeSession },
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      const profileResult = activeSession?.user
        ? await client
            .from("profiles")
            .select("display_name, main_character, sub_character, bio")
            .eq("user_id", activeSession.user.id)
            .maybeSingle()
        : null;
      const blockedIds = activeSession?.user?.id ? await getBlockedUserIds(client, activeSession.user.id) : [];
      const result =
        kind === "recruitment"
          ? await client
              .from("recruitment_posts")
              .select(
                "id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at",
              )
              .eq("id", postId)
              .maybeSingle()
          : await client
              .from("coaching_posts")
              .select(
                "id, user_id, author_name, post_type, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at",
              )
              .eq("id", postId)
              .maybeSingle();

      const { data, error } = result;

      if (!mounted) {
        return;
      }

      if (profileResult?.error) {
        setHasProfile(false);
      } else {
        setHasProfile(hasSavedProfile(profileResult?.data ?? null));
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
      setIsOwner(activeSession?.user?.id === nextPost.user_id);
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

    const source = getPostSource(kind);

    startTransition(async () => {
      try {
        const { error } = await supabase.from(source).delete().eq("id", post.id);
        if (error) {
          throw error;
        }

        window.location.href = "/board";
      } catch (error: unknown) {
        setMessage(`削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user || !post) {
      setMessage("応募するにはログインしてください。");
      return;
    }

    if (isOwner) {
      setMessage("自分の投稿には応募できません。");
      return;
    }

    if (!hasProfile) {
      setMessage("応募する前にプロフィールを保存してください。");
      return;
    }

    const trimmedMessage = applicationMessage.trim();
    if (!trimmedMessage) {
      setMessage("応募メッセージを入力してください。");
      return;
    }

    const postKind = getPostKind(kind, post);
    const applicationType = getApplicationActionLabel(postKind);

    startTransition(async () => {
      try {
        const displayName = String(session.user.user_metadata.display_name ?? "").trim();
        const applicantName = displayName || (session.user.email ?? "").split("@")[0] || "プレイヤー";

        const { error } = await supabase.from("community_post_applications").insert({
          post_source: getPostSource(kind),
          post_id: post.id,
          post_owner_id: post.user_id,
          post_title: post.title,
          post_kind: postKind,
          post_character_name: post.character_name,
          applicant_user_id: session.user.id,
          applicant_name: applicantName,
          application_type: applicationType,
          message: trimmedMessage,
        });

        if (error) {
          throw error;
        }

        setApplicationMessage("");
        setMessage("応募を送りました。相手の通知ページに表示されます。");
      } catch (error: unknown) {
        const maybeCode = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        if (maybeCode === "23505") {
          setMessage("この投稿にはすでに応募済みです。");
          return;
        }
        setMessage(`応募に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  if (isLoading) {
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
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">読み込み中...</p>
          </header>
        </section>
      </main>
    );
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

        {isBlocked ? (
          <section className="panel rounded-[30px] px-6 py-6">
            <p className="text-sm text-[var(--muted)]">ブロック中のユーザーの投稿です。</p>
          </section>
        ) : !post ? (
          <section className="panel rounded-[30px] px-6 py-6">
            <p className="text-sm text-[var(--muted)]">投稿が見つかりません。</p>
          </section>
        ) : (
          <>
            <section className="panel rounded-[30px] px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--secondary)]/15 px-3 py-1 text-xs text-[var(--secondary)]">
                      {getPostKind(kind, post)}
                    </span>
                    <CharacterChip name={post.character_name} />
                  </div>
                  <h1 className="mt-4 text-3xl font-bold text-white">{post.title}</h1>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    投稿者:
                    <Link
                      href={`/players/${post.user_id}`}
                      className="ml-1 text-[var(--accent-soft)] underline underline-offset-4"
                    >
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
                      <p className="text-sm text-[var(--muted)]">内容</p>
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
                  targetSource={getPostSource(kind)}
                  targetId={post.id}
                  targetTitle={post.title}
                />
              ) : null}
            </section>

            {!isOwner ? (
              <section className="panel rounded-[30px] px-6 py-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-white">
                    {getApplicationActionLabel(getPostKind(kind, post))}
                  </h2>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    応募すると、投稿者の通知ページと自分の投稿管理画面に反映されます。
                  </p>
                </div>

                <form className="mt-5 grid gap-4" onSubmit={handleApplicationSubmit}>
                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">応募メッセージ</span>
                    <textarea
                      value={applicationMessage}
                      onChange={(event) => setApplicationMessage(event.target.value)}
                      className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                      placeholder="対戦したい時間帯や、教えてほしい内容 / 教えられる内容を書いてください。"
                      required
                    />
                  </label>

                  {!session?.user ? (
                    <p className="text-sm text-[var(--muted)]">応募するにはログインしてください。</p>
                  ) : !hasProfile ? (
                    <p className="text-sm text-[var(--muted)]">
                      応募する前にプロフィールを保存してください。SNS連絡先も一緒に伝わります。
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isPending || !session?.user || !hasProfile}
                    className="primary-action disabled:opacity-60"
                  >
                    {isPending
                      ? "送信中..."
                      : getApplicationActionLabel(getPostKind(kind, post))}
                  </button>
                </form>
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
