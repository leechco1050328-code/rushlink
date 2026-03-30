"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { AdSenseSlot } from "@/components/adsense-slot";
import { CharacterChip } from "@/components/character-chip";
import { ComboFlowCanvas } from "@/components/combo-flow-canvas";
import { SharePostActions } from "@/components/share-post-actions";
import { getAdSenseMidSlot } from "@/lib/adsense";
import {
  COMBO_FLOW_CHARACTERS,
  buildComboFlowTitle,
  createEmptyComboNode,
  getComboFlowDetailHref,
  type ComboFlowCharacter,
  type ComboFlowEdge,
  type ComboFlowNode,
  type ComboFlowNodeTag,
  type ComboFlowPost,
} from "@/lib/combo-flow";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ComboFlowEditorProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
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

  return "保存に失敗しました。";
}

function normalizeNodes(nodes: ComboFlowNode[]) {
  return nodes.filter((node) => node.move.trim());
}

function normalizeEdges(edges: ComboFlowEdge[], nodeIds: Set<string>) {
  return edges.filter(
    (edge) =>
      edge.from &&
      edge.to &&
      edge.from !== edge.to &&
      nodeIds.has(edge.from) &&
      nodeIds.has(edge.to),
  );
}

function createInitialNodes() {
  return [createEmptyComboNode(0), createEmptyComboNode(1)];
}

export function ComboFlowEditor(props: ComboFlowEditorProps) {
  const supabase = getSupabaseBrowserClient();
  const bottomAdSlot = getAdSenseMidSlot();
  const [session, setSession] = useState<Session | null>(null);
  const [post, setPost] = useState<ComboFlowPost | null>(null);
  const [isOwner, setIsOwner] = useState(props.mode === "create");
  const [characterName, setCharacterName] = useState<ComboFlowCharacter | "">("");
  const [summary, setSummary] = useState("");
  const [nodes, setNodes] = useState<ComboFlowNode[]>(createInitialNodes());
  const [edges, setEdges] = useState<ComboFlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState(
    props.mode === "create"
      ? "新しいコンボフローを作成します。"
      : "コンボフローを読み込んでいます...",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadEditor() {
      const {
        data: { session: activeSession },
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      if (props.mode === "create") {
        setIsOwner(Boolean(activeSession?.user));
        setMessage(
          activeSession?.user
            ? "キャラクターを選んで、ノードをホバーしながらフローを組み立てます。"
            : "コンボフローを作成するにはログインしてください。",
        );
        return;
      }

      const { data, error } = await client
        .from("combo_flow_posts")
        .select(
          "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at, updated_at",
        )
        .eq("id", props.postId)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (error) {
        setMessage(`読み込みに失敗しました: ${error.message}`);
        return;
      }

      if (!data) {
        setMessage("コンボフローが見つかりません。");
        return;
      }

      const nextPost = data as ComboFlowPost;
      setPost(nextPost);
      setCharacterName(
        COMBO_FLOW_CHARACTERS.includes(nextPost.character_name as ComboFlowCharacter)
          ? (nextPost.character_name as ComboFlowCharacter)
          : "",
      );
      setSummary(nextPost.summary ?? "");
      setNodes(Array.isArray(nextPost.flow_nodes) ? nextPost.flow_nodes : createInitialNodes());
      setEdges(Array.isArray(nextPost.flow_edges) ? nextPost.flow_edges : []);
      setIsOwner(activeSession?.user?.id === nextPost.user_id);
      setMessage(
        activeSession?.user?.id === nextPost.user_id
          ? "ノードをホバーすると技やラベルを編集できます。"
          : "公開中のコンボフローを表示しています。",
      );
    }

    loadEditor().catch((error: unknown) => {
      if (!mounted) {
        return;
      }
      setMessage(`読み込みに失敗しました: ${getMessageFromError(error)}`);
    });

    return () => {
      mounted = false;
    };
  }, [props, supabase]);

  function updateNode(nodeId: string, patch: Partial<ComboFlowNode>) {
    setNodes((current) =>
      current.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    );
  }

  function toggleNodeTag(nodeId: string, tag: ComboFlowNodeTag) {
    setNodes((current) =>
      current.map((node) =>
        node.id !== nodeId
          ? node
          : {
              ...node,
              tags: node.tags.includes(tag)
                ? node.tags.filter((item) => item !== tag)
                : [...node.tags, tag],
            },
      ),
    );
  }

  function removeNode(nodeId: string) {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) =>
      current.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
    );
    setSelectedNodeId((current) => (current === nodeId ? null : current));
  }

  function addNode() {
    const nextNode = createEmptyComboNode(nodes.length);
    setNodes((current) => [...current, nextNode]);
    setSelectedNodeId(nextNode.id);
    setMessage("ノードを追加しました。ホバーして内容を入力できます。");
  }

  function addEdge(fromNodeId: string, toNodeId: string) {
    if (!isOwner) {
      return;
    }

    const exists = edges.some((edge) => edge.from === fromNodeId && edge.to === toNodeId);
    if (exists) {
      setMessage("同じ接続はすでに存在しています。");
      return;
    }

    setEdges((current) => [
      ...current,
      {
        id: `edge-${Date.now()}-${current.length}`,
        from: fromNodeId,
        to: toNodeId,
        action: "",
        note: "",
      },
    ]);
    setMessage("矢印を追加しました。ラベルをホバーすると補足を編集できます。");
  }

  function updateEdge(edgeId: string, patch: Partial<ComboFlowEdge>) {
    setEdges((current) =>
      current.map((edge) => (edge.id === edgeId ? { ...edge, ...patch } : edge)),
    );
  }

  function removeEdge(edgeId: string) {
    setEdges((current) => current.filter((edge) => edge.id !== edgeId));
  }

  function handleSave() {
    if (!supabase || !session?.user || !isOwner) {
      setMessage("保存するにはログインが必要です。");
      return;
    }

    if (!characterName) {
      setMessage("キャラクターを選択してください。");
      return;
    }

    const nextNodes = normalizeNodes(nodes);
    if (nextNodes.length < 2) {
      setMessage("最低2つの技ノードを入れてください。");
      return;
    }

    const nodeIds = new Set(nextNodes.map((node) => node.id));
    const nextEdges = normalizeEdges(edges, nodeIds);
    if (nextEdges.length === 0) {
      setMessage("ノード同士を矢印で1本以上つないでください。");
      return;
    }

    startTransition(async () => {
      try {
        const displayName = String(session.user.user_metadata.display_name ?? "").trim();
        const authorName = displayName || (session.user.email ?? "").split("@")[0] || "プレイヤー";
        const title = buildComboFlowTitle(nextNodes);

        if (props.mode === "create") {
          const { data, error } = await supabase
            .from("combo_flow_posts")
            .insert({
              user_id: session.user.id,
              author_name: authorName,
              character_name: characterName,
              title,
              summary: summary.trim(),
              flow_nodes: nextNodes,
              flow_edges: nextEdges,
            })
            .select(
              "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at, updated_at",
            )
            .single();

          if (error) {
            throw error;
          }

          window.location.href = getComboFlowDetailHref((data as ComboFlowPost).id);
          return;
        }

        const { data, error } = await supabase
          .from("combo_flow_posts")
          .update({
            character_name: characterName,
            title,
            summary: summary.trim(),
            flow_nodes: nextNodes,
            flow_edges: nextEdges,
            updated_at: new Date().toISOString(),
          })
          .eq("id", props.postId)
          .select(
            "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at, updated_at",
          )
          .single();

        if (error) {
          throw error;
        }

        const nextPost = data as ComboFlowPost;
        setPost(nextPost);
        setMessage("コンボフローを更新しました。");
      } catch (error: unknown) {
        setMessage(`保存に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative flex min-h-screen flex-col gap-4 px-2 py-3 md:px-3 md:py-4">
        <header className="panel flex flex-wrap items-center justify-between gap-4 rounded-[26px] px-5 py-4">
          <div className="space-y-2">
            <Link
              href="/combo-flow"
              className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
            >
              コンボフロー管理へ戻る
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {props.mode === "create" ? "新規コンボフロー作成" : "コンボフロー編集"}
            </h1>
            <p className="text-sm leading-7 text-[var(--muted)]">{message}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isOwner && session?.user ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="primary-action min-w-[11rem] disabled:opacity-60"
              >
                {isPending ? "保存中..." : props.mode === "create" ? "作成する" : "更新する"}
              </button>
            ) : null}
            {post ? <SharePostActions title={post.title} path={getComboFlowDetailHref(post.id)} /> : null}
          </div>
        </header>

        <section className="grid min-h-[calc(100vh-180px)] gap-3 xl:grid-cols-[232px_minmax(0,1fr)]">
          <aside className="panel self-start rounded-[26px] px-4 py-4 xl:sticky xl:top-3">
            {!session?.user ? (
              <div className="space-y-4">
                <p className="text-sm leading-7 text-[var(--muted)]">
                  コンボフローを作成・編集するにはログインしてください。
                </p>
                <Link href="/auth?mode=sign-in" className="primary-action w-full">
                  ログインする
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--muted)]">キャラクター</span>
                  <select
                    value={characterName}
                    onChange={(event) => setCharacterName(event.target.value as ComboFlowCharacter)}
                    disabled={!isOwner}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                  >
                    <option value="">選択してください</option>
                    {COMBO_FLOW_CHARACTERS.map((character) => (
                      <option key={character} value={character}>
                        {character}
                      </option>
                    ))}
                  </select>
                </label>

                {characterName ? <CharacterChip name={characterName} size="md" tone="accent" /> : null}

                {isOwner ? (
                  <button
                    type="button"
                    onClick={addNode}
                    className="secondary-action w-full min-h-0 px-4 py-3 text-sm"
                  >
                    ノードを追加
                  </button>
                ) : null}

                <p className="text-xs leading-6 text-[var(--muted)]">
                  ノードにマウスオーバーすると、技・ラベル・メモをその場で編集できます。
                </p>

                {post && !isOwner ? (
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-[var(--muted)]">
                    投稿者: {post.author_name}
                    <br />
                    投稿日: {formatPostedAt(post.created_at)}
                  </div>
                ) : null}
              </div>
            )}
          </aside>

          <section className="rounded-[26px] border border-white/10 bg-black/15 p-1">
            <ComboFlowCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              interactive={Boolean(session?.user && isOwner)}
              onSelectNode={setSelectedNodeId}
              onMoveNode={(nodeId, nextX, nextY) => updateNode(nodeId, { x: nextX, y: nextY })}
              onCreateEdge={addEdge}
              onUpdateNode={updateNode}
              onToggleNodeTag={toggleNodeTag}
              onDeleteNode={removeNode}
              onUpdateEdge={updateEdge}
              onDeleteEdge={removeEdge}
            />
          </section>
        </section>

        {bottomAdSlot ? (
          <section>
            <AdSenseSlot slot={bottomAdSlot} label="Advertisement" />
          </section>
        ) : null}
      </section>
    </main>
  );
}
