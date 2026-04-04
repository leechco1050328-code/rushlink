"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { ComboFlowCanvas } from "@/components/combo-flow-canvas";
import {
  getComboFlowEditHref,
  getComboFlowControlSchemeLabel,
  type ComboFlowCharacter,
  type ComboFlowPost,
} from "@/lib/combo-flow";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ComboFlowViewerProps = {
  postId: number;
};

function formatPostedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "読み込みに失敗しました。";
}

export function ComboFlowViewer({ postId }: ComboFlowViewerProps) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [post, setPost] = useState<ComboFlowPost | null>(null);
  const [message, setMessage] = useState(
    supabase ? "コンボフローを読み込んでいます..." : "Supabase の設定待ちです。",
  );
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadPost() {
      const [
        {
          data: { session: activeSession },
        },
        postResult,
      ] = await Promise.all([
        client.auth.getSession(),
        client
          .from("combo_flow_posts")
          .select(
            "id, user_id, author_name, character_name, control_scheme, title, summary, flow_nodes, flow_edges, created_at, updated_at",
          )
          .eq("id", postId)
          .maybeSingle(),
      ]);

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      if (postResult.error) {
        setMessage(`読み込みに失敗しました: ${postResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (!postResult.data) {
        setMessage("コンボフローが見つかりません。");
        setIsLoading(false);
        return;
      }

      setPost(postResult.data as ComboFlowPost);
      setIsLoading(false);
      setMessage("");
    }

    loadPost().catch((error: unknown) => {
      if (!mounted) {
        return;
      }

      setMessage(`読み込みに失敗しました: ${getMessageFromError(error)}`);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [postId, supabase]);

  const isOwner = Boolean(session?.user?.id && post?.user_id === session.user.id);

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative flex min-h-screen flex-col gap-4 px-2 py-3 md:px-3 md:py-4">
        <header className="panel flex flex-wrap items-start justify-between gap-4 rounded-[30px] px-6 py-6">
          <div className="space-y-4">
            <Link
              href="/combo-flow"
              className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
            >
              コンボフロー管理へ戻る
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <Image
                src="/logo-white.svg"
                alt="Rush Link"
                width={400}
                height={120}
                className="h-9 w-auto md:h-10"
              />
              <span className="pill-button rounded-full border border-[var(--secondary)]/35 bg-[var(--secondary)]/12 px-3 py-1 text-xs text-[var(--secondary)]">
                Beta
              </span>
            </div>
          </div>

          {isOwner && post ? (
            <Link href={getComboFlowEditHref(post.id)} className="primary-action">
              編集する
            </Link>
          ) : null}
        </header>

        {isLoading || !post ? (
          <section className="panel rounded-[26px] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--muted)]">
              {isLoading ? "読み込み中です..." : message}
            </p>
          </section>
        ) : (
          <>
            <section className="panel rounded-[26px] px-5 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <CharacterChip
                  name={post.character_name as ComboFlowCharacter}
                  size="md"
                  tone="accent"
                />
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                  {getComboFlowControlSchemeLabel(post.control_scheme ?? "classic")}
                </span>
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                  投稿者: {post.author_name}
                </span>
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                  作成: {formatPostedAt(post.created_at)}
                </span>
                {post.updated_at ? (
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                    更新: {formatPostedAt(post.updated_at)}
                  </span>
                ) : null}
              </div>
            </section>

            <section className="relative rounded-[26px] border border-white/10 bg-black/15 p-1">
              <ComboFlowCanvas
                nodes={post.flow_nodes}
                edges={post.flow_edges}
                controlScheme={post.control_scheme ?? "classic"}
                interactive={false}
              />
            </section>
          </>
        )}
      </section>
    </main>
  );
}
