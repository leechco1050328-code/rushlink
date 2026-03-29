"use client";

import { useEffect, useRef } from "react";
import type { ComboFlowEdge, ComboFlowNode } from "@/lib/combo-flow";

const NODE_WIDTH = 184;
const NODE_HEIGHT = 92;
const CANVAS_WIDTH = 1040;
const CANVAS_HEIGHT = 560;

type ComboFlowCanvasProps = {
  nodes: ComboFlowNode[];
  edges: ComboFlowEdge[];
  selectedNodeId?: string | null;
  interactive?: boolean;
  onSelectNode?: (nodeId: string) => void;
  onMoveNode?: (nodeId: string, nextX: number, nextY: number) => void;
};

function clampPosition(value: number, max: number) {
  return Math.max(0, Math.min(value, max));
}

export function ComboFlowCanvas({
  nodes,
  edges,
  selectedNodeId = null,
  interactive = false,
  onSelectNode,
  onMoveNode,
}: ComboFlowCanvasProps) {
  const dragRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startNodeX: number;
    startNodeY: number;
  } | null>(null);

  useEffect(() => {
    if (!interactive || !onMoveNode) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragRef.current || !onMoveNode) {
        return;
      }

      const deltaX = event.clientX - dragRef.current.startClientX;
      const deltaY = event.clientY - dragRef.current.startClientY;
      const nextX = clampPosition(
        dragRef.current.startNodeX + deltaX,
        CANVAS_WIDTH - NODE_WIDTH,
      );
      const nextY = clampPosition(
        dragRef.current.startNodeY + deltaY,
        CANVAS_HEIGHT - NODE_HEIGHT,
      );

      onMoveNode(dragRef.current.id, nextX, nextY);
    }

    function handlePointerUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [interactive, onMoveNode]);

  return (
    <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-black/20 p-4">
      <div
        className="relative rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
        style={{
          width: `${CANVAS_WIDTH}px`,
          minHeight: `${CANVAS_HEIGHT}px`,
        }}
      >
        <svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
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

            const fromX = fromNode.x + NODE_WIDTH / 2;
            const fromY = fromNode.y + NODE_HEIGHT / 2;
            const toX = toNode.x + NODE_WIDTH / 2;
            const toY = toNode.y + NODE_HEIGHT / 2;
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;

            return (
              <g key={edge.id}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke="rgba(142, 201, 255, 0.72)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  markerEnd="url(#combo-flow-arrow)"
                />
                {edge.action || edge.note ? (
                  <>
                    <rect
                      x={midX - 64}
                      y={midY - 18}
                      width="128"
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
        </svg>

        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelectNode?.(node.id)}
            onPointerDown={(event) => {
              if (!interactive) {
                return;
              }

              dragRef.current = {
                id: node.id,
                startClientX: event.clientX,
                startClientY: event.clientY,
                startNodeX: node.x,
                startNodeY: node.y,
              };
            }}
            className={`absolute flex flex-col items-start rounded-[22px] border p-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition ${
              selectedNodeId === node.id
                ? "border-[var(--secondary)] bg-[var(--secondary)]/14"
                : "border-white/10 bg-black/55"
            } ${interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: `${NODE_WIDTH}px`,
              minHeight: `${NODE_HEIGHT}px`,
              touchAction: "none",
            }}
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
        ))}
      </div>
    </div>
  );
}

export const comboFlowCanvasMetrics = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  nodeWidth: NODE_WIDTH,
  nodeHeight: NODE_HEIGHT,
};
