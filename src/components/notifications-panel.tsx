"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  fetchApplicationsForOwner,
  markApplicationsAsRead,
  type CommunityApplication,
} from "@/lib/community-applications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function formatPostedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildPostHref(application: CommunityApplication) {
  if (application.post_source === "recruitment_posts") {
    return `/board/recruitment/${application.post_id}`;
  }

  return `/board/coaching/${application.post_id}`;
}

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "通知の読み込みに失敗しました。";
}

export function NotificationsPanel() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [applications, setApplications] = useState<CommunityApplication[]>([]);
  const [message, setMessage] = useState(
    supabase ? "通知を読み込み中です..." : "Supabase の設定が入っていません。",
  );
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadNotifications() {
      const {
        data: { session: activeSession },
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      if (!activeSession?.user) {
        setApplications([]);
        setIsLoading(false);
        setMessage("通知を見るにはログインしてください。");
        return;
      }

      const rows = await fetchApplicationsForOwner(client, activeSession.user.id);

      if (!mounted) {
        return;
      }

      setApplications(rows);
      setIsLoading(false);
      setMessage(`応募通知を ${rows.length} 件表示しています。`);
    }

    loadNotifications().catch((error: unknown) => {
      if (!mounted) {
        return;
      }

      setIsLoading(false);
      setMessage(getMessageFromError(error));
    });

    return () => {
      mounted = false;
    };
  }, [supabase]);

  function handleMarkAllRead() {
    if (!supabase || !session?.user) {
      return;
    }

    const unreadIds = applications.filter((item) => !item.read_at).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    startTransition(async () => {
      try {
        await markApplicationsAsRead(supabase, session.user.id, unreadIds);
        setApplications((current) =>
          current.map((item) =>
            unreadIds.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item,
          ),
        );
        setMessage("未読通知を既読にしました。");
      } catch (error: unknown) {
        setMessage(getMessageFromError(error));
      }
    });
  }

  return (
    <section className="panel rounded-[30px] px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-7 text-[var(--muted)]">{message}</p>
        {session?.user ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending || applications.every((item) => item.read_at)}
            className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
          >
            {isPending ? "更新中..." : "すべて既読にする"}
          </button>
        ) : null}
      </div>

      {!session?.user ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
          ログイン後に通知一覧が表示されます。
        </div>
      ) : isLoading ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
          読み込み中...
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
          まだ応募通知はありません。
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-[24px] border border-white/10 bg-black/20 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill-button rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                  {application.post_kind}
                </span>
                {!application.read_at ? (
                  <span className="rounded-full bg-[var(--secondary)]/15 px-3 py-1 text-xs text-[var(--secondary)]">
                    未読
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                <Link
                  href={`/players/${application.applicant_user_id}`}
                  className="text-[var(--accent-soft)] underline underline-offset-4"
                >
                  {application.applicant_name}
                </Link>
                さんが「{application.application_type}」を送りました。
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{application.post_title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                対象キャラ: {application.post_character_name || "未設定"}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{application.message}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--muted)]/80">
                  受信日時: {formatPostedAt(application.created_at)}
                </p>
                <Link
                  href={buildPostHref(application)}
                  className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
                >
                  募集詳細を見る
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
