"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { AdSenseSlot } from "@/components/adsense-slot";
import { CharacterChip } from "@/components/character-chip";
import { ComboFlowCanvas } from "@/components/combo-flow-canvas";
import { SharePostActions } from "@/components/share-post-actions";
import { getAdSenseMidSlot } from "@/lib/adsense";
import {
  COMBO_FLOW_CHARACTERS,
  COMBO_FLOW_EDGE_HINTS,
  COMBO_FLOW_NODE_TAGS,
  buildComboFlowTitle,
  createEmptyComboNode,
  getComboFlowDetailHref,
  type ComboFlowCharacter,
  type ComboFlowEdge,
  type ComboFlowNode,
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

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

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
          ? "自分のコンボフローを編集中です。"
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
  }

  function toggleNodeTag(tag: (typeof COMBO_FLOW_NODE_TAGS)[number]) {
    if (!selectedNode) {
      return;
    }

    updateNode(selectedNode.id, {
      tags: selectedNode.tags.includes(tag)
        ? selectedNode.tags.filter((item) => item !== tag)
        : [...selectedNode.tags, tag],
    });
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

      <section className="relative flex min-h-screen flex-col gap-6 px-3 py-4 md:px-4 md:py-5">
        <header className="panel flex flex-wrap items-center justify-between gap-4 rounded-[28px] px-5 py-4">
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
          {post ? <SharePostActions title={post.title} path={getComboFlowDetailHref(post.id)} /> : null}
        </header>

        <section className="grid min-h-[calc(100vh-220px)] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="panel self-start rounded-[28px] px-5 py-5 xl:sticky xl:top-4">
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
              <div className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">設定</h2>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    キャラ選択、補足説明、ノード編集をここで行います。
                  </p>
                </div>

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

                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--muted)]">補足説明</span>
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    disabled={!isOwner}
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-60"
                    placeholder="例: 2MK始動の安定ルート。微歩きが必要な分岐だけ矢印に書きます。"
                  />
                </label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">ノード</h3>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={addNode}
                        className="secondary-action min-h-0 px-4 py-2 text-sm"
                      >
                        追加
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    {nodes.map((node, index) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`rounded-[20px] border px-4 py-3 text-left ${
                          selectedNodeId === node.id
                            ? "border-[var(--secondary)] bg-[var(--secondary)]/10"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <span className="block text-xs text-[var(--muted)]">ノード {index + 1}</span>
                        <span className="mt-1 block text-sm font-semibold text-white">
                          {node.move || "技を入力"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedNode ? (
                  <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">選択中ノード</h3>
                      {isOwner && nodes.length > 2 ? (
                        <button
                          type="button"
                          onClick={() => removeNode(selectedNode.id)}
                          className="secondary-action min-h-0 px-3 py-2 text-xs"
                        >
                          削除
                        </button>
                      ) : null}
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm text-[var(--muted)]">技コマンド / 技強度</span>
                      <input
                        value={selectedNode.move}
                        onChange={(event) => updateNode(selectedNode.id, { move: event.target.value })}
                        disabled={!isOwner}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-60"
                        placeholder="例: 2MK / 弱P / OD波動 / SA3"
                      />
                    </label>

                    <div>
                      <span className="mb-2 block text-sm text-[var(--muted)]">ラベル</span>
                      <div className="flex flex-wrap gap-2">
                        {COMBO_FLOW_NODE_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleNodeTag(tag)}
                            disabled={!isOwner}
                            className={`pill-button min-h-0 px-3 py-2 text-xs ${
                              selectedNode.tags.includes(tag)
                                ? "bg-[var(--secondary)]/18 text-[var(--secondary)]"
                                : "border border-white/10 bg-white/5 text-[var(--muted)]"
                            } disabled:opacity-60`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm text-[var(--muted)]">メモ</span>
                      <input
                        value={selectedNode.note}
                        onChange={(event) => updateNode(selectedNode.id, { note: event.target.value })}
                        disabled={!isOwner}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-60"
                        placeholder="例: 先端だと届かない / 画面端限定"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-[var(--muted)]">
                    ノードを選ぶと、ここで内容を編集できます。
                  </div>
                )}

                <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <h3 className="text-lg font-semibold text-white">矢印の補足</h3>
                  {edges.length === 0 ? (
                    <p className="text-sm leading-7 text-[var(--muted)]">
                      ノードの端子をドラッグして接続すると、ここに矢印が追加されます。
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {edges.map((edge, index) => (
                        <article key={edge.id} className="rounded-[20px] border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-[var(--muted)]">矢印 {index + 1}</span>
                            {isOwner ? (
                              <button
                                type="button"
                                onClick={() => removeEdge(edge.id)}
                                className="secondary-action min-h-0 px-3 py-2 text-xs"
                              >
                                削除
                              </button>
                            ) : null}
                          </div>

                          <label className="mt-3 block">
                            <span className="mb-2 block text-sm text-[var(--muted)]">補足動作</span>
                            <input
                              list="combo-edge-hints"
                              value={edge.action}
                              onChange={(event) => updateEdge(edge.id, { action: event.target.value })}
                              disabled={!isOwner}
                              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-60"
                              placeholder="例: 微歩き / DR / 最速"
                            />
                          </label>

                          <label className="mt-3 block">
                            <span className="mb-2 block text-sm text-[var(--muted)]">メモ</span>
                            <input
                              value={edge.note}
                              onChange={(event) => updateEdge(edge.id, { note: event.target.value })}
                              disabled={!isOwner}
                              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-60"
                              placeholder="例: 少し待つ / 密着限定"
                            />
                          </label>
                        </article>
                      ))}
                    </div>
                  )}
                  <datalist id="combo-edge-hints">
                    {COMBO_FLOW_EDGE_HINTS.map((hint) => (
                      <option key={hint} value={hint} />
                    ))}
                  </datalist>
                </div>

                {isOwner ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="primary-action w-full disabled:opacity-60"
                  >
                    {isPending
                      ? "保存中..."
                      : props.mode === "create"
                        ? "コンボフローを作成する"
                        : "コンボフローを更新する"}
                  </button>
                ) : post ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-[var(--muted)]">
                    このフローは閲覧専用です。投稿者: {post.author_name}
                    <br />
                    投稿日: {formatPostedAt(post.created_at)}
                  </div>
                ) : null}
              </div>
            )}
          </aside>

          <section className="panel rounded-[28px] p-2 md:p-3">
            <ComboFlowCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              interactive={Boolean(session?.user && isOwner)}
              onSelectNode={setSelectedNodeId}
              onMoveNode={(nodeId, nextX, nextY) => updateNode(nodeId, { x: nextX, y: nextY })}
              onCreateEdge={addEdge}
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
