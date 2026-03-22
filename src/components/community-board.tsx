"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { CHARACTER_OPTIONS } from "@/lib/characters";
import { hasSavedProfile } from "@/lib/has-saved-profile";
import { getBlockedUserIds, isBannedUser } from "@/lib/moderation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PostPurpose = "" | "対戦募集" | "教えたい" | "教わりたい";
type FilterPurpose = "すべて" | "対戦募集" | "教えたい" | "教わりたい";
type Source = "recruitment_posts" | "coaching_posts";
type UnifiedForm = {
  purpose: PostPurpose; title: string; character_name: string; self_rank: string; self_mr: string;
  opponent_character_name: string; opponent_rank: string; opponent_mr: string; voice_option: string;
  platform: string; focus_topic: string; lesson_method: string; availability_start: string;
  availability_end: string; body: string;
};
type RecruitmentRow = {
  id: number; user_id: string; author_name: string; title: string; character_name: string; self_rank: string; self_mr: string;
  opponent_character_name: string; opponent_rank: string; opponent_mr: string; voice_option: string; platform: string;
  availability_start: string; availability_end: string; body: string; status: string; created_at: string;
};
type CoachingRow = {
  id: number; user_id: string; author_name: string; post_type: Exclude<PostPurpose, "" | "対戦募集">; title: string; character_name: string;
  current_rank: string; current_mr: string; focus_topic: string; lesson_method: string; availability_start: string;
  availability_end: string; body: string; status: string; created_at: string;
};
type UnifiedPost = {
  source: Source; id: number; user_id: string; author_name: string; purpose: Exclude<PostPurpose, "">;
  title: string; character_name: string; self_rank: string; self_mr: string; opponent_character_name: string;
  opponent_rank: string; opponent_mr: string; voice_option: string; platform: string; focus_topic: string;
  lesson_method: string; availability_start: string; availability_end: string; body: string; status: string; created_at: string;
};

const defaultForm: UnifiedForm = {
  purpose: "", title: "", character_name: "", self_rank: "", self_mr: "1500",
  opponent_character_name: "", opponent_rank: "", opponent_mr: "", voice_option: "", platform: "",
  focus_topic: "", lesson_method: "", availability_start: "何時でも可", availability_end: "", body: "",
};
const purposeOptions: Exclude<PostPurpose, "">[] = ["対戦募集", "教えたい", "教わりたい"];
const characterOptions = [...CHARACTER_OPTIONS];
const rankOptions = ["ルーキー","アイアン","ブロンズ","シルバー","ゴールド","プラチナ","ダイヤ","マスター","レジェンド"];
const voiceOptions = ["通話あり", "通話なし", "どちらでも可"];
const platformOptions = ["PC", "PS5", "Xbox", "Steam", "クロスプレイ可"];
const lessonMethodOptions = ["通話あり", "通話なし", "チャット中心", "リプレイコーチング", "カスタムルーム"];
const timeOptions = ["何時でも可","00:00","01:00","02:00","03:00","04:00","05:00","06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];

function err(error: unknown) { return error instanceof Error ? error.message : "不明なエラーが発生しました。"; }
function when(v: string) { return new Intl.DateTimeFormat("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v)); }
function availability(start: string, end: string) { return start === "何時でも可" ? start : end ? `${start}-${end}` : start; }

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
  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [isBanned, setIsBanned] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [purposeFilter, setPurposeFilter] = useState<FilterPurpose>("すべて");
  const [characterFilter, setCharacterFilter] = useState("すべて");
  const [, setMessage] = useState("ログインすると、募集を投稿できます。");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const filteredPosts = useMemo(() => posts.filter((post) => {
    if (blockedUserIds.includes(post.user_id)) {
      return false;
    }
    const p = purposeFilter === "すべて" || post.purpose === purposeFilter;
    const c = characterFilter === "すべて" || post.character_name === characterFilter;
    return p && c;
  }), [blockedUserIds, posts, purposeFilter, characterFilter]);
  const safePage = Math.max(1, currentPage);
  const totalPages = pageSize ? Math.max(1, Math.ceil(filteredPosts.length / pageSize)) : 1;
  const clampedPage = Math.min(safePage, totalPages);
  const pagedPosts = useMemo(() => {
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
    if (!supabase) { setIsLoading(false); setMessage("Supabase の接続情報がまだ入っていません。"); return; }
    const client = supabase; let mounted = true;

    async function loadProfile(active: Session | null) {
      if (!active?.user) return false;
      const { data, error } = await client.from("profiles").select("display_name, main_character, sub_character, bio").eq("user_id", active.user.id).maybeSingle();
      if (error) throw new Error(`プロフィール確認に失敗しました。docs/profile-setup.sql を実行してください。詳細: ${error.message}`);
      return hasSavedProfile(data);
    }

    async function loadPosts() {
      const [r, c] = await Promise.all([
        client.from("recruitment_posts").select("id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at").order("created_at", { ascending: false }),
        client.from("coaching_posts").select("id, user_id, author_name, post_type, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at").order("created_at", { ascending: false }),
      ]);
      if (r.error) throw new Error(`対戦募集の読み込みに失敗しました。docs/recruitment-setup.sql を実行してください。詳細: ${r.error.message}`);
      if (c.error) throw new Error(`教習募集の読み込みに失敗しました。docs/coaching-setup.sql を実行してください。詳細: ${c.error.message}`);
      const recruitmentRows = (r.data ?? []) as RecruitmentRow[];
      const coachingRows = (c.data ?? []) as CoachingRow[];
      const merged: UnifiedPost[] = [
        ...recruitmentRows.map((row) => ({ source: "recruitment_posts" as const, id: row.id, user_id: row.user_id, author_name: row.author_name, purpose: "対戦募集" as const, title: row.title, character_name: row.character_name, self_rank: row.self_rank, self_mr: row.self_mr, opponent_character_name: row.opponent_character_name, opponent_rank: row.opponent_rank, opponent_mr: row.opponent_mr, voice_option: row.voice_option, platform: row.platform, focus_topic: "", lesson_method: "", availability_start: row.availability_start, availability_end: row.availability_end, body: row.body, status: row.status, created_at: row.created_at })),
        ...coachingRows.map((row) => ({ source: "coaching_posts" as const, id: row.id, user_id: row.user_id, author_name: row.author_name, purpose: row.post_type as UnifiedPost["purpose"], title: row.title, character_name: row.character_name, self_rank: row.current_rank, self_mr: row.current_mr, opponent_character_name: "", opponent_rank: "", opponent_mr: "", voice_option: "", platform: "", focus_topic: row.focus_topic, lesson_method: row.lesson_method, availability_start: row.availability_start, availability_end: row.availability_end, body: row.body, status: row.status, created_at: row.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (mounted) setPosts(merged);
    }

    async function refresh(next?: Session | null) {
      const active = next ?? (await client.auth.getSession().then(({ data }) => data.session)) ?? null;
      if (!mounted) return;
      setSession(active);
      const nextHasProfile = await loadProfile(active);
      const nextBlockedUserIds = active?.user ? await getBlockedUserIds(client, active.user.id) : [];
      const nextIsBanned = active?.user ? await isBannedUser(client, active.user.id) : false;
      if (!mounted) return;
      setHasProfile(nextHasProfile);
      setBlockedUserIds(nextBlockedUserIds);
      setIsBanned(nextIsBanned);
      await loadPosts();
      if (!mounted) return;
      setMessage(active?.user ? (nextIsBanned ? "このアカウントは現在利用停止中です。" : nextHasProfile ? "ログイン中です。募集を投稿できます。" : "先にプロフィールを保存してください。プロフィール保存後に投稿できます。") : "一覧は閲覧できます。投稿するにはログインしてください。");
      setIsLoading(false);
    }

    refresh().catch((error) => { if (mounted) { setMessage(err(error)); setIsLoading(false); } });
    const { data: { subscription } } = client.auth.onAuthStateChange((_e, next) => { setIsLoading(true); refresh(next).catch((error) => { if (mounted) { setMessage(err(error)); setIsLoading(false); } }); });
    const onProfileSaved = () => { setIsLoading(true); refresh().catch((error) => { if (mounted) { setMessage(err(error)); setIsLoading(false); } }); };
    window.addEventListener("profile:saved", onProfileSaved);
    return () => { mounted = false; subscription.unsubscribe(); window.removeEventListener("profile:saved", onProfileSaved); };
  }, [supabase]);

  function updateField<K extends keyof UnifiedForm>(key: K, value: UnifiedForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function getAuthorName() {
    if (!session?.user) return "ゲスト";
    const displayName = String(session.user.user_metadata.display_name ?? "").trim();
    if (displayName) return displayName;
    return (session.user.email ?? "").split("@")[0] || "プレイヤー";
  }

  async function reloadPosts() {
    if (!supabase) return;
    const [r, c] = await Promise.all([
      supabase.from("recruitment_posts").select("id, user_id, author_name, title, character_name, self_rank, self_mr, opponent_character_name, opponent_rank, opponent_mr, voice_option, platform, availability_start, availability_end, body, status, created_at").order("created_at", { ascending: false }),
      supabase.from("coaching_posts").select("id, user_id, author_name, post_type, title, character_name, current_rank, current_mr, focus_topic, lesson_method, availability_start, availability_end, body, status, created_at").order("created_at", { ascending: false }),
    ]);
    if (r.error) throw r.error;
    if (c.error) throw c.error;
    const recruitmentRows = (r.data ?? []) as RecruitmentRow[];
    const coachingRows = (c.data ?? []) as CoachingRow[];
    const merged: UnifiedPost[] = [
      ...recruitmentRows.map((row) => ({ source: "recruitment_posts" as const, id: row.id, user_id: row.user_id, author_name: row.author_name, purpose: "対戦募集" as const, title: row.title, character_name: row.character_name, self_rank: row.self_rank, self_mr: row.self_mr, opponent_character_name: row.opponent_character_name, opponent_rank: row.opponent_rank, opponent_mr: row.opponent_mr, voice_option: row.voice_option, platform: row.platform, focus_topic: "", lesson_method: "", availability_start: row.availability_start, availability_end: row.availability_end, body: row.body, status: row.status, created_at: row.created_at })),
      ...coachingRows.map((row) => ({ source: "coaching_posts" as const, id: row.id, user_id: row.user_id, author_name: row.author_name, purpose: row.post_type as UnifiedPost["purpose"], title: row.title, character_name: row.character_name, self_rank: row.current_rank, self_mr: row.current_mr, opponent_character_name: "", opponent_rank: "", opponent_mr: "", voice_option: "", platform: "", focus_topic: row.focus_topic, lesson_method: row.lesson_method, availability_start: row.availability_start, availability_end: row.availability_end, body: row.body, status: row.status, created_at: row.created_at })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPosts(merged);
  }

  function handlePurposeChange(next: PostPurpose) {
    setForm((current) => next === "対戦募集" ? { ...current, purpose: next, focus_topic: "", lesson_method: "" } : { ...current, purpose: next, opponent_character_name: "", opponent_rank: "", opponent_mr: "", voice_option: "", platform: "" });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user) { setMessage("投稿するにはログインが必要です。"); return; }
    if (isBanned) { setMessage("このアカウントは現在利用停止中のため投稿できません。"); return; }
    if (!hasProfile) { setMessage("先にプロフィールを保存してください。"); return; }
    startTransition(async () => {
      try {
        if (form.purpose === "対戦募集") {
          const { error } = await supabase.from("recruitment_posts").insert({
            user_id: session.user.id, author_name: getAuthorName(), title: form.title.trim(), character_name: form.character_name, self_rank: form.self_rank,
            self_mr: form.self_rank === "マスター" ? form.self_mr : "", opponent_character_name: form.opponent_character_name, opponent_rank: form.opponent_rank,
            opponent_mr: form.opponent_mr, voice_option: form.voice_option, platform: form.platform, availability_start: form.availability_start,
            availability_end: form.availability_start === "何時でも可" ? "" : form.availability_end, body: form.body.trim(), status: "open", updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        } else if (form.purpose === "教えたい" || form.purpose === "教わりたい") {
          const { error } = await supabase.from("coaching_posts").insert({
            user_id: session.user.id, author_name: getAuthorName(), post_type: form.purpose, title: form.title.trim(), character_name: form.character_name,
            current_rank: form.self_rank, current_mr: form.self_rank === "マスター" ? form.self_mr : "", focus_topic: form.focus_topic.trim(),
            lesson_method: form.lesson_method, availability_start: form.availability_start, availability_end: form.availability_start === "何時でも可" ? "" : form.availability_end,
            body: form.body.trim(), status: "open", updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        } else {
          throw new Error("募集目的を選択してください。");
        }
        setForm(defaultForm);
        await reloadPosts();
        setMessage("投稿を保存しました。");
      } catch (error) {
        setMessage(`投稿の保存に失敗しました: ${err(error)}`);
      }
    });
  }

  function handleDelete(post: UnifiedPost) {
    if (!supabase) return;
    startTransition(async () => {
      try {
        const { error } = await supabase.from(post.source).delete().eq("id", post.id);
        if (error) throw error;
        setMessage("募集を削除しました。");
        await reloadPosts();
      } catch (error) {
        setMessage(`募集の更新に失敗しました: ${err(error)}`);
      }
    });
  }

  const showSelfMr = form.self_rank === "マスター";
  const showOpponentFields = form.purpose === "対戦募集";
  const showCoachingFields = form.purpose === "教えたい" || form.purpose === "教わりたい";

  return (
    <div className={showComposer ? "grid gap-6 lg:grid-cols-[0.95fr_1.05fr]" : "grid gap-6"}>
      {showComposer ? (
      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start gap-4">
          <div>
            <p className="display text-2xl text-white">募集を投稿する</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">対戦募集と、教えたい / 教わりたい募集を同じフォームから投稿できます。</p>
          </div>
        </div>
        {!session?.user ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">ログインすると、募集を投稿できます。</div>
        ) : isBanned ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">このアカウントは現在利用停止中です。管理者に確認してください。</div>
        ) : !hasProfile ? (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">先にプロフィールを保存してください。保存後に募集を投稿できます。<a href="/profile" className="ml-2 text-[var(--accent-soft)] underline underline-offset-4">プロフィール編集へ</a></div>
        ) : (
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-2 block text-sm text-[var(--muted)]">募集目的</span><select value={form.purpose} onChange={(e) => handlePurposeChange(e.target.value as PostPurpose)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required><option value="">選択してください</option>{purposeOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              <label><span className="mb-2 block text-sm text-[var(--muted)]">対象キャラクター</span><select value={form.character_name} onChange={(e) => updateField("character_name", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required><option value="">選択してください</option>{characterOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
            </div>
            <label><span className="mb-2 block text-sm text-[var(--muted)]">募集タイトル</span><input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35" placeholder="例: ダイヤ帯で対戦相手募集" required /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-2 block text-sm text-[var(--muted)]">自分のランク</span><select value={form.self_rank} onChange={(e) => { updateField("self_rank", e.target.value); updateField("self_mr", "1500"); }} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required><option value="">選択してください</option>{rankOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              {showSelfMr ? <label><span className="mb-2 block text-sm text-[var(--muted)]">自分のMR</span><input type="number" inputMode="numeric" min="800" max="2600" step="50" value={form.self_mr} onChange={(e) => updateField("self_mr", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" /></label> : <div />}
            </div>
            {showOpponentFields ? <>
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="mb-2 block text-sm text-[var(--muted)]">相手のキャラ</span><select value={form.opponent_character_name} onChange={(e) => updateField("opponent_character_name", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"><option value="">指定なし</option>{characterOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
                <label><span className="mb-2 block text-sm text-[var(--muted)]">相手のランク</span><select value={form.opponent_rank} onChange={(e) => updateField("opponent_rank", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"><option value="">指定なし</option>{rankOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="mb-2 block text-sm text-[var(--muted)]">相手のMR</span><input type="number" inputMode="numeric" min="800" max="2600" step="50" value={form.opponent_mr} onChange={(e) => updateField("opponent_mr", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35" placeholder="任意" /></label>
                <label><span className="mb-2 block text-sm text-[var(--muted)]">通話設定</span><select value={form.voice_option} onChange={(e) => updateField("voice_option", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required><option value="">選択してください</option>{voiceOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              </div>
              <label><span className="mb-2 block text-sm text-[var(--muted)]">プラットフォーム</span><select value={form.platform} onChange={(e) => updateField("platform", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required><option value="">選択してください</option>{platformOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
            </> : null}
            {showCoachingFields ? <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-2 block text-sm text-[var(--muted)]">教えてほしい / 教えたい内容</span><input value={form.focus_topic} onChange={(e) => updateField("focus_topic", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35" placeholder="例: 中足ラッシュの差し方" required /></label>
              <label><span className="mb-2 block text-sm text-[var(--muted)]">方法</span><select value={form.lesson_method} onChange={(e) => updateField("lesson_method", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required><option value="">選択してください</option>{lessonMethodOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
            </div> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-2 block text-sm text-[var(--muted)]">開始時間</span><select value={form.availability_start} onChange={(e) => { const next = e.target.value; updateField("availability_start", next); if (next === "何時でも可") updateField("availability_end", ""); }} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required>{timeOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
              {form.availability_start !== "何時でも可" ? <label><span className="mb-2 block text-sm text-[var(--muted)]">終了時間</span><select value={form.availability_end} onChange={(e) => updateField("availability_end", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none" required><option value="">選択してください</option>{timeOptions.filter((v) => v !== "何時でも可").map((v) => <option key={v} value={v}>{v}</option>)}</select></label> : <div />}
            </div>
            <label><span className="mb-2 block text-sm text-[var(--muted)]">募集内容</span><textarea value={form.body} onChange={(e) => updateField("body", e.target.value)} className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35" placeholder="例: 対戦スタイルや、見てほしいポイントを書いてください。" required /></label>
            <button type="submit" disabled={isPending} className="primary-action">{isPending ? "保存中..." : "投稿する"}</button>
          </form>
        )}
      </section>
      ) : null}
      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="display text-2xl text-white">募集一覧</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">募集目的と対象キャラクターで絞り込みできます。</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="pill-button rounded-full bg-white/8 px-3 py-2 text-xs text-[var(--muted)]">{filteredPosts.length} 件</span>
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
          <label><span className="mb-2 block text-sm text-[var(--muted)]">募集目的で絞り込み</span><select value={purposeFilter} onChange={(e) => setPurposeFilter(e.target.value as FilterPurpose)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"><option value="すべて">すべて</option>{purposeOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
          <label><span className="mb-2 block text-sm text-[var(--muted)]">対象キャラクターで絞り込み</span><select value={characterFilter} onChange={(e) => setCharacterFilter(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"><option value="すべて">すべて</option>{characterOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
        </div>
        {isLoading ? <p className="mt-6 text-sm text-[var(--muted)]">一覧を読み込み中...</p> : filteredPosts.length === 0 ? <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">条件に合う募集はまだありません。</div> : <div className={`mt-6 grid gap-4 ${multiColumnList ? "[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]" : ""}`}>{pagedPosts.map((post) => {
          const isOwner = session?.user?.id === post.user_id;
          const detailHref = post.source === "recruitment_posts" ? `/board/recruitment/${post.id}` : `/board/coaching/${post.id}`;
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
                    / {availability(post.availability_start, post.availability_end)}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    自分のランク: {post.self_rank}
                    {post.self_rank === "マスター" && post.self_mr
                      ? ` / MR ${post.self_mr}`
                      : ""}
                  </p>
                  {post.purpose === "対戦募集" ? (
                    <>
                      <p className="text-sm text-[var(--muted)]">
                        通話: {post.voice_option} / プラットフォーム: {post.platform}
                      </p>
                      {post.opponent_character_name ||
                      post.opponent_rank ||
                      post.opponent_mr ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                          <span>相手条件:</span>
                          <CharacterChip name={post.opponent_character_name} />
                          <span>
                            {post.opponent_character_name ? "" : "指定なし"}
                          {post.opponent_rank ? ` / ${post.opponent_rank}` : ""}
                          {post.opponent_mr ? ` / MR ${post.opponent_mr}` : ""}
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--muted)]">
                        内容: {post.focus_topic}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        方法: {post.lesson_method}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-[var(--muted)]/80">
                    投稿日: {when(post.created_at)}
                  </p>
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
        })}</div>}
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
