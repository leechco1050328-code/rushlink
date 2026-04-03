"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  type ComboFlowNodeHandleSide,
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

type ComboFlowDraft = {
  characterName: ComboFlowCharacter | "";
  summary: string;
  nodes: ComboFlowNode[];
  edges: ComboFlowEdge[];
};

const CREATE_DRAFT_STORAGE_KEY = "rushlink-combo-flow-create-draft";

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

function readCreateDraft(): ComboFlowDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CREATE_DRAFT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ComboFlowDraft>;

    return {
      characterName:
        parsed.characterName && COMBO_FLOW_CHARACTERS.includes(parsed.characterName)
          ? parsed.characterName
          : "",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      nodes:
        Array.isArray(parsed.nodes) && parsed.nodes.length > 0
          ? (parsed.nodes as ComboFlowNode[])
          : createInitialNodes(),
      edges: Array.isArray(parsed.edges) ? (parsed.edges as ComboFlowEdge[]) : [],
    };
  } catch {
    return null;
  }
}

function writeCreateDraft(draft: ComboFlowDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CREATE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function clearCreateDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CREATE_DRAFT_STORAGE_KEY);
}

export function ComboFlowEditor(props: ComboFlowEditorProps) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const bottomAdSlot = getAdSenseMidSlot();
  const editPostId = props.mode === "edit" ? props.postId : null;
  const [session, setSession] = useState<Session | null>(null);
  const [post, setPost] = useState<ComboFlowPost | null>(null);
  const [isOwner, setIsOwner] = useState(props.mode === "create");
  const [characterName, setCharacterName] = useState<ComboFlowCharacter | "">("");
  const [summary, setSummary] = useState("");
  const [nodes, setNodes] = useState<ComboFlowNode[]>(createInitialNodes());
  const [edges, setEdges] = useState<ComboFlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [draftReady, setDraftReady] = useState(false);
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

        const draft = readCreateDraft();

        if (draft) {
          setCharacterName(draft.characterName);
          setSummary(draft.summary);
          setNodes(draft.nodes);
          setEdges(draft.edges);
          setMessage(
            activeSession?.user
              ? "前回の下書きを復元しました。保存すると公開されます。"
              : "前回の下書きを復元しました。公開保存するにはログインしてください。",
          );
        } else {
          setMessage(
            activeSession?.user
              ? "コンボフローを作成して保存できます。"
              : "まずは下書きを作れます。公開保存するにはログインしてください。",
          );
        }

        setDraftReady(true);
        return;
      }

      const { data, error } = await client
        .from("combo_flow_posts")
        .select(
          "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at, updated_at",
        )
        .eq("id", editPostId ?? 0)
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
      const ownsPost = activeSession?.user?.id === nextPost.user_id;

      setPost(nextPost);
      setCharacterName(
        COMBO_FLOW_CHARACTERS.includes(nextPost.character_name as ComboFlowCharacter)
          ? (nextPost.character_name as ComboFlowCharacter)
          : "",
      );
      setSummary(nextPost.summary ?? "");
      setNodes(Array.isArray(nextPost.flow_nodes) ? nextPost.flow_nodes : createInitialNodes());
      setEdges(Array.isArray(nextPost.flow_edges) ? nextPost.flow_edges : []);
      setIsOwner(Boolean(ownsPost));
      setMessage(
        ownsPost
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
  }, [editPostId, props.mode, supabase]);

  useEffect(() => {
    if (props.mode !== "create" || !draftReady) {
      return;
    }

    writeCreateDraft({
      characterName,
      summary,
      nodes,
      edges,
    });
  }, [characterName, draftReady, edges, nodes, props.mode, summary]);

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
    setMessage("ノードを追加しました。");
  }

  function addEdge(
    fromNodeId: string,
    toNodeId: string,
    fromSide: ComboFlowNodeHandleSide,
    toSide: ComboFlowNodeHandleSide,
  ) {
    if (!isOwner) {
      return;
    }

    const exists = edges.some(
      (edge) =>
        edge.from === fromNodeId &&
        edge.to === toNodeId &&
        (edge.fromSide ?? "right") === fromSide &&
        (edge.toSide ?? "left") === toSide,
    );

    if (exists) {
      setMessage("同じ接続はすでに追加されています。");
      return;
    }

    setEdges((current) => [
      ...current,
      {
        id: `edge-${Date.now()}-${current.length}`,
        from: fromNodeId,
        to: toNodeId,
        fromSide,
        toSide,
        action: "",
        note: "",
      },
    ]);
    setMessage("接続を追加しました。");
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
      setMessage("最低2つのノードを入れてください。");
      return;
    }

    const nodeIds = new Set(nextNodes.map((node) => node.id));
    const nextEdges = normalizeEdges(edges, nodeIds);

    if (nextEdges.length === 0) {
      setMessage("接続を1本以上つないでください。");
      return;
    }

    startTransition(async () => {
      try {
        const displayName = String(session.user.user_metadata.display_name ?? "").trim();
        const authorName =
          displayName || (session.user.email ?? "").split("@")[0] || "プレイヤー";
        const resolvedTitle = buildComboFlowTitle(nextNodes);

        if (props.mode === "create") {
          const { data, error } = await supabase
            .from("combo_flow_posts")
            .insert({
              user_id: session.user.id,
              author_name: authorName,
              character_name: characterName,
              title: resolvedTitle,
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

          clearCreateDraft();
          router.push(getComboFlowDetailHref((data as ComboFlowPost).id));
          router.refresh();
          return;
        }

        const { data, error } = await supabase
          .from("combo_flow_posts")
          .update({
            character_name: characterName,
            title: resolvedTitle,
            summary: summary.trim(),
            flow_nodes: nextNodes,
            flow_edges: nextEdges,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editPostId ?? 0)
          .select(
            "id, user_id, author_name, character_name, title, summary, flow_nodes, flow_edges, created_at, updated_at",
          )
          .single();

        if (error) {
          throw error;
        }

        setPost(data as ComboFlowPost);
        setMessage("コンボフローを保存しました。");
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
          <div className="min-w-[18rem] flex-1 space-y-3">
            <Link
              href="/combo-flow"
              className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
            >
              コンボフロー管理へ戻る
            </Link>

            {session?.user ? (
              <div className="max-w-[18rem]">
                <label className="sr-only" htmlFor="combo-flow-character">
                  キャラクター
                </label>
                <select
                  id="combo-flow-character"
                  value={characterName}
                  onChange={(event) => setCharacterName(event.target.value as ComboFlowCharacter)}
                  disabled={!isOwner}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
                >
                  <option value="">キャラクターを選択</option>
                  {COMBO_FLOW_CHARACTERS.map((character) => (
                    <option key={character} value={character}>
                      {character}
                    </option>
                  ))}
                </select>
              </div>
            ) : characterName ? (
              <CharacterChip name={characterName} size="md" tone="accent" />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {characterName ? <CharacterChip name={characterName} size="md" tone="accent" /> : null}
            {isOwner && session?.user ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="primary-action min-w-[11rem] disabled:opacity-60"
              >
                {isPending ? "保存中..." : props.mode === "create" ? "保存する" : "更新する"}
              </button>
            ) : null}
            {post ? <SharePostActions title={post.title} path={getComboFlowDetailHref(post.id)} /> : null}
          </div>
        </header>

        {message ? (
          <section className="panel rounded-[22px] px-5 py-3 text-sm leading-7 text-[var(--muted)]">
            {message}
          </section>
        ) : null}

        {!session?.user ? (
          <section className="panel rounded-[26px] px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm leading-7 text-[var(--muted)]">
                コンボフローの保存と編集にはログインが必要です。今の内容はこのブラウザに下書き保存されます。
              </p>
              <Link href="/auth?mode=sign-in" className="primary-action">
                ログインする
              </Link>
            </div>
          </section>
        ) : null}

        <section className="relative rounded-[26px] border border-white/10 bg-black/15 p-1">
          {session?.user && isOwner ? (
            <div className="pointer-events-none absolute left-5 top-5 z-20">
              <button
                type="button"
                onClick={addNode}
                className="secondary-action pointer-events-auto min-h-0 px-4 py-3 text-sm"
              >
                ノードを追加
              </button>
            </div>
          ) : null}

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

        {bottomAdSlot ? (
          <section>
            <AdSenseSlot slot={bottomAdSlot} label="Advertisement" />
          </section>
        ) : null}
      </section>
    </main>
  );
}
