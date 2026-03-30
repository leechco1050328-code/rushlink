"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComboFlowEdge, ComboFlowNode } from "@/lib/combo-flow";

const NODE_WIDTH = 196;
const NODE_HEIGHT = 108;
const MIN_CANVAS_WIDTH = 1800;
const MIN_CANVAS_HEIGHT = 1100;
const HANDLE_SIZE = 18;

type ComboFlowCanvasProps = {
  nodes: ComboFlowNode[];
  edges: ComboFlowEdge[];
  selectedNodeId?: string | null;
  interactive?: boolean;
  onSelectNode?: (nodeId: string) => void;
  onMoveNode?: (nodeId: string, nextX: number, nextY: number) => void;
  onCreateEdge?: (fromNodeId: string, toNodeId: string) => void;
};

type DragNodeState = {
  id: string;
  startClientX: number;
  startClientY: number;
  startNodeX: number;
  startNodeY: number;
};

type DragEdgeState = {
  sourceId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
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

export function ComboFlowCanvas({
  nodes,
  edges,
  selectedNodeId = null,
  interactive = false,
  onSelectNode,
  onMoveNode,
  onCreateEdge,
}: ComboFlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeDragRef = useRef<DragNodeState | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [edgeDrag, setEdgeDrag] = useState<DragEdgeState | null>(null);

  const canvasSize = useMemo(() => {
    const farthestX = Math.max(0, ...nodes.map((node) => node.x + NODE_WIDTH + 180));
    const farthestY = Math.max(0, ...nodes.map((node) => node.y + NODE_HEIGHT + 220));

    return {
      width: Math.max(MIN_CANVAS_WIDTH, farthestX),
      height: Math.max(MIN_CANVAS_HEIGHT, farthestY),
    };
  }, [nodes]);

  useEffect(() => {
    if (!interactive) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      if (nodeDragRef.current && onMoveNode) {
        const deltaX = event.clientX - nodeDragRef.current.startClientX;
        const deltaY = event.clientY - nodeDragRef.current.startClientY;
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
      nodeDragRef.current = null;
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
    <div className="rounded-[28px] border border-white/10 bg-black/25">
      <div
        ref={canvasRef}
        className="relative h-[calc(100vh-260px)] min-h-[720px] overflow-auto rounded-[28px]"
      >
        <div
          className="relative"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
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
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
              >
                <path d="M0,0 L12,6 L0,12 z" fill="rgba(142, 201, 255, 0.88)" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const fromNode = nodes.find((node) => node.id === edge.from);
              const toNode = nodes.find((node) => node.id === edge.to);

              if (!fromNode || !toNode) {
                return null;
              }

              const fromX = fromNode.x + NODE_WIDTH;
              const fromY = fromNode.y + NODE_HEIGHT / 2;
              const toX = toNode.x;
              const toY = toNode.y + NODE_HEIGHT / 2;
              const curveOffset = Math.max(80, Math.abs(toX - fromX) / 2);
              const path = `M ${fromX} ${fromY} C ${fromX + curveOffset} ${fromY}, ${
                toX - curveOffset
              } ${toY}, ${toX} ${toY}`;
              const midX = (fromX + toX) / 2;
              const midY = (fromY + toY) / 2;

              return (
                <g key={edge.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(142, 201, 255, 0.72)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#combo-flow-arrow)"
                  />
                  {edge.action || edge.note ? (
                    <>
                      <rect
                        x={midX - 76}
                        y={midY - 18}
                        width="152"
                        height="36"
                        rx="18"
                        fill="rgba(8, 14, 26, 0.88)"
                        stroke="rgba(255,255,255,0.08)"
                      />
                      <text
                        x={midX}
                        y={midY + 5}
                        textAnchor="middle"
                        fill="rgba(214, 228, 255, 0.9)"
                        fontSize="12"
                      >
                        {edge.action || edge.note}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}

            {edgeDrag ? (
              <path
                d={`M ${edgeDrag.startX} ${edgeDrag.startY} C ${
                  edgeDrag.startX + 80
                } ${edgeDrag.startY}, ${edgeDrag.currentX - 80} ${edgeDrag.currentY}, ${
                  edgeDrag.currentX
                } ${edgeDrag.currentY}`}
                fill="none"
                stroke="rgba(142, 201, 255, 0.52)"
                strokeWidth="3"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
            ) : null}
          </svg>

          {nodes.map((node) => {
            const showHandles =
              interactive && (hoveredNodeId === node.id || selectedNodeId === node.id);

            return (
              <div
                key={node.id}
                className={`absolute rounded-[24px] border shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition ${
                  selectedNodeId === node.id
                    ? "border-[var(--secondary)] bg-[var(--secondary)]/14"
                    : "border-white/10 bg-black/60"
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${NODE_WIDTH}px`,
                  minHeight: `${NODE_HEIGHT}px`,
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
              >
                <button
                  type="button"
                  onClick={() => onSelectNode?.(node.id)}
                  onPointerDown={(event) => {
                    if (!interactive) {
                      return;
                    }

                    nodeDragRef.current = {
                      id: node.id,
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      startNodeX: node.x,
                      startNodeY: node.y,
                    };
                  }}
                  className={`flex h-full w-full flex-col items-start rounded-[24px] p-4 text-left ${
                    interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                  }`}
                  style={{ touchAction: "none" }}
                >
                  <span className="text-base font-semibold text-white">
                    {node.move || "技を入力"}
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/8 px-2 py-1 text-[10px] text-[var(--accent-soft)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {node.note ? (
                    <span className="mt-2 text-xs leading-5 text-[var(--muted)]">
                      {node.note}
                    </span>
                  ) : null}
                </button>

                {showHandles ? (
                  <>
                    <button
                      type="button"
                      aria-label="接続開始"
                      className="absolute rounded-full border border-[var(--secondary)] bg-[#09111f] shadow-[0_0_0_4px_rgba(142,201,255,0.12)]"
                      style={{
                        left: `${-HANDLE_SIZE / 2}px`,
                        top: `${NODE_HEIGHT / 2 - HANDLE_SIZE / 2}px`,
                        width: `${HANDLE_SIZE}px`,
                        height: `${HANDLE_SIZE}px`,
                      }}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        if (!edgeDrag || !onCreateEdge || edgeDrag.sourceId === node.id) {
                          return;
                        }
                        onCreateEdge(edgeDrag.sourceId, node.id);
                        setEdgeDrag(null);
                      }}
                    />
                    <button
                      type="button"
                      aria-label="接続端子"
                      className="absolute rounded-full border border-[var(--secondary)] bg-[#09111f] shadow-[0_0_0_4px_rgba(142,201,255,0.12)]"
                      style={{
                        right: `${-HANDLE_SIZE / 2}px`,
                        top: `${NODE_HEIGHT / 2 - HANDLE_SIZE / 2}px`,
                        width: `${HANDLE_SIZE}px`,
                        height: `${HANDLE_SIZE}px`,
                      }}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        if (!interactive) {
                          return;
                        }

                        const point = getCanvasPoint(canvasRef.current, event.clientX, event.clientY);
                        setEdgeDrag({
                          sourceId: node.id,
                          startX: node.x + NODE_WIDTH,
                          startY: node.y + NODE_HEIGHT / 2,
                          currentX: point.x,
                          currentY: point.y,
                        });
                      }}
                    />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
