"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import {
  ComboFlowCanvas,
  comboFlowCanvasMetrics,
} from "@/components/combo-flow-canvas";
import {
  COMBO_FLOW_EDGE_HINTS,
  COMBO_FLOW_NODE_TAGS,
  buildComboFlowTitle,
  createEmptyComboEdge,
  createEmptyComboNode,
  type ComboFlowEdge,
  type ComboFlowNode,
  type ComboFlowPost,
} from "@/lib/combo-flow";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ComboFlowBoardProps = {
  characterName: string;
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

export function ComboFlowBoard({ characterName }: ComboFlowBoardProps) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<ComboFlowPost[]>([]);
  const [summary, setSummary] = useState("");
  const [nodes, setNodes] = useState<ComboFlowNode[]>([
    createEmptyComboNode(0),
    createEmptyComboNode(1),
  ]);
  const [edges, setEdges] = useState<ComboFlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState(
    supabase ? "コンボフローを読み込んでいます..." : "Supabase の設定待ちです。",
  );
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
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

    async function loadBoard() {
      const {
        data: { session: activeSession },
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(activeSession);

      const { data, error } = await client
        .from("combo_flow_posts")
        .select(
          "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at",
        )
        .eq("character_name", characterName)
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (error) {
        setMessage(`読み込みに失敗しました: ${error.message}`);
        setIsLoading(false);
        return;
      }

      setPosts((data ?? []) as ComboFlowPost[]);
      setMessage(`公開中のコンボフローを ${data?.length ?? 0} 件表示しています。`);
      setIsLoading(false);
    }

    loadBoard().catch((error: unknown) => {
      if (!mounted) {
        return;
      }

      setMessage(`読み込みに失敗しました: ${getMessageFromError(error)}`);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [characterName, supabase]);

  function updateNode(nodeId: string, patch: Partial<ComboFlowNode>) {
    setNodes((current) =>
      current.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    );
  }

  function toggleNodeTag(nodeId: string, tag: (typeof COMBO_FLOW_NODE_TAGS)[number]) {
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }

        return {
          ...node,
          tags: node.tags.includes(tag)
            ? node.tags.filter((item) => item !== tag)
            : [...node.tags, tag],
        };
      }),
    );
  }

  function addNode() {
    const nextNode = createEmptyComboNode(nodes.length);
    setNodes((current) => [...current, nextNode]);
    setSelectedNodeId(nextNode.id);
  }

  function removeNode(nodeId: string) {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) =>
      current.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
    );
    setSelectedNodeId((current) => (current === nodeId ? null : current));
  }

  function moveSelectedNode(deltaX: number, deltaY: number) {
    if (!selectedNode) {
      return;
    }

    updateNode(selectedNode.id, {
      x: Math.max(
        0,
        Math.min(
          comboFlowCanvasMetrics.width - comboFlowCanvasMetrics.nodeWidth,
          selectedNode.x + deltaX,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          comboFlowCanvasMetrics.height - comboFlowCanvasMetrics.nodeHeight,
          selectedNode.y + deltaY,
        ),
      ),
    });
  }

  function addEdge() {
    setEdges((current) => [
      ...current,
      createEmptyComboEdge(current.length, nodes[0]?.id ?? "", nodes[1]?.id ?? ""),
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

  function resetComposer() {
    setSummary("");
    setNodes([createEmptyComboNode(0), createEmptyComboNode(1)]);
    setEdges([]);
    setSelectedNodeId(null);
  }

  function handleSave() {
    if (!supabase || !session?.user) {
      setMessage("保存するにはログインしてください。");
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
      setMessage("最低1本は矢印をつないでください。");
      return;
    }

    startTransition(async () => {
      try {
        const displayName = String(session.user.user_metadata.display_name ?? "").trim();
        const authorName = displayName || (session.user.email ?? "").split("@")[0] || "プレイヤー";
        const title = buildComboFlowTitle(nextNodes);

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
            "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at",
          )
          .single();

        if (error) {
          throw error;
        }

        setPosts((current) => [data as ComboFlowPost, ...current]);
        resetComposer();
        setMessage("コンボフローを保存しました。");
      } catch (error: unknown) {
        setMessage(`保存に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleDelete(postId: number) {
    if (!supabase) {
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await supabase.from("combo_flow_posts").delete().eq("id", postId);
        if (error) {
          throw error;
        }

        setPosts((current) => current.filter((post) => post.id !== postId));
        setMessage("コンボフローを削除しました。");
      } catch (error: unknown) {
        setMessage(`削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="panel rounded-[30px] px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <CharacterChip name={characterName} size="md" tone="accent" />
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
                ノード + 矢印でルート整理
              </span>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">
              ノードには技コマンドや強度、ラベルを入れます。矢印には微歩きやDRなどの補足を付けられます。
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">{message}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        <div className="panel rounded-[30px] px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-white">フローを作成する</h2>
            <button
              type="button"
              onClick={resetComposer}
              className="secondary-action min-h-0 px-4 py-2 text-sm"
            >
              リセット
            </button>
          </div>

          {!session?.user ? (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
              作成するにはログインしてください。閲覧はログインなしでも可能です。
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">このフローのポイント</span>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="例: 2MK始動のノーゲージ安定ルート。微歩きが必要な分岐だけ矢印にメモします。"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">ノード</h3>
                  <button
                    type="button"
                    onClick={addNode}
                    className="secondary-action min-h-0 px-4 py-2 text-sm"
                  >
                    ノード追加
                  </button>
                </div>

                <div className="grid gap-4">
                  {nodes.map((node, index) => (
                    <article
                      key={node.id}
                      className={`rounded-[24px] border p-4 ${
                        selectedNodeId === node.id
                          ? "border-[var(--secondary)] bg-[var(--secondary)]/10"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">ノード {index + 1}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedNodeId(node.id)}
                            className="secondary-action min-h-0 px-3 py-2 text-xs"
                          >
                            選択
                          </button>
                          {nodes.length > 2 ? (
                            <button
                              type="button"
                              onClick={() => removeNode(node.id)}
                              className="secondary-action min-h-0 px-3 py-2 text-xs"
                            >
                              削除
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4">
                        <label className="block">
                          <span className="mb-2 block text-sm text-[var(--muted)]">技コマンド / 技強度</span>
                          <input
                            value={node.move}
                            onChange={(event) => updateNode(node.id, { move: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
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
                                onClick={() => toggleNodeTag(node.id, tag)}
                                className={`pill-button min-h-0 px-3 py-2 text-xs ${
                                  node.tags.includes(tag)
                                    ? "bg-[var(--secondary)]/18 text-[var(--secondary)]"
                                    : "border border-white/10 bg-white/5 text-[var(--muted)]"
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-sm text-[var(--muted)]">補足メモ</span>
                          <input
                            value={node.note}
                            onChange={(event) => updateNode(node.id, { note: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                            placeholder="例: 先端だと届かない / 画面端限定"
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">矢印</h3>
                  <button
                    type="button"
                    onClick={addEdge}
                    className="secondary-action min-h-0 px-4 py-2 text-sm"
                  >
                    矢印追加
                  </button>
                </div>

                <div className="grid gap-4">
                  {edges.length === 0 ? (
                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-[var(--muted)]">
                      まだ矢印がありません。始動から次の技へつないでください。
                    </div>
                  ) : (
                    edges.map((edge, index) => (
                      <article
                        key={edge.id}
                        className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">矢印 {index + 1}</p>
                          <button
                            type="button"
                            onClick={() => removeEdge(edge.id)}
                            className="secondary-action min-h-0 px-3 py-2 text-xs"
                          >
                            削除
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-sm text-[var(--muted)]">開始ノード</span>
                            <select
                              value={edge.from}
                              onChange={(event) => updateEdge(edge.id, { from: event.target.value })}
                              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                            >
                              <option value="">選択してください</option>
                              {nodes.map((node, nodeIndex) => (
                                <option key={node.id} value={node.id}>
                                  {`ノード ${nodeIndex + 1} ${node.move ? `(${node.move})` : ""}`}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm text-[var(--muted)]">到達ノード</span>
                            <select
                              value={edge.to}
                              onChange={(event) => updateEdge(edge.id, { to: event.target.value })}
                              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                            >
                              <option value="">選択してください</option>
                              {nodes.map((node, nodeIndex) => (
                                <option key={node.id} value={node.id}>
                                  {`ノード ${nodeIndex + 1} ${node.move ? `(${node.move})` : ""}`}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-sm text-[var(--muted)]">補足動作</span>
                            <input
                              list="combo-edge-hints"
                              value={edge.action}
                              onChange={(event) => updateEdge(edge.id, { action: event.target.value })}
                              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                              placeholder="例: 微歩き / DR / 最速"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm text-[var(--muted)]">補足メモ</span>
                            <input
                              value={edge.note}
                              onChange={(event) => updateEdge(edge.id, { note: event.target.value })}
                              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                              placeholder="例: 少し待つ / 密着限定"
                            />
                          </label>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <datalist id="combo-edge-hints">
                {COMBO_FLOW_EDGE_HINTS.map((hint) => (
                  <option key={hint} value={hint} />
                ))}
              </datalist>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="primary-action w-full disabled:opacity-60"
              >
                {isPending ? "保存中..." : "コンボフローを保存する"}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <section className="panel rounded-[30px] px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">ライブプレビュー</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  ノードはドラッグでも動かせます。細かく合わせたい時は下の移動ボタンも使えます。
                </p>
              </div>
              {selectedNode ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveSelectedNode(0, -20)}
                    className="secondary-action min-h-0 px-3 py-2 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSelectedNode(-20, 0)}
                    className="secondary-action min-h-0 px-3 py-2 text-xs"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSelectedNode(20, 0)}
                    className="secondary-action min-h-0 px-3 py-2 text-xs"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSelectedNode(0, 20)}
                    className="secondary-action min-h-0 px-3 py-2 text-xs"
                  >
                    ↓
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <ComboFlowCanvas
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNodeId}
                interactive={Boolean(session?.user)}
                onSelectNode={setSelectedNodeId}
                onMoveNode={(nodeId, nextX, nextY) => {
                  updateNode(nodeId, { x: nextX, y: nextY });
                }}
              />
            </div>
          </section>

          <section className="panel rounded-[30px] px-6 py-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">公開されているフロー</h2>
              <p className="text-sm leading-7 text-[var(--muted)]">
                このキャラの実戦ルートや分岐メモを一覧で見られます。
              </p>
            </div>

            {!supabase ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
                Supabase の設定待ちです。
              </div>
            ) : isLoading ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
                読み込み中...
              </div>
            ) : posts.length === 0 ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-[var(--muted)]">
                まだコンボフローはありません。最初の1件を作ってみましょう。
              </div>
            ) : (
              <div className="mt-5 grid gap-5">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-[28px] border border-white/10 bg-black/20 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CharacterChip name={post.character_name} />
                          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                            {post.flow_nodes.length} ノード
                          </span>
                          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-[var(--muted)]">
                            {post.flow_edges.length} 矢印
                          </span>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold text-white">{post.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                          投稿者: {post.author_name} / 投稿日: {formatPostedAt(post.created_at)}
                        </p>
                        {post.summary ? (
                          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                            {post.summary}
                          </p>
                        ) : null}
                      </div>

                      {session?.user?.id === post.user_id ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={isPending}
                          className="secondary-action min-h-0 px-4 py-2 text-sm disabled:opacity-60"
                        >
                          削除
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-5">
                      <ComboFlowCanvas nodes={post.flow_nodes} edges={post.flow_edges} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
