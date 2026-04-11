"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PulseMetrics = {
  recruitment: number;
  coaching: number;
  replay: number;
};

type ActivityItem = {
  key: string;
  href: string;
  label: string;
  headline: string;
  meta: string;
  createdAt: string;
  toneClass: string;
};

type RecruitmentRow = {
  id: number;
  author_name: string;
  character_name: string;
  platform: string;
  created_at: string;
};

type CoachingRow = {
  id: number;
  author_name: string;
  post_type: string;
  character_name: string;
  current_rank: string;
  created_at: string;
};

type ReplayRow = {
  id: number;
  author_name: string;
  character_name: string;
  current_rank: string;
  replay_id: string;
  created_at: string;
};

const emptyMetrics: PulseMetrics = {
  recruitment: 0,
  coaching: 0,
  replay: 0,
};

function formatPostedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function trimText(value: string, maxLength = 42) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function buildRecruitmentHeadline(row: RecruitmentRow) {
  if (row.character_name) {
    return `${row.character_name}で対戦相手を募集中`;
  }

  return "対戦相手を募集中";
}

function buildCoachingHeadline(row: CoachingRow) {
  if (row.post_type) {
    return `${row.post_type}募集`;
  }

  return "教えて / 教わりたい募集";
}

function buildReplayHeadline(row: ReplayRow) {
  if (row.character_name) {
    return `${row.character_name}のリプレイ相談`;
  }

  return "リプレイコーチング相談";
}

export function CommunityPulse() {
  const supabase = getSupabaseBrowserClient();
  const [metrics, setMetrics] = useState<PulseMetrics>(emptyMetrics);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let active = true;

    async function loadPulse() {
      const [
        recruitmentCountResult,
        coachingCountResult,
        replayCountResult,
        recruitmentResult,
        coachingResult,
        replayResult,
      ] = await Promise.all([
        client
          .from("recruitment_posts")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        client
          .from("coaching_posts")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        client
          .from("replay_review_posts")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        client
          .from("recruitment_posts")
          .select("id, author_name, character_name, platform, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(3),
        client
          .from("coaching_posts")
          .select("id, author_name, post_type, character_name, current_rank, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(3),
        client
          .from("replay_review_posts")
          .select("id, author_name, character_name, current_rank, replay_id, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      if (!active) {
        return;
      }

      if (
        recruitmentCountResult.error ||
        coachingCountResult.error ||
        replayCountResult.error ||
        recruitmentResult.error ||
        coachingResult.error ||
        replayResult.error
      ) {
        setMetrics(emptyMetrics);
        setItems([]);
        setIsLoading(false);
        return;
      }

      const nextMetrics: PulseMetrics = {
        recruitment: recruitmentCountResult.count ?? 0,
        coaching: coachingCountResult.count ?? 0,
        replay: replayCountResult.count ?? 0,
      };

      const activityItems: ActivityItem[] = [
        ...((recruitmentResult.data ?? []) as RecruitmentRow[]).map((row) => ({
          key: `recruitment-${row.id}`,
          href: `/board/recruitment/${row.id}`,
          label: "対戦募集",
          headline: trimText(buildRecruitmentHeadline(row)),
          meta: trimText(`${row.author_name || "プレイヤー"} / ${row.platform || "プラットフォーム未設定"}`),
          createdAt: row.created_at,
          toneClass: "bg-[var(--accent)]/16 text-[var(--accent-soft)]",
        })),
        ...((coachingResult.data ?? []) as CoachingRow[]).map((row) => ({
          key: `coaching-${row.id}`,
          href: `/board/coaching/${row.id}`,
          label: "教えて / 教わりたい",
          headline: trimText(buildCoachingHeadline(row)),
          meta: trimText(
            `${row.author_name || "プレイヤー"} / ${row.character_name || "キャラ未設定"}${row.current_rank ? ` / ${row.current_rank}` : ""}`,
          ),
          createdAt: row.created_at,
          toneClass: "bg-[var(--secondary)]/16 text-[var(--secondary)]",
        })),
        ...((replayResult.data ?? []) as ReplayRow[]).map((row) => ({
          key: `replay-${row.id}`,
          href: `/replay-review/${row.id}`,
          label: "リプレイ相談",
          headline: trimText(buildReplayHeadline(row)),
          meta: trimText(
            `${row.author_name || "プレイヤー"} / ${row.current_rank || "ランク未設定"}${row.replay_id ? ` / ID:${row.replay_id}` : ""}`,
          ),
          createdAt: row.created_at,
          toneClass: "bg-white/10 text-white/78",
        })),
      ]
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .slice(0, 6);

      setMetrics(nextMetrics);
      setItems(activityItems);
      setIsLoading(false);
    }

    loadPulse().catch(() => {
      if (!active) {
        return;
      }

      setMetrics(emptyMetrics);
      setItems([]);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  const totalCount = metrics.recruitment + metrics.coaching + metrics.replay;

  return (
    <section className="grid gap-4 lg:grid-cols-[1.05fr_1.45fr]">
      <article className="panel rounded-[30px] px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="community-live-badge">
            <span className="community-live-dot" />
            LIVE
          </span>
          <span className="display text-xs text-[var(--accent-soft)]">Community Pulse</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-white/70">いま公開中の募集と相談</p>
            <p className="display text-4xl leading-none text-white md:text-5xl">{totalCount}</p>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[var(--muted)]">
            対戦募集、教えて / 教わりたい募集、リプレイ相談の公開件数をまとめています。入った瞬間に、いまの動きが分かる構成です。
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href="/board" className="community-stat-card">
            <span className="text-xs tracking-[0.18em] text-white/58">対戦募集</span>
            <strong className="display text-3xl text-white">{isLoading ? "…" : metrics.recruitment}</strong>
            <span className="text-xs text-[var(--muted)]">募集中の投稿を見る</span>
          </Link>

          <Link href="/board?purpose=coaching" className="community-stat-card">
            <span className="text-xs tracking-[0.12em] text-white/58">教えて / 教わりたい</span>
            <strong className="display text-3xl text-white">{isLoading ? "…" : metrics.coaching}</strong>
            <span className="text-xs text-[var(--muted)]">学びの募集を確認する</span>
          </Link>

          <Link href="/replay-review" className="community-stat-card">
            <span className="text-xs tracking-[0.18em] text-white/58">リプレイ相談</span>
            <strong className="display text-3xl text-white">{isLoading ? "…" : metrics.replay}</strong>
            <span className="text-xs text-[var(--muted)]">最新の相談を見る</span>
          </Link>
        </div>
      </article>

      <article className="panel rounded-[30px] px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="display text-xs text-[var(--accent-soft)]">Latest Activity</p>
            <h3 className="text-2xl font-semibold text-white">最新アクティビティ</h3>
          </div>
          <Link href="/board" className="secondary-action min-h-0 px-4 py-2 text-sm">
            一覧ページへ
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {items.length > 0 ? (
            items.map((item) => (
              <Link key={item.key} href={item.href} className="community-activity-item">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs ${item.toneClass}`}>
                      {item.label}
                    </span>
                    <p className="text-sm font-semibold text-white">{item.headline}</p>
                    <p className="text-xs leading-6 text-[var(--muted)]">{item.meta}</p>
                  </div>
                  <span className="shrink-0 text-xs text-white/45">{formatPostedAt(item.createdAt)}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="community-activity-item">
              <p className="text-sm leading-7 text-[var(--muted)]">
                {isLoading
                  ? "最新の投稿を読み込んでいます。"
                  : "まだ表示できるアクティビティがありません。最初の投稿が入ると、ここに動きが出ます。"}
              </p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
