"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { CHARACTER_OPTIONS } from "@/lib/characters";
import { hasSavedProfile } from "@/lib/has-saved-profile";
import { getBlockedUserIds, isBannedUser } from "@/lib/moderation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ReplayCoachingForm = {
  title: string;
  character_name: string;
  current_rank: string;
  current_mr: string;
  replay_id: string;
  body: string;
};

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
};

const defaultForm: ReplayCoachingForm = {
  title: "",
  character_name: "",
  current_rank: "",
  current_mr: "1500",
  replay_id: "",
  body: "",
};

const characterOptions = [...CHARACTER_OPTIONS];

const rankOptions = [
  "ルーキー",
  "アイアン",
  "ブロンズ",
  "シルバー",
  "ゴールド",
  "プラチナ",
  "ダイヤ",
  "マスター",
  "レジェンド",
];

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

type ReplayReviewBoardProps = {
  currentPage?: number;
  listLimit?: number;
  pageSize?: number;
  listPageHref?: string;
  showComposer?: boolean;
  multiColumnList?: boolean;
};

export function ReplayReviewBoard({
  currentPage = 1,
  listLimit,
  pageSize,
  listPageHref = "/replay-review",
  showComposer = true,
  multiColumnList = false,
}: ReplayReviewBoardProps = {}) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [posts, setPosts] = useState<ReplayCoachingPost[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isBanned, setIsBanned] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [form, setForm] = useState<ReplayCoachingForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [, setMessage] = useState(
    "ログインすると、リプレイコーチングを依頼できます。",
  );
  const [isPending, startTransition] = useTransition();
  const safePage = Math.max(1, currentPage);
  const filteredPosts = posts.filter((post) => !blockedUserIds.includes(post.user_id));
  const totalPages = pageSize ? Math.max(1, Math.ceil(filteredPosts.length / pageSize)) : 1;
  const clampedPage = Math.min(safePage, totalPages);
  const visiblePosts = pageSize
    ? filteredPosts.slice((clampedPage - 1) * pageSize, clampedPage * pageSize)
    : listLimit
      ? filteredPosts.slice(0, listLimit)
      : filteredPosts;
  const hasMorePosts = listLimit ? filteredPosts.length > listLimit : false;

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setMessage("Supabase の設定情報がまだ入っていません。");
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function loadProfileState(activeSession: Session | null) {
      if (!activeSession?.user) {
        return false;
      }

      const { data, error } = await client
        .from("profiles")
        .select("display_name, main_character, sub_character, bio")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `プロフィール確認に失敗しました。docs/profile-setup.sql を Supabase の SQL Editor で実行してください。詳細: ${error.message}`,
        );
      }

      return hasSavedProfile(data);
    }

    async function loadBoard(nextSession?: Session | null) {
      const activeSession =
        nextSession ??
        (await client.auth.getSession().then(({ data }) => data.session)) ??
        null;

      if (!isMounted) {
        return;
      }

      setSession(activeSession);

      const nextHasProfile = await loadProfileState(activeSession);
      const nextBlockedUserIds = activeSession?.user
        ? await getBlockedUserIds(client, activeSession.user.id)
        : [];
      const nextIsBanned = activeSession?.user
        ? await isBannedUser(client, activeSession.user.id)
        : false;
      if (!isMounted) {
        return;
      }
      setHasProfile(nextHasProfile);
      setBlockedUserIds(nextBlockedUserIds);
      setIsBanned(nextIsBanned);

      const [postsResult, commentsResult] = await Promise.all([
        client
          .from("replay_review_posts")
          .select(
            "id, user_id, author_name, title, character_name, current_rank, current_mr, replay_id, body, status, created_at",
          )
          .order("created_at", { ascending: false }),
        client.from("replay_review_comments").select("id, post_id"),
      ]);

      if (!isMounted) {
        return;
      }

      if (postsResult.error) {
        setPosts([]);
        setCommentCounts({});
        setMessage(
          `リプレイコーチングボードの読み込みに失敗しました。docs/replay-review-setup.sql を Supabase の SQL Editor で実行してください。詳細: ${postsResult.error.message}`,
        );
        setIsLoading(false);
        return;
      }

      if (commentsResult.error) {
        setPosts([]);
        setCommentCounts({});
        setMessage(
          `リプレイコーチングコメント数の読み込みに失敗しました。docs/replay-review-setup.sql を Supabase の SQL Editor で再実行してください。詳細: ${commentsResult.error.message}`,
        );
        setIsLoading(false);
        return;
      }

      const nextPosts = (postsResult.data ?? []) as ReplayCoachingPost[];
      const nextComments = (commentsResult.data ?? []) as ReplayCoachingComment[];
      const nextCounts = nextComments.reduce<Record<number, number>>((result, comment) => {
        result[comment.post_id] = (result[comment.post_id] ?? 0) + 1;
        return result;
      }, {});

      setPosts(nextPosts);
      setCommentCounts(nextCounts);
      setMessage(
        activeSession?.user
          ? nextIsBanned
            ? "このアカウントは現在利用停止中です。"
            : nextHasProfile
            ? "ログイン中です。リプレイコーチングを依頼できます。"
            : "先にプロフィールを保存してください。保存後に依頼を投稿できます。"
          : "一覧は閲覧できます。投稿にはログインしてください。",
      );
      setIsLoading(false);
    }

    loadBoard().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setMessage(
        `リプレイコーチングボードの読み込みに失敗しました: ${getMessageFromError(error)}`,
      );
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);

      loadBoard(nextSession).catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setMessage(
          `リプレイコーチングボードの読み込みに失敗しました: ${getMessageFromError(error)}`,
        );
        setIsLoading(false);
      });
    });

    function handleProfileSaved() {
      setIsLoading(true);

      loadBoard().catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setMessage(
          `リプレイコーチングボードの読み込みに失敗しました: ${getMessageFromError(error)}`,
        );
        setIsLoading(false);
      });
    }

    window.addEventListener("profile:saved", handleProfileSaved);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("profile:saved", handleProfileSaved);
    };
  }, [supabase]);

  function updateField<Key extends keyof ReplayCoachingForm>(
    key: Key,
    value: ReplayCoachingForm[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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

  async function reloadPosts() {
    if (!supabase) {
      return;
    }

    const [postsResult, commentsResult] = await Promise.all([
      supabase
        .from("replay_review_posts")
        .select(
          "id, user_id, author_name, title, character_name, current_rank, current_mr, replay_id, body, status, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("replay_review_comments").select("id, post_id"),
    ]);

    if (postsResult.error) {
      throw postsResult.error;
    }

    if (commentsResult.error) {
      throw commentsResult.error;
    }

    const nextPosts = (postsResult.data ?? []) as ReplayCoachingPost[];
    const nextComments = (commentsResult.data ?? []) as ReplayCoachingComment[];
    const nextCounts = nextComments.reduce<Record<number, number>>((result, comment) => {
      result[comment.post_id] = (result[comment.post_id] ?? 0) + 1;
      return result;
    }, {});

    setPosts(nextPosts);
    setCommentCounts(nextCounts);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user) {
      setMessage("投稿するにはログインが必要です。");
      return;
    }

    if (isBanned) {
      setMessage("このアカウントは現在利用停止中のため投稿できません。");
      return;
    }

    if (!hasProfile) {
      setMessage("先にプロフィールを保存してください。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.from("replay_review_posts").insert({
          user_id: session.user.id,
          author_name: getAuthorName(),
          title: form.title.trim(),
          character_name: form.character_name,
          current_rank: form.current_rank,
          current_mr: form.current_rank === "マスター" ? form.current_mr : "",
          replay_id: form.replay_id.trim(),
          body: form.body.trim(),
          status: "open",
          updated_at: new Date().toISOString(),
        });

        if (error) {
          throw error;
        }

        setForm(defaultForm);
        await reloadPosts();
        setMessage("リプレイコーチング依頼を投稿しました。");
      } catch (error: unknown) {
        setMessage(`投稿に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleDelete(postId: number) {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("replay_review_posts")
          .delete()
          .eq("id", postId);

        if (error) {
          throw error;
        }

        await reloadPosts();
        setMessage("リプレイコーチング依頼を削除しました。");
      } catch (error: unknown) {
        setMessage(`投稿の削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <div className={showComposer ? "grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" : "grid gap-6"}>
      {showComposer ? (
      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start gap-4">
          <div>
            <p className="display text-2xl text-white">リプレイコーチングを依頼する</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              リプレイURLではなく、ゲーム内のリプレイIDを入力して相談できます。
            </p>
          </div>
        </div>

        {!session?.user ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            ログインすると、リプレイコーチング依頼を投稿できます。
          </div>
        ) : isBanned ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            このアカウントは現在利用停止中です。管理者に確認してください。
          </div>
        ) : !hasProfile ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            先にプロフィールを保存してください。保存後にリプレイコーチング依頼を投稿できます。
            <a
              href="/profile"
              className="ml-2 text-[var(--accent-soft)] underline underline-offset-4"
            >
              プロフィール編集へ
            </a>
          </div>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">投稿タイトル</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="例: 豪鬼戦の立ち回りを見てほしい"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">使用キャラクター</span>
                <select
                  value={form.character_name}
                  onChange={(event) => updateField("character_name", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
                >
                  <option value="">選択してください</option>
                  {characterOptions.map((character) => (
                    <option key={character} value={character}>
                      {character}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">現在のランク</span>
                <select
                  value={form.current_rank}
                  onChange={(event) => {
                    updateField("current_rank", event.target.value);
                    updateField("current_mr", "1500");
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
                >
                  <option value="">選択してください</option>
                  {rankOptions.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {form.current_rank === "マスター" ? (
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">現在のMR</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="800"
                  max="2600"
                  step="50"
                  value={form.current_mr}
                  onChange={(event) => updateField("current_mr", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">リプレイID</span>
              <input
                value={form.replay_id}
                onChange={(event) => updateField("replay_id", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="例: 4A7B9C2D"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">見てほしいポイント</span>
              <textarea
                value={form.body}
                onChange={(event) => updateField("body", event.target.value)}
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="例: 対空が遅れる場面と、画面端での守り方を見てほしいです。"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="primary-action"
            >
              {isPending ? "投稿中..." : "リプレイコーチングを依頼する"}
            </button>
          </form>
        )}
      </section>
      ) : null}

      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="display text-2xl text-white">リプレイコーチング一覧</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              投稿を開くと、詳細画面でコメントと返信ができます。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="pill-button rounded-full bg-white/8 px-3 py-2 text-xs text-[var(--muted)]">
              {filteredPosts.length} 件
            </span>
            {listPageHref ? (
              <Link
                href={listPageHref}
                className="pill-button rounded-full border border-white/10 px-4 py-2 text-xs text-[var(--accent-soft)] transition-colors hover:bg-white/8"
              >
                一覧ページへ
              </Link>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-[var(--muted)]">一覧を読み込み中...</p>
        ) : posts.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            まだリプレイコーチング依頼はありません。
          </div>
        ) : (
          <div className={`mt-6 grid gap-4 ${multiColumnList ? "[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]" : ""}`}>
            {visiblePosts.map((post) => {
              const isOwner = session?.user?.id === post.user_id;
              const commentCount = commentCounts[post.id] ?? 0;

              return (
                <article
                  key={post.id}
                  className="rounded-[28px] border border-white/10 bg-black/25 p-5 transition-all hover:border-[var(--accent)]/40 hover:bg-black/30"
                >
                  <Link
                    href={`/replay-review/${post.id}`}
                    className="group block rounded-[20px] outline-none"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="pill-button rounded-full bg-[var(--secondary)]/15 px-3 py-2 text-xs text-[var(--secondary)]">
                        リプレイコーチング
                      </span>
                      <CharacterChip name={post.character_name} />
                    </div>

                    <h3 className="mt-3 text-xl font-semibold text-white">{post.title}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {post.author_name} / {post.current_rank}
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
                    <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{post.body}</p>
                    <p className="mt-4 text-sm font-semibold text-white">
                      コメント {commentCount}件
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--muted)] transition-colors group-hover:border-[var(--accent)]/30 group-hover:text-white">
                      <span>タップ / クリックで詳細とコメントを見る</span>
                      <span className="text-[var(--accent-soft)]">→</span>
                    </div>
                  </Link>

                  {isOwner ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        disabled={isPending}
                        className="rounded-full border border-[var(--accent)]/30 px-4 py-2 text-sm text-[var(--accent-soft)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-60"
                      >
                        削除
                      </button>
                    </div>
                  ) : (
                    <ModerationActions
                      targetUserId={post.user_id}
                      targetName={post.author_name}
                      targetKind="replay_review"
                      targetSource="replay_review_posts"
                      targetId={post.id}
                      targetTitle={post.title}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
        {hasMorePosts ? (
          <div className="mt-5 flex justify-center">
            <Link
              href={listPageHref}
              className="secondary-action"
            >
              もっと見る
            </Link>
          </div>
        ) : null}
        {pageSize && totalPages > 1 ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const active = page === clampedPage;
              return (
                <Link
                  key={page}
                  href={`${listPageHref}?page=${page}`}
                  className={`pill-button rounded-full px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "border border-white/10 text-[var(--muted)] hover:bg-white/8"
                  }`}
                >
                  {page}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
