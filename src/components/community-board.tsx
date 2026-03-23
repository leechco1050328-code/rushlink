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

type PostPurpose = "" | "対戦募集" | "教えたい" | "教わりたい";
type FilterPurpose = "すべて" | Exclude<PostPurpose, "">;
type Source = "recruitment_posts" | "coaching_posts";

type UnifiedForm = {
  purpose: PostPurpose;
  title: string;
  character_name: string;
  self_rank: string;
  self_mr: string;
  opponent_character_name: string;
  opponent_rank: string;
  opponent_mr: string;
  voice_option: string;
  platform: string;
  focus_topic: string;
  lesson_method: string;
  availability_start: string;
  availability_end: string;
  body: string;
};

type RecruitmentRow = {
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

type CoachingRow = {
  id: number;
  user_id: string;
  author_name: string;
  post_type: Exclude<PostPurpose, "" | "対戦募集">;
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

type UnifiedPost = {
  source: Source;
  id: number;
  user_id: string;
  author_name: string;
  purpose: Exclude<PostPurpose, "">;
  title: string;
  character_name: string;
  self_rank: string;
  self_mr: string;
  opponent_character_name: string;
  opponent_rank: string;
  opponent_mr: string;
  voice_option: string;
  platform: string;
  focus_topic: string;
  lesson_method: string;
  availability_start: string;
  availability_end: string;
  body: string;
  status: string;
  created_at: string;
};

const defaultForm: UnifiedForm = {
  purpose: "",
  title: "",
  character_name: "",
  self_rank: "",
  self_mr: "1500",
  opponent_character_name: "",
  opponent_rank: "",
  opponent_mr: "",
  voice_option: "",
  platform: "",
  focus_topic: "",
  lesson_method: "",
  availability_start: "何時でも可",
  availability_end: "",
  body: "",
};

const purposeOptions: Exclude<PostPurpose, "">[] = ["対戦募集", "教えたい", "教わりたい"];
const rankOptions = ["ルーキー", "アイアン", "ブロンズ", "シルバー", "ゴールド", "プラチナ", "ダイヤ", "マスター", "レジェンド"];
const voiceOptions = ["通話あり", "通話なし", "どちらでも可"];
const platformOptions = ["PC", "PS5", "Xbox", "Steam", "クロスプレイ可"];
const lessonMethodOptions = ["通話あり", "通話なし", "チャット中心", "リプレイコーチング", "カスタムルーム"];
const timeOptions = ["何時でも可", "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

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

function formatAvailability(start: string, end: string) {
  return start === "何時でも可" ? start : end ? `${start} - ${end}` : start;
}

function buildPageHref(baseHref: string, page: number) {
  return `${baseHref}?page=${page}`;
}

type CommunityBoardProps = {
  currentPage?: number;
  listLimit?: number;
  pageSize?: number;
  listPageHref?: string;
  showComposer?: boolean;
  multiColumnList?: boolean;
};

export function CommunityBoard({
  currentPage = 1,
  listLimit,
  pageSize,
  listPageHref = "/board",
  showComposer = true,
  multiColumnList = false,
}: CommunityBoardProps = {}) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [contacts, setContacts] = useState<ProfileContactMap>({});
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [form, setForm] = useState<UnifiedForm>(defaultForm);
  const [purposeFilter, setPurposeFilter] = useState<FilterPurpose>("すべて");
  const [characterFilter, setCharacterFilter] = useState("すべて");
  const [message, setMessage] = useState("ログインすると投稿できます。");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (blockedUserIds.includes(post.user_id)) {
        return false;
      }

      if (purposeFilter !== "すべて" && post.purpose !== purposeFilter) {
        return false;
      }

      if (characterFilter !== "すべて" && post.character_name !== characterFilter) {
        return false;
      }

      return true;
    });
  }, [blockedUserIds, characterFilter, posts, purposeFilter]);

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

      const [recruitmentResult, coachingResult, blockedIds, banned, profileResult] =
        await Promise.all([
          client
            .from("recruitment_posts")
            .select(
              "id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at",
            )
            .order("created_at", { ascending: false }),
          client
            .from("coaching_posts")
            .select(
              "id, user_id, author_name, post_type, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at",
            )
            .order("created_at", { ascending: false }),
          activeSession?.user ? getBlockedUserIds(client, activeSession.user.id) : [],
          activeSession?.user ? isBannedUser(client, activeSession.user.id) : false,
          activeSession?.user
            ? client
                .from("profiles")
                .select("display_name, main_character, sub_character, bio")
                .eq("user_id", activeSession.user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
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

      if (profileResult.error) {
        throw profileResult.error;
      }

      const nextHasProfile = hasSavedProfile(profileResult.data);
      const mergedPosts: UnifiedPost[] = [
        ...((recruitmentResult.data ?? []) as RecruitmentRow[]).map((row) => ({
          source: "recruitment_posts" as const,
          id: row.id,
          user_id: row.user_id,
          author_name: row.author_name,
          purpose: "対戦募集" as const,
          title: row.title,
          character_name: row.character_name,
          self_rank: row.self_rank,
          self_mr: row.self_mr,
          opponent_character_name: row.opponent_character_name,
          opponent_rank: row.opponent_rank,
          opponent_mr: row.opponent_mr,
          voice_option: row.voice_option,
          platform: row.platform,
          focus_topic: "",
          lesson_method: "",
          availability_start: row.availability_start,
          availability_end: row.availability_end,
          body: row.body,
          status: row.status,
          created_at: row.created_at,
        })),
        ...((coachingResult.data ?? []) as CoachingRow[]).map((row) => ({
          source: "coaching_posts" as const,
          id: row.id,
          user_id: row.user_id,
          author_name: row.author_name,
          purpose: row.post_type,
          title: row.title,
          character_name: row.character_name,
          self_rank: row.current_rank,
          self_mr: row.current_mr,
          opponent_character_name: "",
          opponent_rank: "",
          opponent_mr: "",
          voice_option: "",
          platform: "",
          focus_topic: row.focus_topic,
          lesson_method: row.lesson_method,
          availability_start: row.availability_start,
          availability_end: row.availability_end,
          body: row.body,
          status: row.status,
          created_at: row.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const nextContacts = await loadProfileContacts(client, mergedPosts.map((post) => post.user_id));

      if (!mounted) {
        return;
      }

      setBlockedUserIds(blockedIds);
      setIsBanned(banned);
      setHasProfile(nextHasProfile);
      setPosts(mergedPosts);
      setContacts(nextContacts);
      setIsLoading(false);
      setMessage(
        activeSession?.user
          ? banned
            ? "このアカウントは現在投稿停止中です。"
            : nextHasProfile
              ? "募集を投稿できます。"
              : "先にプロフィールを保存すると投稿できます。"
          : "ログインすると投稿できます。",
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

  function updateField<Key extends keyof UnifiedForm>(key: Key, value: UnifiedForm[Key]) {
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

  async function reloadPosts() {
    if (!supabase) {
      return;
    }

    const [recruitmentResult, coachingResult] = await Promise.all([
      supabase
        .from("recruitment_posts")
        .select(
          "id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("coaching_posts")
        .select(
          "id, user_id, author_name, post_type, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at",
        )
        .order("created_at", { ascending: false }),
    ]);

    if (recruitmentResult.error) {
      throw recruitmentResult.error;
    }

    if (coachingResult.error) {
      throw coachingResult.error;
    }

    const mergedPosts: UnifiedPost[] = [
      ...((recruitmentResult.data ?? []) as RecruitmentRow[]).map((row) => ({
        source: "recruitment_posts" as const,
        id: row.id,
        user_id: row.user_id,
        author_name: row.author_name,
        purpose: "対戦募集" as const,
        title: row.title,
        character_name: row.character_name,
        self_rank: row.self_rank,
        self_mr: row.self_mr,
        opponent_character_name: row.opponent_character_name,
        opponent_rank: row.opponent_rank,
        opponent_mr: row.opponent_mr,
        voice_option: row.voice_option,
        platform: row.platform,
        focus_topic: "",
        lesson_method: "",
        availability_start: row.availability_start,
        availability_end: row.availability_end,
        body: row.body,
        status: row.status,
        created_at: row.created_at,
      })),
      ...((coachingResult.data ?? []) as CoachingRow[]).map((row) => ({
        source: "coaching_posts" as const,
        id: row.id,
        user_id: row.user_id,
        author_name: row.author_name,
        purpose: row.post_type,
        title: row.title,
        character_name: row.character_name,
        self_rank: row.current_rank,
        self_mr: row.current_mr,
        opponent_character_name: "",
        opponent_rank: "",
        opponent_mr: "",
        voice_option: "",
        platform: "",
        focus_topic: row.focus_topic,
        lesson_method: row.lesson_method,
        availability_start: row.availability_start,
        availability_end: row.availability_end,
        body: row.body,
        status: row.status,
        created_at: row.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setPosts(mergedPosts);
    setContacts(await loadProfileContacts(supabase, mergedPosts.map((post) => post.user_id)));
  }

  function handlePurposeChange(nextPurpose: PostPurpose) {
    setForm((current) =>
      nextPurpose === "対戦募集"
        ? { ...current, purpose: nextPurpose, focus_topic: "", lesson_method: "" }
        : {
            ...current,
            purpose: nextPurpose,
            opponent_character_name: "",
            opponent_rank: "",
            opponent_mr: "",
            voice_option: "",
            platform: "",
          },
    );
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

    startTransition(async () => {
      try {
        if (form.purpose === "対戦募集") {
          const { error } = await supabase.from("recruitment_posts").insert({
            user_id: session.user.id,
            author_name: getAuthorName(),
            title: form.title.trim(),
            character_name: form.character_name,
            self_rank: form.self_rank,
            self_mr: form.self_rank === "マスター" ? form.self_mr : "",
            opponent_character_name: form.opponent_character_name,
            opponent_rank: form.opponent_rank,
            opponent_mr: form.opponent_mr,
            voice_option: form.voice_option,
            platform: form.platform,
            availability_start: form.availability_start,
            availability_end: form.availability_start === "何時でも可" ? "" : form.availability_end,
            body: form.body.trim(),
            status: "open",
            updated_at: new Date().toISOString(),
          });

          if (error) {
            throw error;
          }
        } else if (form.purpose === "教えたい" || form.purpose === "教わりたい") {
          const { error } = await supabase.from("coaching_posts").insert({
            user_id: session.user.id,
            author_name: getAuthorName(),
            post_type: form.purpose,
            title: form.title.trim(),
            character_name: form.character_name,
            current_rank: form.self_rank,
            current_mr: form.self_rank === "マスター" ? form.self_mr : "",
            focus_topic: form.focus_topic.trim(),
            lesson_method: form.lesson_method,
            availability_start: form.availability_start,
            availability_end: form.availability_start === "何時でも可" ? "" : form.availability_end,
            body: form.body.trim(),
            status: "open",
            updated_at: new Date().toISOString(),
          });

          if (error) {
            throw error;
          }
        } else {
          throw new Error("募集目的を選択してください。");
        }

        setForm(defaultForm);
        await reloadPosts();
        setMessage("投稿しました。");
      } catch (error: unknown) {
        setMessage(`投稿に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleDelete(post: UnifiedPost) {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.from(post.source).delete().eq("id", post.id);

        if (error) {
          throw error;
        }

        await reloadPosts();
        setMessage("投稿を削除しました。");
      } catch (error: unknown) {
        setMessage(`削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  const showSelfMr = form.self_rank === "マスター";
  const showOpponentFields = form.purpose === "対戦募集";
  const showCoachingFields = form.purpose === "教えたい" || form.purpose === "教わりたい";
  const cardGridClass = multiColumnList
    ? "[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]"
    : "";

  return (
    <div className={showComposer ? "grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" : "grid gap-6"}>
      {showComposer ? (
        <section className="panel rounded-[30px] px-6 py-6">
          <div>
            <p className="display text-2xl text-white">募集を投稿する</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              対戦募集と、教えたい / 教わりたい募集を同じフォームから投稿できます。
            </p>
          </div>

          {!session?.user ? (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
              ログインすると募集を投稿できます。
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
            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm text-[var(--muted)]">募集目的</span>
                  <select
                    value={form.purpose}
                    onChange={(event) => handlePurposeChange(event.target.value as PostPurpose)}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                    required
                  >
                    <option value="">選択してください</option>
                    {purposeOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm text-[var(--muted)]">対象キャラクター</span>
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
              </div>

              <label>
                <span className="mb-2 block text-sm text-[var(--muted)]">募集タイトル</span>
                <input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="例: ダイヤ帯で対戦相手募集"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm text-[var(--muted)]">自分のランク</span>
                  <select
                    value={form.self_rank}
                    onChange={(event) => {
                      updateField("self_rank", event.target.value);
                      updateField("self_mr", "1500");
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
                {showSelfMr ? (
                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">自分のMR</span>
                    <input
                      type="number"
                      min="800"
                      max="2600"
                      step="50"
                      value={form.self_mr}
                      onChange={(event) => updateField("self_mr", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                ) : (
                  <div />
                )}
              </div>

              {showOpponentFields ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm text-[var(--muted)]">相手のキャラ</span>
                      <select
                        value={form.opponent_character_name}
                        onChange={(event) =>
                          updateField("opponent_character_name", event.target.value)
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                      >
                        <option value="">任意</option>
                        {CHARACTER_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className="mb-2 block text-sm text-[var(--muted)]">相手のランク</span>
                      <select
                        value={form.opponent_rank}
                        onChange={(event) => updateField("opponent_rank", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                      >
                        <option value="">任意</option>
                        {rankOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm text-[var(--muted)]">相手のMR</span>
                      <input
                        type="number"
                        min="800"
                        max="2600"
                        step="50"
                        value={form.opponent_mr}
                        onChange={(event) => updateField("opponent_mr", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                        placeholder="任意"
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm text-[var(--muted)]">通話設定</span>
                      <select
                        value={form.voice_option}
                        onChange={(event) => updateField("voice_option", event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                        required
                      >
                        <option value="">選択してください</option>
                        {voiceOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">プラットフォーム</span>
                    <select
                      value={form.platform}
                      onChange={(event) => updateField("platform", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                      required
                    >
                      <option value="">選択してください</option>
                      {platformOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              {showCoachingFields ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">
                      教えてほしい / 教えたい内容
                    </span>
                    <input
                      value={form.focus_topic}
                      onChange={(event) => updateField("focus_topic", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                      placeholder="例: 対空が遅れるので見てほしい"
                      required
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">方法</span>
                    <select
                      value={form.lesson_method}
                      onChange={(event) => updateField("lesson_method", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                      required
                    >
                      <option value="">選択してください</option>
                      {lessonMethodOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm text-[var(--muted)]">開始時間</span>
                  <select
                    value={form.availability_start}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      updateField("availability_start", nextValue);
                      if (nextValue === "何時でも可") {
                        updateField("availability_end", "");
                      }
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                    required
                  >
                    {timeOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                {form.availability_start !== "何時でも可" ? (
                  <label>
                    <span className="mb-2 block text-sm text-[var(--muted)]">終了時間</span>
                    <select
                      value={form.availability_end}
                      onChange={(event) => updateField("availability_end", event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                      required
                    >
                      <option value="">選択してください</option>
                      {timeOptions
                        .filter((value) => value !== "何時でも可")
                        .map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : (
                  <div />
                )}
              </div>

              <label>
                <span className="mb-2 block text-sm text-[var(--muted)]">募集内容</span>
                <textarea
                  value={form.body}
                  onChange={(event) => updateField("body", event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="例: 22時以降に10先できる方。JP対策も歓迎です。"
                  required
                />
              </label>

              <button type="submit" disabled={isPending} className="primary-action disabled:opacity-60">
                {isPending ? "投稿中..." : "投稿する"}
              </button>
            </form>
          )}

          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">{message}</p>
        </section>
      ) : null}

      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="display text-2xl text-white">募集一覧</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              募集目的と対象キャラクターで絞り込みできます。
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

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm text-[var(--muted)]">募集目的で絞り込み</span>
            <select
              value={purposeFilter}
              onChange={(event) => setPurposeFilter(event.target.value as FilterPurpose)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="すべて">すべて</option>
              {purposeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm text-[var(--muted)]">対象キャラクターで絞り込み</span>
            <select
              value={characterFilter}
              onChange={(event) => setCharacterFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="すべて">すべて</option>
              {CHARACTER_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-[var(--muted)]">一覧を読み込み中...</p>
        ) : filteredPosts.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
            条件に合う投稿はまだありません。
          </div>
        ) : (
          <>
            <div className={`mt-6 grid gap-4 ${cardGridClass}`}>
              {visiblePosts.map((post) => {
                const isOwner = session?.user?.id === post.user_id;
                const detailHref =
                  post.source === "recruitment_posts"
                    ? `/board/recruitment/${post.id}`
                    : `/board/coaching/${post.id}`;

                return (
                  <article
                    key={`${post.source}-${post.id}`}
                    className="rounded-[28px] border border-white/10 bg-black/25 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`pill-button rounded-full px-3 py-2 text-xs ${
                              post.purpose === "対戦募集"
                                ? "bg-[var(--accent)]/15 text-[var(--accent-soft)]"
                                : "bg-[var(--secondary)]/15 text-[var(--secondary)]"
                            }`}
                          >
                            {post.purpose}
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
                          / {formatAvailability(post.availability_start, post.availability_end)}
                        </p>
                        <PostContactChips userId={post.user_id} contacts={contacts} />
                        <p className="text-sm text-[var(--muted)]">
                          自分のランク: {post.self_rank || "未設定"}
                          {post.self_rank === "マスター" && post.self_mr
                            ? ` / MR ${post.self_mr}`
                            : ""}
                        </p>
                        {post.purpose === "対戦募集" ? (
                          <>
                            <p className="text-sm text-[var(--muted)]">
                              通話: {post.voice_option || "未設定"} / プラットフォーム: {post.platform || "未設定"}
                            </p>
                            {post.opponent_character_name || post.opponent_rank || post.opponent_mr ? (
                              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                                <span>相手条件:</span>
                                <CharacterChip name={post.opponent_character_name} />
                                <span>
                                  {post.opponent_character_name ? "" : "任意"}
                                  {post.opponent_rank ? ` / ${post.opponent_rank}` : ""}
                                  {post.opponent_mr ? ` / MR ${post.opponent_mr}` : ""}
                                </span>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-[var(--muted)]">内容: {post.focus_topic || "未設定"}</p>
                            <p className="text-sm text-[var(--muted)]">方法: {post.lesson_method || "未設定"}</p>
                          </>
                        )}

                        <p className="text-xs text-[var(--muted)]/80">投稿日: {formatPostedAt(post.created_at)}</p>

                        <Link
                          href={detailHref}
                          className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--muted)] transition-colors hover:bg-white/8"
                        >
                          <span>タップ / クリックで詳細を見る</span>
                          <span className="text-[var(--accent-soft)]">→</span>
                        </Link>
                      </div>

                      {isOwner ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(post)}
                            disabled={isPending}
                            className="rounded-full border border-[var(--accent)]/30 px-4 py-2 text-sm text-[var(--accent-soft)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-60"
                          >
                            削除
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{post.body}</p>

                    {!isOwner ? (
                      <ModerationActions
                        targetUserId={post.user_id}
                        targetName={post.author_name}
                        targetKind="community_post"
                        targetSource={post.source}
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
