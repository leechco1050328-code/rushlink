"use client";

import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CoachingForm = {
  post_type: string;
  title: string;
  character_name: string;
  current_rank: string;
  current_mr: string;
  focus_topic: string;
  lesson_method: string;
  availability_start: string;
  availability_end: string;
  body: string;
};

type CoachingPost = {
  id: number;
  user_id: string;
  author_name: string;
  post_type: string;
  title: string;
  character_name: string;
  current_rank: string;
  current_mr: string;
  focus_topic: string;
  lesson_method: string;
  availability_start: string;
  availability_end: string;
  body: string;
  status: string;
  created_at: string;
};

const defaultForm: CoachingForm = {
  post_type: "",
  title: "",
  character_name: "",
  current_rank: "",
  current_mr: "",
  focus_topic: "",
  lesson_method: "",
  availability_start: "何時でも可",
  availability_end: "",
  body: "",
};

const postTypeOptions = ["教えたい", "教わりたい"];
const characterOptions = [
  "リュウ",
  "ルーク",
  "ジェイミー",
  "春麗",
  "ガイル",
  "キンバリー",
  "ジュリ",
  "ケン",
  "ブランカ",
  "ダルシム",
  "E.本田",
  "ディージェイ",
  "マノン",
  "マリーザ",
  "JP",
  "ザンギエフ",
  "リリー",
  "キャミィ",
  "ラシード",
  "A.K.I.",
  "エド",
  "豪鬼",
  "ベガ",
  "テリー",
  "舞",
];
const rankOptions = [
  "",
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
const methodOptions = [
  "通話あり",
  "通話なし",
  "チャット中心",
  "リプレイコーチング",
  "カスタムルーム",
];
const timeOptions = [
  "何時でも可",
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
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

function formatAvailability(start: string, end: string) {
  if (start === "何時でも可") {
    return start;
  }

  if (!end) {
    return start;
  }

  return `${start}-${end}`;
}

export function CoachingBoard() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<CoachingPost[]>([]);
  const [form, setForm] = useState<CoachingForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(
    "ログインすると教えたい / 教わりたい募集を投稿できます。現在は一覧を読み込み中です。",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setMessage("Supabase の接続情報がまだ入っていません。");
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function loadBoard(nextSession?: Session | null) {
      const activeSession =
        nextSession ??
        (await client.auth.getSession().then(({ data }) => data.session)) ??
        null;

      if (!isMounted) {
        return;
      }

      setSession(activeSession);

      const { data, error } = await client
        .from("coaching_posts")
        .select(
          "id, user_id, author_name, post_type, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at",
        )
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        setPosts([]);
        setMessage(
          `教え合い一覧の読み込みに失敗しました。先に docs/coaching-setup.sql を Supabase の SQL Editor で実行してください。詳細: ${error.message}`,
        );
        setIsLoading(false);
        return;
      }

      setPosts((data ?? []) as CoachingPost[]);
      setMessage(
        activeSession?.user
          ? "ログイン中です。教えたい / 教わりたい募集を投稿できます。"
          : "教え合い一覧を表示しています。投稿するにはログインしてください。",
      );
      setIsLoading(false);
    }

    loadBoard().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setMessage(`教え合い一覧の読み込みに失敗しました: ${getMessageFromError(error)}`);
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

        setMessage(`教え合い一覧の読み込みに失敗しました: ${getMessageFromError(error)}`);
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function updateField<Key extends keyof CoachingForm>(
    key: Key,
    value: CoachingForm[Key],
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

  function reloadPosts() {
    if (!supabase) {
      return Promise.resolve();
    }

    return supabase
      .from("coaching_posts")
      .select(
        "id, user_id, author_name, post_type, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at",
      )
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }

        setPosts((data ?? []) as CoachingPost[]);
      });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user) {
      setMessage("ログインしてから教え合い募集を投稿してください。");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          user_id: session.user.id,
          author_name: getAuthorName(),
          post_type: form.post_type,
          title: form.title,
          character_name: form.character_name,
          current_rank: form.current_rank,
          current_mr: form.current_rank === "マスター" ? form.current_mr : "",
          focus_topic: form.focus_topic,
          lesson_method: form.lesson_method,
          availability_start: form.availability_start,
          availability_end:
            form.availability_start === "何時でも可" ? "" : form.availability_end,
          body: form.body,
          status: "open",
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("coaching_posts").insert(payload);

        if (error) {
          throw error;
        }

        setForm(defaultForm);
        await reloadPosts();
        setMessage("教え合い募集を投稿しました。");
      } catch (error: unknown) {
        setMessage(`教え合い募集の投稿に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleStatusChange(postId: number, status: "open" | "closed") {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from("coaching_posts")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId);

        if (error) {
          throw error;
        }

        await reloadPosts();
        setMessage(
          status === "closed" ? "教え合い募集を終了しました。" : "教え合い募集を再開しました。",
        );
      } catch (error: unknown) {
        setMessage(`募集ステータス変更に失敗しました: ${getMessageFromError(error)}`);
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
          .from("coaching_posts")
          .delete()
          .eq("id", postId);

        if (error) {
          throw error;
        }

        await reloadPosts();
        setMessage("教え合い募集を削除しました。");
      } catch (error: unknown) {
        setMessage(`募集削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="display text-2xl text-white">教え合い募集を投稿する</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              教えたいか教わりたいか、キャラ、テーマ、方法、時間帯を入れて投稿します。
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              session?.user
                ? "bg-[var(--secondary)]/15 text-[var(--secondary)]"
                : "bg-white/8 text-[var(--muted)]"
            }`}
          >
            {session?.user ? "投稿可能" : "ログイン必要"}
          </span>
        </div>

        <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[var(--muted)]">
          <p>{message}</p>
        </div>

        {!session?.user ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            先に上の認証パネルからログインしてください。ログイン後、このフォームから教え合い募集を投稿できます。
          </div>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">募集タイプ</span>
                <select
                  value={form.post_type}
                  onChange={(event) => updateField("post_type", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
                >
                  <option value="">選択してください</option>
                  {postTypeOptions.map((postType) => (
                    <option key={postType} value={postType}>
                      {postType}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">キャラクター</span>
                <select
                  value={form.character_name}
                  onChange={(event) =>
                    updateField("character_name", event.target.value)
                  }
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
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">募集タイトル</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="例: モダン豪鬼の立ち回りを教えてほしい"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">現在のランク</span>
                <select
                  value={form.current_rank}
                  onChange={(event) => {
                    const nextRank = event.target.value;
                    updateField("current_rank", nextRank);
                    if (nextRank !== "マスター") {
                      updateField("current_mr", "");
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">選択してください</option>
                  {rankOptions
                    .filter((rank) => rank !== "")
                    .map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                </select>
              </label>

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
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                    placeholder="例: 1550"
                  />
                </label>
              ) : (
                <div />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">テーマ</span>
                <input
                  value={form.focus_topic}
                  onChange={(event) => updateField("focus_topic", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="例: 中距離の差し返し"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">方法</span>
                <select
                  value={form.lesson_method}
                  onChange={(event) => updateField("lesson_method", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
                >
                  <option value="">選択してください</option>
                  {methodOptions.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">開始時間</span>
                <select
                  value={form.availability_start}
                  onChange={(event) => {
                    const nextStart = event.target.value;
                    updateField("availability_start", nextStart);
                    if (nextStart === "何時でも可") {
                      updateField("availability_end", "");
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              {form.availability_start !== "何時でも可" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--muted)]">終了時間</span>
                  <select
                    value={form.availability_end}
                    onChange={(event) =>
                      updateField("availability_end", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                    required
                  >
                    <option value="">選択してください</option>
                    {timeOptions
                      .filter((time) => time !== "何時でも可")
                      .map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                  </select>
                </label>
              ) : (
                <div />
              )}
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">募集内容</span>
              <textarea
                value={form.body}
                onChange={(event) => updateField("body", event.target.value)}
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="例: リプレイを3本見てもらいたいです。文章中心で教わりたいです。"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {isPending ? "投稿中..." : "教え合い募集を投稿する"}
            </button>
          </form>
        )}
      </section>

      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="display text-2xl text-white">教え合い募集一覧</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              教えたい / 教わりたい募集が新しい順に並びます。自分の募集だけ終了 / 再開 / 削除できます。
            </p>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
            {posts.length} 件
          </span>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-[var(--muted)]">教え合い一覧を読み込み中...</p>
        ) : posts.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            まだ募集がありません。最初の1件を投稿してみてください。
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {posts.map((post) => {
              const isOwner = session?.user?.id === post.user_id;

              return (
                <article
                  key={post.id}
                  className="rounded-[28px] border border-white/10 bg-black/25 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            post.post_type === "教えたい"
                              ? "bg-[var(--secondary)]/15 text-[var(--secondary)]"
                              : "bg-[var(--accent)]/15 text-[var(--accent-soft)]"
                          }`}
                        >
                          {post.post_type}
                        </span>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                          {post.character_name}
                        </span>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                          {post.lesson_method}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            post.status === "open"
                              ? "bg-[var(--secondary)]/15 text-[var(--secondary)]"
                              : "bg-white/8 text-[var(--muted)]"
                          }`}
                        >
                          {post.status === "open" ? "公開中" : "募集終了"}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {post.author_name} / {post.focus_topic} /{" "}
                        {formatAvailability(post.availability_start, post.availability_end)}
                      </p>
                      {post.current_rank ? (
                        <p className="text-sm text-[var(--muted)]">
                          現在のランク: {post.current_rank}
                          {post.current_rank === "マスター" && post.current_mr
                            ? ` / MR ${post.current_mr}`
                            : ""}
                        </p>
                      ) : null}
                      <p className="text-xs text-[var(--muted)]/80">
                        投稿日時: {formatPostedAt(post.created_at)}
                      </p>
                    </div>

                    {isOwner ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(
                              post.id,
                              post.status === "open" ? "closed" : "open",
                            )
                          }
                          disabled={isPending}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/8 disabled:opacity-60"
                        >
                          {post.status === "open" ? "募集終了にする" : "終了済み"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={isPending}
                          className="rounded-full border border-[var(--accent)]/30 px-4 py-2 text-sm text-[var(--accent-soft)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-60"
                        >
                          削除
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{post.body}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
