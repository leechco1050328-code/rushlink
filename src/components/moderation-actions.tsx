"use client";

import { useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ModerationActionsProps = {
  targetUserId: string;
  targetName: string;
  targetKind: "profile" | "community_post" | "replay_review";
  targetSource: "profiles" | "recruitment_posts" | "coaching_posts" | "replay_review_posts";
  targetId?: number | null;
  targetTitle?: string;
};

const reportReasons = ["迷惑行為", "スパム", "不適切な内容", "なりすまし", "その他"];

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "不明なエラーが発生しました。";
}

export function ModerationActions({
  targetUserId,
  targetName,
  targetKind,
  targetSource,
  targetId,
  targetTitle = "",
}: ModerationActionsProps) {
  const supabase = getSupabaseBrowserClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reason, setReason] = useState(reportReasons[0]);
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadState() {
      if (!supabase) {
        return;
      }

      const client = supabase;
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!isMounted) {
        return;
      }

      const nextUserId = session?.user.id ?? null;
      const nextUserName =
        String(session?.user.user_metadata.display_name ?? "").trim() ||
        (session?.user.email ?? "").split("@")[0] ||
        "プレイヤー";

      setCurrentUserId(nextUserId);
      setCurrentUserName(nextUserName);

      if (!nextUserId || nextUserId === targetUserId) {
        setIsBlocked(false);
        return;
      }

      const { data, error } = await client
        .from("user_blocks")
        .select("blocked_user_id")
        .eq("blocker_user_id", nextUserId)
        .eq("blocked_user_id", targetUserId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setMessage(`ブロック状態の確認に失敗しました: ${error.message}`);
        return;
      }

      setIsBlocked(Boolean(data?.blocked_user_id));
    }

    void loadState().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setMessage(getMessageFromError(error));
    });

    return () => {
      isMounted = false;
    };
  }, [supabase, targetUserId]);

  if (!supabase || !currentUserId || currentUserId === targetUserId) {
    return null;
  }

  function handleBlockToggle() {
    if (!supabase) {
      return;
    }

    const client = supabase;
    startTransition(async () => {
      try {
        if (isBlocked) {
          const { error } = await client
            .from("user_blocks")
            .delete()
            .eq("blocker_user_id", currentUserId)
            .eq("blocked_user_id", targetUserId);

          if (error) {
            throw error;
          }

          setIsBlocked(false);
          setMessage("ブロックを解除しました。");
          return;
        }

        const { error } = await client.from("user_blocks").insert({
          blocker_user_id: currentUserId,
          blocked_user_id: targetUserId,
        });

        if (error) {
          throw error;
        }

        setIsBlocked(true);
        setMessage("このユーザーをブロックしました。");
      } catch (error: unknown) {
        setMessage(`ブロック操作に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleReportSubmit() {
    if (!supabase) {
      return;
    }

    const client = supabase;
    startTransition(async () => {
      try {
        const { error } = await client.from("reports").insert({
          reporter_user_id: currentUserId,
          reporter_name: currentUserName,
          target_user_id: targetUserId,
          target_name: targetName,
          target_kind: targetKind,
          target_source: targetSource,
          target_id: targetId ?? null,
          target_title: targetTitle,
          reason,
          detail: detail.trim(),
          status: "open",
        });

        if (error) {
          throw error;
        }

        setDetail("");
        setIsReportOpen(false);
        setMessage("通報を送信しました。");
      } catch (error: unknown) {
        setMessage(`通報に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleBlockToggle}
          disabled={isPending}
          className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
        >
          {isBlocked ? "ブロック解除" : "ブロック"}
        </button>
        <button
          type="button"
          onClick={() => setIsReportOpen((current) => !current)}
          disabled={isPending}
          className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
        >
          通報
        </button>
      </div>

      {isReportOpen ? (
        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">理由</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            >
              {reportReasons.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">詳細</span>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="補足があれば入力してください。"
            />
          </label>
          <button
            type="button"
            onClick={handleReportSubmit}
            disabled={isPending}
            className="primary-action disabled:opacity-60"
          >
            {isPending ? "送信中..." : "この内容で通報する"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{message}</p>
      ) : null}
    </div>
  );
}
