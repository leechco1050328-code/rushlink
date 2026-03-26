"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { PostContactChips } from "@/components/post-contact-chips";
import { CHARACTER_OPTIONS } from "@/lib/characters";
import { hasSavedProfile } from "@/lib/has-saved-profile";
import { getBlockedUserIds, isBannedUser } from "@/lib/moderation";
import { loadProfileContacts, type ProfileContactMap } from "@/lib/profile-contacts";
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

const rankOptions = ["ルーキー", "アイアン", "ブロンズ", "シルバー", "ゴールド", "プラチナ", "ダイヤ", "マスター", "レジェンド"];

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

function buildPageHref(baseHref: string, page: number) {
  return `${baseHref}?page=${page}`;
}

function buildGeneratedReplayTitle(form: ReplayCoachingForm) {
  return `${form.character_name || "キャラ未設定"} / ${form.current_rank || "ランク未設定"}`;
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
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
  const [isBanned, setIsBanned] = useState(false);
  const [posts, setPosts] = useState<ReplayCoachingPost[]>([]);
  const [contacts, setContacts] = useState<ProfileContactMap>({});
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [dailyCount, setDailyCount] = useState(0);
  const [form, setForm] = useState<ReplayCoachingForm>(defaultForm);
  const [, setMessage] = useState("ログインするとリプレイコーチングを依頼できます。");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const filteredPosts = useMemo(
    () => posts.filter((post) => !blockedUserIds.includes(post.user_id)),
    [blockedUserIds, posts],
  );
  const safePage = Math.max(1, currentPage);
  const totalPages = pageSize ? Math.max(1, Math.ceil(filteredPosts.length / pageSize)) : 1;
  const clampedPage = Math.min(safePage, totalPages);
  const visiblePosts = useMemo(() => {
    if (pageSize) {
      const startIndex = (clampedPage - 1) * pageSize;
      return filteredPosts.slice(startIndex, startIndex + pageSize);
    }

    if (listLimit) {
      return filteredPosts.slice(0, listLimit);
    }

    return filteredPosts;
  }, [clampedPage, filteredPosts, listLimit, pageSize]);
  const hasMorePosts = listLimit ? filteredPosts.length > listLimit : false;

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setMessage("Supabase の設定が入っていません。");
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadBoard(nextSession?: Session | null) {
      const activeSession =
        nextSession ??
        (await client.auth.getSession().then(({ data }) => data.session)) ??
        null;

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      const [profileResult, blockedIds, banned, postsResult, commentsResult, countResult] =
        await Promise.all([
          activeSession?.user
            ? client
                .from("profiles")
                .select("display_name, main_character, sub_character, bio")
                .eq("user_id", activeSession.user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          activeSession?.user ? getBlockedUserIds(client, activeSession.user.id) : [],
          activeSession?.user ? isBannedUser(client, activeSession.user.id) : false,
          client
            .from("replay_review_posts")
            .select(
              "id, user_id, author_name, title, character_name, current_rank, current_mr, replay_id, body, status, created_at",
            )
            .order("created_at", { ascending: false }),
          client.from("replay_review_comments").select("id, post_id"),
          activeSession?.user
            ? client
                .from("replay_review_posts")
                .select("id", { count: "exact", head: true })
                .eq("user_id", activeSession.user.id)
                .gte("created_at", getTodayRange().start)
                .lt("created_at", getTodayRange().end)
            : Promise.resolve({ count: 0, error: null }),
        ]);

      if (!mounted) {
        return;
      }

      if (profileResult.error) {
        throw profileResult.error;
      }

      if (postsResult.error) {
        throw postsResult.error;
      }

      if (commentsResult.error) {
        throw commentsResult.error;
      }

      if (countResult.error) {
        throw countResult.error;
      }

      const nextHasProfile = hasSavedProfile(profileResult.data);
      const nextPosts = (postsResult.data ?? []) as ReplayCoachingPost[];
      const nextCommentCounts = ((commentsResult.data ?? []) as ReplayCoachingComment[]).reduce<
        Record<number, number>
      >((result, comment) => {
        result[comment.post_id] = (result[comment.post_id] ?? 0) + 1;
        return result;
      }, {});

      const nextContacts = await loadProfileContacts(client, nextPosts.map((post) => post.user_id));

      if (!mounted) {
        return;
      }

      setHasProfile(nextHasProfile);
      setBlockedUserIds(blockedIds);
      setIsBanned(banned);
      setPosts(nextPosts);
      setCommentCounts(nextCommentCounts);
      setContacts(nextContacts);
      setDailyCount(countResult.count ?? 0);
      setIsLoading(false);
      setMessage(
        activeSession?.user
          ? banned
            ? "このアカウントは現在投稿停止中です。"
            : nextHasProfile
              ? "リプレイコーチングを依頼できます。"
              : "先にプロフィールを保存すると投稿できます。"
          : "ログインするとリプレイコーチングを依頼できます。",
      );
    }

    loadBoard().catch((error: unknown) => {
      if (!mounted) {
        return;
      }

      setIsLoading(false);
      setMessage(getMessageFromError(error));
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);
      loadBoard(nextSession).catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        setIsLoading(false);
        setMessage(getMessageFromError(error));
      });
    });

    function handleProfileSaved() {
      setIsLoading(true);
      loadBoard().catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        setIsLoading(false);
        setMessage(getMessageFromError(error));
      });
    }

    window.addEventListener("profile:saved", handleProfileSaved);

    return () => {
      mounted = false;
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

    const displayName = String(session.user.user_metadata.display_name ?? "").trim();
    if (displayName) {
      return displayName;
    }

    return (session.user.email ?? "").split("@")[0] || "プレイヤー";
  }

  async function reloadBoardState() {
    if (!supabase) {
      return;
    }

    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();
    const todayRange = getTodayRange();

    const [postsResult, commentsResult, countResult] = await Promise.all([
      supabase
        .from("replay_review_posts")
        .select(
          "id, user_id, author_name, title, character_name, current_rank, current_mr, replay_id, body, status, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("replay_review_comments").select("id, post_id"),
      activeSession?.user
        ? supabase
            .from("replay_review_posts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", activeSession.user.id)
            .gte("created_at", todayRange.start)
            .lt("created_at", todayRange.end)
        : Promise.resolve({ count: 0, error: null }),
    ]);

    if (postsResult.error) {
      throw postsResult.error;
    }

    if (commentsResult.error) {
      throw commentsResult.error;
    }

    if (countResult.error) {
      throw countResult.error;
    }

    const nextPosts = (postsResult.data ?? []) as ReplayCoachingPost[];
    const nextCommentCounts = ((commentsResult.data ?? []) as ReplayCoachingComment[]).reduce<
      Record<number, number>
    >((result, comment) => {
      result[comment.post_id] = (result[comment.post_id] ?? 0) + 1;
      return result;
    }, {});

    setPosts(nextPosts);
    setCommentCounts(nextCommentCounts);
    setContacts(await loadProfileContacts(supabase, nextPosts.map((post) => post.user_id)));
    setDailyCount(countResult.count ?? 0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user) {
      setMessage("投稿するにはログインしてください。");
      return;
    }

    if (isBanned) {
      setMessage("このアカウントは現在投稿停止中です。");
      return;
    }

    if (!hasProfile) {
      setMessage("先にプロフィールを保存してください。");
      return;
    }

    if (dailyCount >= 3) {
      setMessage("今日はすでに3件投稿しています。明日また依頼してください。");
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.from("replay_review_posts").insert({
          user_id: session.user.id,
          author_name: getAuthorName(),
          title: buildGeneratedReplayTitle(form),
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
        await reloadBoardState();
        setMessage("リプレイコーチングを投稿しました。");
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
        const { error } = await supabase.from("replay_review_posts").delete().eq("id", postId);

        if (error) {
          throw error;
        }

        await reloadBoardState();
        setMessage("リプレイコーチングを削除しました。");
      } catch (error: unknown) {
        setMessage(`削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  const remainingCount = Math.max(0, 3 - dailyCount);
  const showCurrentMr = form.current_rank === "マスター";

  return (
    <div className={showComposer ? "grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" : "grid gap-6"}>
      {showComposer ? (
        <section className="panel rounded-[30px] px-6 py-6">
          <div>
            <p className="display text-2xl text-white">リプレイコーチングを依頼する</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              リプレイIDを入力して、立ち回りや課題の相談ができます。
            </p>
          </div>

          {!session?.user ? (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
              ログインすると依頼を投稿できます。
            </div>
          ) : isBanned ? (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
              このアカウントは現在投稿停止中です。
            </div>
          ) : !hasProfile ? (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
              先にプロフィールを保存してください。
              <Link href="/profile" className="ml-2 text-[var(--accent-soft)] underline underline-offset-4">
                プロフィール編集へ
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-[var(--muted)]">
                  今日の投稿数: {dailyCount} / 3
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  1日3件まで投稿できます。残り {remainingCount} 件です。内容を整理してから依頼してください。
                </p>
              </div>

              <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">使用キャラクター</span>
                    <select
                      value={form.character_name}
                      onChange={(event) => updateField("character_name", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                      required
                    >
                      <option value="">選択してください</option>
                      {CHARACTER_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
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
                      {rankOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {showCurrentMr ? (
                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">現在のMR</span>
                    <input
                      type="number"
                      min="800"
                      max="2600"
                      step="50"
                      value={form.current_mr}
                      onChange={(event) => updateField("current_mr", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                ) : null}

                <label>
                  <span className="mb-2 block text-sm text-[var(--muted)]">リプレイID</span>
                  <input
                    value={form.replay_id}
                    onChange={(event) => updateField("replay_id", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                    placeholder="例: 4A7B9C2D"
                    required
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm text-[var(--muted)]">見てほしいポイント</span>
                  <textarea
                    value={form.body}
                    onChange={(event) => updateField("body", event.target.value)}
                    className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                    placeholder="例: 画面端での守り方と、ドライブラッシュの通しどころを見てほしいです。"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPending || remainingCount === 0}
                  className="primary-action disabled:opacity-60"
                >
                  {isPending ? "投稿中..." : "リプレイコーチングを依頼する"}
                </button>
              </form>
            </>
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
        ) : filteredPosts.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            まだ投稿はありません。
          </div>
        ) : (
          <>
            <div
              className={`mt-6 grid gap-4 ${
                multiColumnList ? "[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]" : ""
              }`}
            >
              {visiblePosts.map((post) => {
                const isOwner = session?.user?.id === post.user_id;

                return (
                  <article
                    key={post.id}
                    className="rounded-[28px] border border-white/10 bg-black/25 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="pill-button rounded-full bg-[var(--secondary)]/15 px-3 py-2 text-xs text-[var(--secondary)]">
                            リプレイコーチング
                          </span>
                          <CharacterChip name={post.character_name} />
                        </div>

                        <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                        <p className="text-sm text-[var(--muted)]">
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
                        <PostContactChips userId={post.user_id} contacts={contacts} />
                        <p className="font-mono text-sm text-[var(--accent-soft)]">
                          Replay ID: {post.replay_id}
                        </p>
                        <p className="text-xs text-[var(--muted)]/80">
                          投稿日: {formatPostedAt(post.created_at)}
                        </p>
                        <p className="text-sm text-[var(--muted)]">コメント数: {commentCounts[post.id] ?? 0}</p>

                        <Link
                          href={`/replay-review/${post.id}`}
                          className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--muted)] transition-colors hover:bg-white/8"
                        >
                          <span>タップ / クリックで詳細とコメントを見る</span>
                          <span className="text-[var(--accent-soft)]">→</span>
                        </Link>
                      </div>

                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={isPending}
                          className="rounded-full border border-[var(--accent)]/30 px-4 py-2 text-sm text-[var(--accent-soft)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-60"
                        >
                          削除
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{post.body}</p>

                    {!isOwner ? (
                      <ModerationActions
                        targetUserId={post.user_id}
                        targetName={post.author_name}
                        targetKind="replay_review"
                        targetSource="replay_review_posts"
                        targetId={post.id}
                        targetTitle={post.title}
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>

            {pageSize && totalPages > 1 ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={buildPageHref(listPageHref, Math.max(1, clampedPage - 1))}
                  className={`secondary-action text-sm ${clampedPage === 1 ? "pointer-events-none opacity-40" : ""}`}
                >
                  前へ
                </Link>
                <span className="text-sm text-[var(--muted)]">
                  {clampedPage} / {totalPages}
                </span>
                <Link
                  href={buildPageHref(listPageHref, Math.min(totalPages, clampedPage + 1))}
                  className={`secondary-action text-sm ${clampedPage === totalPages ? "pointer-events-none opacity-40" : ""}`}
                >
                  次へ
                </Link>
              </div>
            ) : null}

            {hasMorePosts ? (
              <div className="mt-6 flex justify-end">
                <Link href={listPageHref} className="secondary-action text-sm">
                  続きを見る
                </Link>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
