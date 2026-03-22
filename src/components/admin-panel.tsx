"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ReportRow = {
  id: number;
  reporter_name: string;
  target_name: string;
  target_kind: string;
  target_source: string;
  target_id: number | null;
  target_title: string;
  reason: string;
  detail: string;
  status: string;
  created_at: string;
  target_user_id: string | null;
};

type BannedUserRow = {
  user_id: string;
  reason: string;
  created_at: string;
};

function formatPostedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTargetHref(report: ReportRow) {
  if (report.target_source === "recruitment_posts") {
    return `/board/recruitment/${report.target_id}`;
  }
  if (report.target_source === "coaching_posts") {
    return `/board/coaching/${report.target_id}`;
  }
  if (report.target_source === "replay_review_posts") {
    return `/replay-review/${report.target_id}`;
  }
  if (report.target_source === "profiles" && report.target_user_id) {
    return `/players/${report.target_user_id}`;
  }

  return "";
}

export function AdminPanel() {
  const supabase = getSupabaseBrowserClient();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUserRow[]>([]);
  const [message, setMessage] = useState("管理情報を読み込み中です。");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchAdminData = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      setMessage("Supabase の設定情報がまだ入っていません。");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setIsLoading(false);
      setMessage("管理画面を見るにはログインが必要です。");
      return;
    }

    const response = await fetch("/api/admin/moderation", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; reports?: ReportRow[]; bannedUsers?: BannedUserRow[] }
      | null;

    if (!response.ok) {
      setIsLoading(false);
      setMessage(payload?.error ?? "管理情報の取得に失敗しました。");
      return;
    }

    setReports(payload?.reports ?? []);
    setBannedUsers(payload?.bannedUsers ?? []);
    setMessage("通報一覧と BAN 一覧を表示しています。");
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchAdminData().catch((error: unknown) => {
        setIsLoading(false);
        setMessage(error instanceof Error ? error.message : "取得に失敗しました。");
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchAdminData]);

  function postAction(payload: Record<string, unknown>, successMessage: string) {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessage("再ログインしてください。");
        return;
      }

      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "更新に失敗しました。");
        return;
      }

      await fetchAdminData();
      setMessage(successMessage);
    });
  }

  return (
    <div className="grid gap-6">
      <section className="panel rounded-[30px] px-6 py-6">
        <p className="text-sm leading-7 text-[var(--muted)]">{message}</p>
      </section>

      <section className="panel rounded-[30px] px-6 py-6">
        <h2 className="text-2xl font-semibold text-white">通報一覧</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-[var(--muted)]">読み込み中...</p>
        ) : reports.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">通報はまだありません。</p>
        ) : (
          <div className="mt-5 grid gap-4">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-[24px] border border-white/10 bg-black/20 p-5"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="pill-button bg-[var(--accent)]/15 px-3 py-1 text-xs text-[var(--accent-soft)]">
                    {report.target_kind}
                  </span>
                  <span className="pill-button bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                    {report.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  通報者: {report.reporter_name} / 対象: {report.target_name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  理由: {report.reason}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  詳細: {report.detail || "なし"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]/80">
                  通報日時: {formatPostedAt(report.created_at)}
                </p>
                {report.target_title ? (
                  <p className="mt-2 text-base font-semibold text-white">
                    {report.target_title}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {getTargetHref(report) ? (
                    <Link
                      href={getTargetHref(report)}
                      className="secondary-action min-h-0 px-4 py-2 text-sm"
                    >
                      対象を開く
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      postAction(
                        { action: "resolve_report", reportId: report.id },
                        "通報を解決済みにしました。",
                      )
                    }
                    className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
                  >
                    解決済みにする
                  </button>
                  {report.target_source !== "profiles" && report.target_id != null ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        postAction(
                          {
                            action: "delete_target",
                            reportId: report.id,
                            targetSource: report.target_source,
                            targetId: report.target_id,
                          },
                          "対象投稿を削除しました。",
                        )
                      }
                      className="rounded-full border border-[var(--accent)]/30 px-4 py-2 text-sm text-[var(--accent-soft)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-60"
                    >
                      対象を削除
                    </button>
                  ) : null}
                  {report.target_user_id ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        postAction(
                          {
                            action: "ban_user",
                            userId: report.target_user_id,
                            reason: report.reason,
                          },
                          "ユーザーを利用停止にしました。",
                        )
                      }
                      className="rounded-full border border-[var(--accent)]/30 px-4 py-2 text-sm text-[var(--accent-soft)] transition-colors hover:bg-[var(--accent)]/10 disabled:opacity-60"
                    >
                      利用停止
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel rounded-[30px] px-6 py-6">
        <h2 className="text-2xl font-semibold text-white">利用停止中のユーザー</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-[var(--muted)]">読み込み中...</p>
        ) : bannedUsers.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">利用停止中のユーザーはいません。</p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {bannedUsers.map((row) => (
              <article
                key={row.user_id}
                className="rounded-[24px] border border-white/10 bg-black/20 p-5"
              >
                <p className="text-sm text-[var(--muted)]">ユーザーID</p>
                <p className="mt-2 break-all text-sm text-white">{row.user_id}</p>
                <p className="mt-3 text-sm text-[var(--muted)]">理由: {row.reason || "未設定"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]/80">
                  登録日: {formatPostedAt(row.created_at)}
                </p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    postAction(
                      { action: "unban_user", userId: row.user_id },
                      "利用停止を解除しました。",
                    )
                  }
                  className="secondary-action mt-4 min-h-0 px-4 py-2 text-sm disabled:opacity-60"
                >
                  利用停止を解除
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
