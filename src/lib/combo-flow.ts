export const COMBO_FLOW_CHARACTERS = [
  "リュウ",
  "ルーク",
  "ジェイミー",
  "春麗",
  "ガイル",
  "キンバリー",
  "ジュリ",
  "ケン",
  "ブランカ",
  "ダルシム",
  "E.本田",
  "ディージェイ",
  "マノン",
  "マリーザ",
  "JP",
  "ザンギエフ",
  "リリー",
  "キャミィ",
  "ラシード",
  "A.K.I.",
  "エド",
  "豪鬼",
  "ベガ",
  "テリー",
  "舞",
] as const;

export type ComboFlowCharacter = (typeof COMBO_FLOW_CHARACTERS)[number];

export const COMBO_FLOW_NODE_TAGS = [
  "通常ヒット",
  "カウンター",
  "パニカン",
  "端",
  "中央",
  "始動",
  "締め",
] as const;

export const COMBO_FLOW_EDGE_HINTS = [
  "微歩き",
  "最速",
  "ディレイ",
  "DR",
  "キャンセル",
  "リンク",
  "端限定",
] as const;

export type ComboFlowNodeTag = (typeof COMBO_FLOW_NODE_TAGS)[number];

export type ComboFlowNode = {
  id: string;
  move: string;
  tags: ComboFlowNodeTag[];
  note: string;
  x: number;
  y: number;
};

export type ComboFlowEdge = {
  id: string;
  from: string;
  to: string;
  action: string;
  note: string;
};

export type ComboFlowPost = {
  id: number;
  user_id: string;
  author_name: string;
  character_name: string;
  title: string;
  summary: string;
  flow_nodes: ComboFlowNode[];
  flow_edges: ComboFlowEdge[];
  created_at: string;
  updated_at?: string;
};

export function isComboFlowCharacter(value: string): value is ComboFlowCharacter {
  return COMBO_FLOW_CHARACTERS.includes(value as ComboFlowCharacter);
}

export function getComboFlowDetailHref(id: number) {
  return `/combo-flow/${id}`;
}

export function buildComboFlowTitle(nodes: ComboFlowNode[]) {
  const moves = nodes
    .filter((node) => node.move.trim())
    .slice(0, 3)
    .map((node) => node.move.trim());

  if (moves.length === 0) {
    return "コンボフロー";
  }

  return moves.join(" > ");
}

export function createEmptyComboNode(index: number): ComboFlowNode {
  return {
    id: `node-${Date.now()}-${index}`,
    move: "",
    tags: index === 0 ? ["始動"] : [],
    note: "",
    x: 80 + index * 220,
    y: 80,
  };
}

export function createEmptyComboEdge(index: number, from = "", to = ""): ComboFlowEdge {
  return {
    id: `edge-${Date.now()}-${index}`,
    from,
    to,
    action: "",
    note: "",
  };
}
