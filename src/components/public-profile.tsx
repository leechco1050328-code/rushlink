"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CharacterChip } from "@/components/character-chip";
import { ModerationActions } from "@/components/moderation-actions";
import { getBlockedUserIds } from "@/lib/moderation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileRow = {
  user_id: string;
  display_name: string;
  main_character: string;
  sub_character: string;
  main_character_rank: string;
  main_character_mr: string;
  sub_character_rank: string;
  sub_character_mr: string;
  platform: string;
  voice_preference: string;
  x_account: string;
  discord_account: string;
  bio: string;
};

type ActivityItem = {
  href: string;
  kind: string;
  title: string;
  created_at: string;
  status: string;
};

function formatPostedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PublicProfile({ userId }: { userId: string | null }) {
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [message, setMessage] = useState("読み込み中です。");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      if (!supabase) {
        setIsLoading(false);
        setMessage("Supabase の設定情報がまだ入っていません。");
        return;
      }

      if (!userId) {
        setIsLoading(false);
        setMessage("ユーザーIDが不正です。");
        return;
      }

      const client = supabase;
      const {
        data: { session },
      } = await client.auth.getSession();

      let blockedIds: string[] = [];
      if (session?.user?.id) {
        blockedIds = await getBlockedUserIds(client, session.user.id);
      }

      if (!isMounted) {
        return;
      }

      if (blockedIds.includes(userId)) {
        setIsBlocked(true);
        setProfile(null);
        setActivities([]);
        setMessage("このユーザーはブロック中です。");
        setIsLoading(false);
        return;
      }

      const [profileResult, recruitmentResult, coachingResult, replayResult] =
        await Promise.all([
          client
            .from("profiles")
            .select(
              "user_id, display_name, main_character, sub_character, main_character_rank, main_character_mr, sub_character_rank, sub_character_mr, platform, voice_preference, x_account, discord_account, bio",
            )
            .eq("user_id", userId)
            .maybeSingle(),
          client
            .from("recruitment_posts")
            .select("id, title, created_at, status")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(3),
          client
            .from("coaching_posts")
            .select("id, title, created_at, status")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(3),
          client
            .from("replay_review_posts")
            .select("id, title, created_at, status")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

      if (!isMounted) {
        return;
      }

      if (profileResult.error) {
        setMessage(`プロフィールの読み込みに失敗しました: ${profileResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (!profileResult.data) {
        setMessage("プロフィールが見つかりません。");
        setIsLoading(false);
        return;
      }

      const nextActivities: ActivityItem[] = [
        ...((recruitmentResult.data ?? []).map((item) => ({
          href: `/board/recruitment/${item.id}`,
          kind: "対戦募集",
          title: item.title,
          created_at: item.created_at,
          status: item.status,
        })) as ActivityItem[]),
        ...((coachingResult.data ?? []).map((item) => ({
          href: `/board/coaching/${item.id}`,
          kind: "教習募集",
          title: item.title,
          created_at: item.created_at,
          status: item.status,
        })) as ActivityItem[]),
        ...((replayResult.data ?? []).map((item) => ({
          href: `/replay-review/${item.id}`,
          kind: "リプレイコーチング",
          title: item.title,
          created_at: item.created_at,
          status: item.status,
        })) as ActivityItem[]),
      ].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setIsBlocked(false);
      setProfile(profileResult.data as ProfileRow);
      setActivities(nextActivities.slice(0, 8));
      setMessage("公開プロフィールを表示しています。");
      setIsLoading(false);
    }

    void loadPage().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setMessage(error instanceof Error ? error.message : "読み込みに失敗しました。");
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header className="panel rounded-[28px] px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Image src="/logo-white.svg" alt="Rush Link" width={148} height={32} />
          <Link
            href="/"
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
              ブロック中のためプロフィールを表示していません。
            </p>
          </section>
        ) : !profile ? (
          <section className="panel rounded-[30px] px-6 py-6">
            <p className="text-sm text-[var(--muted)]">プロフィールが見つかりません。</p>
          </section>
        ) : (
          <>
            <section className="panel rounded-[30px] px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-white">{profile.display_name}</h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{profile.bio}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CharacterChip
                    name={profile.main_character}
                    labelPrefix="メイン"
                    size="md"
                    tone="accent"
                  />
                  <CharacterChip
                    name={profile.sub_character}
                    labelPrefix="サブ"
                    size="md"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-[var(--muted)]">メインランク</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {profile.main_character_rank || "未設定"}
                    {profile.main_character_rank === "マスター" && profile.main_character_mr
                      ? ` / MR ${profile.main_character_mr}`
                      : ""}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-[var(--muted)]">サブランク</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {profile.sub_character_rank || "未設定"}
                    {profile.sub_character_rank === "マスター" && profile.sub_character_mr
                      ? ` / MR ${profile.sub_character_mr}`
                      : ""}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-[var(--muted)]">プラットフォーム</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {profile.platform || "未設定"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-[var(--muted)]">通話設定</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {profile.voice_preference || "未設定"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-[var(--muted)]">X</p>
                  <p className="mt-2 text-base text-white">{profile.x_account || "未設定"}</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-[var(--muted)]">Discord</p>
                  <p className="mt-2 text-base text-white">
                    {profile.discord_account || "未設定"}
                  </p>
                </div>
              </div>

              <ModerationActions
                targetUserId={profile.user_id}
                targetName={profile.display_name}
                targetKind="profile"
                targetSource="profiles"
                targetTitle={profile.display_name}
              />
            </section>

            <section className="panel rounded-[30px] px-6 py-6">
              <h2 className="text-2xl font-semibold text-white">最近の投稿</h2>
              {activities.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">投稿はまだありません。</p>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {activities.map((activity) => (
                    <Link
                      key={`${activity.kind}-${activity.href}`}
                      href={activity.href}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-4 transition-colors hover:bg-black/30"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                          {activity.kind}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-white">
                        {activity.title}
                      </h3>
                      <p className="mt-2 text-xs text-[var(--muted)]/80">
                        投稿日時: {formatPostedAt(activity.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
