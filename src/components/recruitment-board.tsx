"use client";

import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RecruitmentForm = {
  title: string;
  character_name: string;
  self_rank: string;
  self_mr: string;
  opponent_character_name: string;
  opponent_rank: string;
  opponent_mr: string;
  voice_option: string;
  platform: string;
  availability_start: string;
  availability_end: string;
  body: string;
};

type RecruitmentPost = {
  id: number;
  user_id: string;
  author_name: string;
  title: string;
  character_name: string;
  self_rank: string;
  self_mr: string;
  opponent_character_name: string;
  opponent_rank: string;
  opponent_mr: string;
  voice_option: string;
  platform: string;
  availability_start: string;
  availability_end: string;
  body: string;
  status: string;
  created_at: string;
};

const defaultForm: RecruitmentForm = {
  title: "",
  character_name: "",
  self_rank: "",
  self_mr: "",
  opponent_character_name: "",
  opponent_rank: "",
  opponent_mr: "",
  voice_option: "",
  platform: "",
  availability_start: "何時でも可",
  availability_end: "",
  body: "",
};

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

const voiceOptions = ["通話あり", "通話なし", "どちらでも可"];
const platformOptions = ["PC", "PS5", "Xbox", "Steam", "クロスプレイ可"];
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

export function RecruitmentBoard() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [form, setForm] = useState<RecruitmentForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(
    "ログインすると対戦募集を投稿できます。現在は新しい投稿を読み込み中です。",
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
        .from("recruitment_posts")
        .select(
          "id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at",
        )
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        setPosts([]);
        setMessage(
          `募集一覧の読み込みに失敗しました。先に docs/recruitment-setup.sql を Supabase の SQL Editor で実行してください。詳細: ${error.message}`,
        );
        setIsLoading(false);
        return;
      }

      setPosts((data ?? []) as RecruitmentPost[]);
      setMessage(
        activeSession?.user
          ? "ログイン中です。新しい対戦募集を投稿できます。"
          : "募集一覧を表示しています。投稿するにはログインしてください。",
      );
      setIsLoading(false);
    }

    loadBoard().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setMessage(`募集一覧の読み込みに失敗しました: ${getMessageFromError(error)}`);
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

        setMessage(`募集一覧の読み込みに失敗しました: ${getMessageFromError(error)}`);
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function updateField<Key extends keyof RecruitmentForm>(
    key: Key,
    value: RecruitmentForm[Key],
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
      .from("recruitment_posts")
      .select(
        "id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at",
      )
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }

        setPosts((data ?? []) as RecruitmentPost[]);
      });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user) {
      setMessage("ログインしてから対戦募集を投稿してください。");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          user_id: session.user.id,
          author_name: getAuthorName(),
          title: form.title,
          character_name: form.character_name,
          self_rank: form.self_rank,
          self_mr: form.self_rank === "マスター" ? form.self_mr : "",
          opponent_character_name: form.opponent_character_name,
          opponent_rank: form.opponent_rank,
          opponent_mr: form.opponent_mr,
          voice_option: form.voice_option,
          platform: form.platform,
          availability_start: form.availability_start,
          availability_end:
            form.availability_start === "何時でも可" ? "" : form.availability_end,
          body: form.body,
          status: "open",
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("recruitment_posts").insert(payload);

        if (error) {
          throw error;
        }

        setForm(defaultForm);
        await reloadPosts();
        setMessage("対戦募集を投稿しました。");
      } catch (error: unknown) {
        setMessage(`対戦募集の投稿に失敗しました: ${getMessageFromError(error)}`);
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
          .from("recruitment_posts")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId);

        if (error) {
          throw error;
        }

        await reloadPosts();
        setMessage(status === "closed" ? "募集を終了しました。" : "募集を再開しました。");
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
          .from("recruitment_posts")
          .delete()
          .eq("id", postId);

        if (error) {
          throw error;
        }

        await reloadPosts();
        setMessage("募集を削除しました。");
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
            <p className="display text-2xl text-white">対戦募集を投稿する</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              キャラ、通話の有無、プレイ環境、募集時間帯を入れて投稿します。
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
            先に上の認証パネルからログインしてください。ログイン後、このフォームから対戦募集を投稿できます。
          </div>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">募集タイトル</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="例: 週末夜に10先できる人を募集"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
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

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">自分のランク</span>
                <select
                  value={form.self_rank}
                  onChange={(event) => {
                    const nextRank = event.target.value;
                    updateField("self_rank", nextRank);
                    if (nextRank !== "マスター") {
                      updateField("self_mr", "");
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {form.self_rank === "マスター" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--muted)]">
                    自分のMR
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="800"
                    max="2600"
                    step="50"
                    value={form.self_mr}
                    onChange={(event) => updateField("self_mr", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                    placeholder="例: 1600"
                  />
                </label>
              ) : (
                <div />
              )}

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">
                  対戦相手のキャラクター
                </span>
                <select
                  value={form.opponent_character_name}
                  onChange={(event) =>
                    updateField("opponent_character_name", event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">指定なし</option>
                  {characterOptions.map((character) => (
                    <option key={character} value={character}>
                      {character}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">
                  対戦相手のランク
                </span>
                <select
                  value={form.opponent_rank}
                  onChange={(event) => updateField("opponent_rank", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">指定なし</option>
                  {rankOptions
                    .filter((rank) => rank !== "")
                    .map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">
                  対戦相手のMR
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="800"
                  max="2600"
                  step="50"
                  value={form.opponent_mr}
                  onChange={(event) => updateField("opponent_mr", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="例: 1500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">通話設定</span>
                <select
                  value={form.voice_option}
                  onChange={(event) =>
                    updateField("voice_option", event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
                >
                  <option value="">選択してください</option>
                  {voiceOptions.map((voice) => (
                    <option key={voice} value={voice}>
                      {voice}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">プラットフォーム</span>
                <select
                  value={form.platform}
                  onChange={(event) => updateField("platform", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  required
                >
                  <option value="">選択してください</option>
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </label>

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
            </div>

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
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-[var(--muted)]">募集内容</span>
              <textarea
                value={form.body}
                onChange={(event) => updateField("body", event.target.value)}
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="例: 豪鬼戦の対策をしたいです。長めのセット歓迎です。"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {isPending ? "投稿中..." : "対戦募集を投稿する"}
            </button>
          </form>
        )}
      </section>

      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="display text-2xl text-white">対戦募集一覧</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              公開中の募集が新しい順に並びます。自分の募集だけ終了 / 再開 / 削除できます。
            </p>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
            {posts.length} 件
          </span>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-[var(--muted)]">募集一覧を読み込み中...</p>
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
                        <span className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs text-[var(--accent-soft)]">
                          {post.character_name}
                        </span>
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                          {post.voice_option}
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
                        {post.author_name} / {post.platform} /{" "}
                        {formatAvailability(post.availability_start, post.availability_end)}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        自分のランク: {post.self_rank}
                        {post.self_rank === "マスター" && post.self_mr
                          ? ` / MR ${post.self_mr}`
                          : ""}
                      </p>
                      {post.opponent_character_name || post.opponent_rank || post.opponent_mr ? (
                        <p className="text-sm text-[var(--muted)]">
                          対戦したい相手:
                          {post.opponent_character_name || " 指定なし"}
                          {post.opponent_rank ? ` / ${post.opponent_rank}` : ""}
                          {post.opponent_mr ? ` / MR ${post.opponent_mr}` : ""}
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
