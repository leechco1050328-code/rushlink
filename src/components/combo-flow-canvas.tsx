"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMBO_FLOW_EDGE_HINTS,
  COMBO_FLOW_HANDLE_SIDES,
  COMBO_FLOW_MOVE_GROUPS,
  COMBO_FLOW_NODE_TAGS,
  getComboFlowMoveGroupLabel,
  type ComboFlowEdge,
  type ComboFlowNode,
  type ComboFlowNodeHandleSide,
  type ComboFlowNodeTag,
} from "@/lib/combo-flow";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 108;
const MIN_CANVAS_WIDTH = 2200;
const MIN_CANVAS_HEIGHT = 1200;
const HANDLE_SIZE = 20;
const EDGE_LABEL_WIDTH = 124;
const EDGE_LABEL_HEIGHT = 28;

type ComboFlowCanvasProps = {
  nodes: ComboFlowNode[];
  edges: ComboFlowEdge[];
  selectedNodeId?: string | null;
  interactive?: boolean;
  onSelectNode?: (nodeId: string | null) => void;
  onMoveNode?: (nodeId: string, nextX: number, nextY: number) => void;
  onCreateEdge?: (
    fromNodeId: string,
    toNodeId: string,
    fromSide: ComboFlowNodeHandleSide,
    toSide: ComboFlowNodeHandleSide,
  ) => void;
  onUpdateNode?: (nodeId: string, patch: Partial<ComboFlowNode>) => void;
  onToggleNodeTag?: (nodeId: string, tag: ComboFlowNodeTag) => void;
  onDeleteNode?: (nodeId: string) => void;
  onUpdateEdge?: (edgeId: string, patch: Partial<ComboFlowEdge>) => void;
  onDeleteEdge?: (edgeId: string) => void;
};

type DragNodeState = {
  id: string;
  startClientX: number;
  startClientY: number;
  startNodeX: number;
  startNodeY: number;
  moved: boolean;
};

type DragEdgeState = {
  sourceId: string;
  sourceSide: ComboFlowNodeHandleSide;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

type PanCanvasState = {
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
};

type EdgeLayout = {
  edge: ComboFlowEdge;
  fromSide: ComboFlowNodeHandleSide;
  toSide: ComboFlowNodeHandleSide;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  midX: number;
  midY: number;
  path: string;
};

function clampPosition(value: number, max: number) {
  return Math.max(0, Math.min(value, max));
}

function getCanvasPoint(canvas: HTMLDivElement | null, clientX: number, clientY: number) {
  if (!canvas) {
    return { x: 0, y: 0 };
  }

  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left + canvas.scrollLeft,
    y: clientY - rect.top + canvas.scrollTop,
  };
}

function getNodePanelPlacement(nodeX: number, canvasWidth: number) {
  if (nodeX > canvasWidth - 460) {
    return "right-[calc(100%+12px)]";
  }

  return "left-[calc(100%+12px)]";
}

function getEdgePanelPosition(value: number, max: number) {
  return clampPosition(value, Math.max(0, max));
}

function getSideVector(side: ComboFlowNodeHandleSide) {
  switch (side) {
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
    case "top":
      return { x: 0, y: -1 };
    case "bottom":
      return { x: 0, y: 1 };
  }
}

function getNodeHandlePoint(node: ComboFlowNode, side: ComboFlowNodeHandleSide) {
  switch (side) {
    case "left":
      return { x: node.x, y: node.y + NODE_HEIGHT / 2 };
    case "right":
      return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
    case "top":
      return { x: node.x + NODE_WIDTH / 2, y: node.y };
    case "bottom":
      return { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT };
  }
}

function getHandleStyle(side: ComboFlowNodeHandleSide) {
  switch (side) {
    case "left":
      return {
        left: `${-HANDLE_SIZE / 2}px`,
        top: `${NODE_HEIGHT / 2 - HANDLE_SIZE / 2}px`,
      };
    case "right":
      return {
        right: `${-HANDLE_SIZE / 2}px`,
        top: `${NODE_HEIGHT / 2 - HANDLE_SIZE / 2}px`,
      };
    case "top":
      return {
        left: `${NODE_WIDTH / 2 - HANDLE_SIZE / 2}px`,
        top: `${-HANDLE_SIZE / 2}px`,
      };
    case "bottom":
      return {
        left: `${NODE_WIDTH / 2 - HANDLE_SIZE / 2}px`,
        bottom: `${-HANDLE_SIZE / 2}px`,
      };
  }
}

function getCurvePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  fromSide: ComboFlowNodeHandleSide,
  toSide: ComboFlowNodeHandleSide,
) {
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const controlDistance = Math.max(42, Math.min(160, distance / 2.4));
  const fromVector = getSideVector(fromSide);
  const toVector = getSideVector(toSide);
  const control1X = fromX + fromVector.x * controlDistance;
  const control1Y = fromY + fromVector.y * controlDistance;
  const control2X = toX + toVector.x * controlDistance;
  const control2Y = toY + toVector.y * controlDistance;

  return `M ${fromX} ${fromY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${toX} ${toY}`;
}

function getNearestHandleSide(node: ComboFlowNode, pointX: number, pointY: number) {
  let closestSide: ComboFlowNodeHandleSide = "left";
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const side of COMBO_FLOW_HANDLE_SIDES) {
    const handlePoint = getNodeHandlePoint(node, side);
    const distance = Math.hypot(pointX - handlePoint.x, pointY - handlePoint.y);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSide = side;
    }
  }

  return closestSide;
}

function getMoveOptions(move: string) {
  const groupLabel = getComboFlowMoveGroupLabel(move);
  const group = COMBO_FLOW_MOVE_GROUPS.find((item) => item.label === groupLabel);

  if (!group) {
    return move ? [move] : [];
  }

  if (move && !group.options.some((option) => option === move)) {
    return [move, ...group.options];
  }

  return [...group.options];
}

export function ComboFlowCanvas({
  nodes,
  edges,
  selectedNodeId = null,
  interactive = false,
  onSelectNode,
  onMoveNode,
  onCreateEdge,
  onUpdateNode,
  onToggleNodeTag,
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
}: ComboFlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeDragRef = useRef<DragNodeState | null>(null);
  const panCanvasRef = useRef<PanCanvasState | null>(null);
  const suppressClickNodeIdRef = useRef<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [activeNodeEditorId, setActiveNodeEditorId] = useState<string | null>(null);
  const [edgeDrag, setEdgeDrag] = useState<DragEdgeState | null>(null);

  const canvasSize = useMemo(() => {
    const farthestX = Math.max(0, ...nodes.map((node) => node.x + NODE_WIDTH + 240));
    const farthestY = Math.max(0, ...nodes.map((node) => node.y + NODE_HEIGHT + 260));

    return {
      width: Math.max(MIN_CANVAS_WIDTH, farthestX),
      height: Math.max(MIN_CANVAS_HEIGHT, farthestY),
    };
  }, [nodes]);

  const edgeLayouts = useMemo(() => {
    return edges
      .map((edge) => {
        const fromNode = nodes.find((node) => node.id === edge.from);
        const toNode = nodes.find((node) => node.id === edge.to);

        if (!fromNode || !toNode) {
          return null;
        }

        const fromSide = edge.fromSide ?? "right";
        const toSide = edge.toSide ?? "left";
        const fromPoint = getNodeHandlePoint(fromNode, fromSide);
        const toPoint = getNodeHandlePoint(toNode, toSide);

        return {
          edge,
          fromSide,
          toSide,
          fromX: fromPoint.x,
          fromY: fromPoint.y,
          toX: toPoint.x,
          toY: toPoint.y,
          midX: (fromPoint.x + toPoint.x) / 2,
          midY: (fromPoint.y + toPoint.y) / 2,
          path: getCurvePath(
            fromPoint.x,
            fromPoint.y,
            toPoint.x,
            toPoint.y,
            fromSide,
            toSide,
          ),
        } satisfies EdgeLayout;
      })
      .filter((value): value is EdgeLayout => Boolean(value));
  }, [edges, nodes]);

  useEffect(() => {
    if (!interactive) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      if (nodeDragRef.current && onMoveNode) {
        const deltaX = event.clientX - nodeDragRef.current.startClientX;
        const deltaY = event.clientY - nodeDragRef.current.startClientY;

        if (!nodeDragRef.current.moved) {
          if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) {
            return;
          }

          nodeDragRef.current.moved = true;
        }

        const nextX = clampPosition(
          nodeDragRef.current.startNodeX + deltaX,
          canvasSize.width - NODE_WIDTH,
        );
        const nextY = clampPosition(
          nodeDragRef.current.startNodeY + deltaY,
          canvasSize.height - NODE_HEIGHT,
        );

        onMoveNode(nodeDragRef.current.id, nextX, nextY);
        return;
      }

      if (panCanvasRef.current && canvasRef.current) {
        const deltaX = event.clientX - panCanvasRef.current.startClientX;
        const deltaY = event.clientY - panCanvasRef.current.startClientY;

        canvasRef.current.scrollLeft = panCanvasRef.current.startScrollLeft - deltaX;
        canvasRef.current.scrollTop = panCanvasRef.current.startScrollTop - deltaY;
        return;
      }

      if (edgeDrag) {
        const point = getCanvasPoint(canvasRef.current, event.clientX, event.clientY);
        setEdgeDrag((current) =>
          current
            ? {
                ...current,
                currentX: point.x,
                currentY: point.y,
              }
            : current,
        );
      }
    }

    function handlePointerUp() {
      if (nodeDragRef.current?.moved) {
        suppressClickNodeIdRef.current = nodeDragRef.current.id;
      }

      nodeDragRef.current = null;
      panCanvasRef.current = null;
      setEdgeDrag(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [canvasSize.height, canvasSize.width, edgeDrag, interactive, onMoveNode]);

  return (
    <div className="rounded-[26px] border border-white/10 bg-black/20">
      <div
        ref={canvasRef}
        className="relative h-[calc(100vh-210px)] min-h-[760px] overflow-auto rounded-[26px]"
        onPointerDown={(event) => {
          if (!interactive || event.button !== 1 || !canvasRef.current) {
            return;
          }

          event.preventDefault();
          panCanvasRef.current = {
            startClientX: event.clientX,
            startClientY: event.clientY,
            startScrollLeft: canvasRef.current.scrollLeft,
            startScrollTop: canvasRef.current.scrollTop,
          };
        }}
      >
        <div
          className="relative"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
          }}
          onClick={() => {
            onSelectNode?.(null);
            setActiveEdgeId(null);
            setActiveNodeEditorId(null);
          }}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <svg
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <marker
                id="combo-flow-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 z" fill="rgba(142, 201, 255, 0.88)" />
              </marker>
            </defs>

            {edgeLayouts.map(({ edge, midX, midY, path }) => (
              <g
                key={edge.id}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId((current) => (current === edge.id ? null : current))}
              >
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveEdgeId(edge.id);
                  }}
                />
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(142, 201, 255, 0.72)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  markerEnd="url(#combo-flow-arrow)"
                />
                {edge.action || edge.note ? (
                  <g
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveEdgeId(edge.id);
                    }}
                  >
                    <rect
                      x={midX - EDGE_LABEL_WIDTH / 2}
                      y={midY - EDGE_LABEL_HEIGHT / 2}
                      width={EDGE_LABEL_WIDTH}
                      height={EDGE_LABEL_HEIGHT}
                      rx="14"
                      fill="rgba(8, 14, 26, 0.88)"
                      stroke="rgba(255,255,255,0.08)"
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fill="rgba(214, 228, 255, 0.9)"
                      fontSize="11"
                    >
                      {edge.action || edge.note}
                    </text>
                  </g>
                ) : null}
              </g>
            ))}

            {edgeDrag ? (
              <path
                d={getCurvePath(
                  edgeDrag.startX,
                  edgeDrag.startY,
                  edgeDrag.currentX,
                  edgeDrag.currentY,
                  edgeDrag.sourceSide,
                  "left",
                )}
                fill="none"
                stroke="rgba(142, 201, 255, 0.52)"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
            ) : null}
          </svg>

          {edgeLayouts.map(({ edge, midX, midY }) => {
            const showEdgeEditor =
              interactive && (hoveredEdgeId === edge.id || activeEdgeId === edge.id);

            if (!showEdgeEditor) {
              return null;
            }

            return (
              <div
                key={`${edge.id}-panel`}
                className="absolute z-30 w-64 rounded-[20px] border border-white/10 bg-[#0a1324]/96 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.34)]"
                style={{
                  left: `${getEdgePanelPosition(midX + 16, canvasSize.width - 256)}px`,
                  top: `${getEdgePanelPosition(midY + 18, canvasSize.height - 164)}px`,
                }}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId((current) => (current === edge.id ? null : current))}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-soft)]">
                    EDGE
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEdge?.(edge.id);
                      setActiveEdgeId(null);
                      setHoveredEdgeId(null);
                    }}
                    className="secondary-action min-h-0 px-3 py-1.5 text-[11px]"
                  >
                    削除
                  </button>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs text-[var(--muted)]">補足動作</span>
                  <input
                    list="combo-edge-hints-canvas"
                    value={edge.action}
                    onChange={(event) => onUpdateEdge?.(edge.id, { action: event.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35"
                    placeholder="例: 微歩き / DR / 最速"
                  />
                </label>

                <label className="mt-3 block">
                  <span className="mb-1.5 block text-xs text-[var(--muted)]">メモ</span>
                  <input
                    value={edge.note}
                    onChange={(event) => onUpdateEdge?.(edge.id, { note: event.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35"
                    placeholder="例: 少し待つ / 最速入力"
                  />
                </label>
              </div>
            );
          })}

          {nodes.map((node) => {
            const showHandles =
              interactive &&
              (hoveredNodeId === node.id ||
                selectedNodeId === node.id ||
                (edgeDrag !== null && edgeDrag.sourceId !== node.id));
            const showNodeToolbar =
              interactive && (hoveredNodeId === node.id || activeNodeEditorId === node.id);
            const showNodeEditor = interactive && activeNodeEditorId === node.id;
            const moveGroupLabel = getComboFlowMoveGroupLabel(node.move);
            const moveOptions = getMoveOptions(node.move);
            const isEdgeTarget =
              interactive && edgeDrag !== null && edgeDrag.sourceId !== node.id;

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${NODE_WIDTH}px`,
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
              >
                <div
                  className={`relative overflow-hidden rounded-[20px] border shadow-[0_16px_34px_rgba(0,0,0,0.28)] transition ${
                    selectedNodeId === node.id
                      ? "border-[var(--secondary)] bg-[var(--secondary)]/14"
                      : isEdgeTarget
                        ? "border-[var(--accent-soft)] bg-white/5"
                        : "border-white/10 bg-black/70"
                  }`}
                  style={{
                    height: `${NODE_HEIGHT}px`,
                  }}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (suppressClickNodeIdRef.current === node.id) {
                        suppressClickNodeIdRef.current = null;
                        return;
                      }

                      onSelectNode?.(node.id);
                      setActiveEdgeId(null);
                    }}
                    onPointerUp={(event) => {
                      if (!edgeDrag || edgeDrag.sourceId === node.id || !onCreateEdge) {
                        return;
                      }

                      event.stopPropagation();
                      const point = getCanvasPoint(canvasRef.current, event.clientX, event.clientY);
                      const targetSide = getNearestHandleSide(node, point.x, point.y);
                      onCreateEdge(edgeDrag.sourceId, node.id, edgeDrag.sourceSide, targetSide);
                      setEdgeDrag(null);
                    }}
                    onPointerDown={(event) => {
                      if (!interactive || event.button !== 0) {
                        return;
                      }

                      event.preventDefault();
                      nodeDragRef.current = {
                        id: node.id,
                        startClientX: event.clientX,
                        startClientY: event.clientY,
                        startNodeX: node.x,
                        startNodeY: node.y,
                        moved: false,
                      };
                    }}
                    className={`absolute inset-0 flex h-full w-full flex-col items-start rounded-[20px] px-3 py-3 text-left ${
                      interactive ? "cursor-grab select-none active:cursor-grabbing" : "cursor-default"
                    }`}
                    style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                  >
                    <span className="line-clamp-2 text-xl font-bold leading-[1.08] tracking-[0.01em] text-white">
                      {node.move || "弱P"}
                    </span>
                    {node.tags.length ? (
                      <div className="mt-2 flex max-h-10 flex-wrap gap-1 overflow-hidden">
                        {node.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/8 bg-white/6 px-2.5 py-1 text-[10px] leading-none text-[var(--accent-soft)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {node.note ? (
                      <span className="mt-2 line-clamp-1 text-[10px] leading-4 text-white/40">
                        {node.note}
                      </span>
                    ) : null}
                  </button>

                  {showNodeToolbar ? (
                    <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveNodeEditorId((current) => (current === node.id ? null : node.id));
                          onSelectNode?.(node.id);
                        }}
                        className="rounded-full border border-white/10 bg-[#0a1324]/90 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-soft)]"
                      >
                        編集
                      </button>
                      {nodes.length > 2 ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteNode?.(node.id);
                            setActiveNodeEditorId((current) => (current === node.id ? null : current));
                            onSelectNode?.(null);
                          }}
                          className="rounded-full border border-white/10 bg-[#0a1324]/90 px-2.5 py-1 text-[10px] font-semibold text-white/80"
                        >
                          削除
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {showHandles ? (
                    <>
                      {COMBO_FLOW_HANDLE_SIDES.map((side) => {
                        const handlePoint = getNodeHandlePoint(node, side);

                        return (
                          <button
                            key={`${node.id}-${side}`}
                            type="button"
                            aria-label={`接続端子 ${side}`}
                            className="absolute z-10 rounded-full border border-[var(--secondary)] bg-[#09111f] shadow-[0_0_0_4px_rgba(142,201,255,0.14)]"
                            style={{
                              ...getHandleStyle(side),
                              width: `${HANDLE_SIZE}px`,
                              height: `${HANDLE_SIZE}px`,
                            }}
                            onPointerDown={(event) => {
                              event.stopPropagation();
                              if (!interactive || event.button !== 0) {
                                return;
                              }

                              const point = getCanvasPoint(
                                canvasRef.current,
                                event.clientX,
                                event.clientY,
                              );
                              setEdgeDrag({
                                sourceId: node.id,
                                sourceSide: side,
                                startX: handlePoint.x,
                                startY: handlePoint.y,
                                currentX: point.x,
                                currentY: point.y,
                              });
                            }}
                            onPointerUp={(event) => {
                              if (!edgeDrag || edgeDrag.sourceId === node.id || !onCreateEdge) {
                                return;
                              }

                              event.stopPropagation();
                              onCreateEdge(edgeDrag.sourceId, node.id, edgeDrag.sourceSide, side);
                              setEdgeDrag(null);
                            }}
                          />
                        );
                      })}
                    </>
                  ) : null}
                </div>

                {showNodeEditor ? (
                  <div
                    className={`absolute top-0 z-30 w-72 rounded-[22px] border border-white/10 bg-[#0a1324]/96 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.34)] ${getNodePanelPlacement(node.x, canvasSize.width)}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-soft)]">
                        NODE
                      </span>
                      {nodes.length > 2 ? (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteNode?.(node.id);
                            onSelectNode?.(null);
                          }}
                          className="secondary-action min-h-0 px-3 py-1.5 text-[11px]"
                        >
                          削除
                        </button>
                      ) : null}
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-xs text-[var(--muted)]">カテゴリ</span>
                      <select
                        value={moveGroupLabel}
                        onChange={(event) => {
                          const nextGroup = COMBO_FLOW_MOVE_GROUPS.find(
                            (item) => item.label === event.target.value,
                          );
                          onUpdateNode?.(node.id, {
                            move: nextGroup?.options[0] ?? "",
                          });
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="">選択してください</option>
                        {COMBO_FLOW_MOVE_GROUPS.map((group) => (
                          <option key={group.label} value={group.label}>
                            {group.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-xs text-[var(--muted)]">
                        技コマンド / 技強度
                      </span>
                      <select
                        value={node.move}
                        onChange={(event) => onUpdateNode?.(node.id, { move: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="">選択してください</option>
                        {moveOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="mt-3">
                      <span className="mb-1.5 block text-xs text-[var(--muted)]">ラベル</span>
                      <div className="flex flex-wrap gap-2">
                        {COMBO_FLOW_NODE_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => onToggleNodeTag?.(node.id, tag)}
                            className={`pill-button min-h-0 px-3 py-2 text-[11px] ${
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

                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-xs text-[var(--muted)]">メモ</span>
                      <input
                        value={node.note}
                        onChange={(event) => onUpdateNode?.(node.id, { note: event.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35"
                        placeholder="例: 密着限定 / 端限定"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}

          <datalist id="combo-edge-hints-canvas">
            {COMBO_FLOW_EDGE_HINTS.map((hint) => (
              <option key={hint} value={hint} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
