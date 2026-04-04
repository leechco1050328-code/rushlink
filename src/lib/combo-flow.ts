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

export const COMBO_FLOW_CONTROL_SCHEMES = ["classic", "modern"] as const;
export type ComboFlowControlScheme = (typeof COMBO_FLOW_CONTROL_SCHEMES)[number];

export const COMBO_FLOW_NODE_TAGS = [
  "通常ヒット",
  "カウンター",
  "パニカン",
  "キャンセルラッシュ",
  "端",
  "中央",
  "始動",
  "タゲコン",
  "フレーム消費",
  "気絶やられ",
] as const;

export const COMBO_FLOW_EDGE_HINTS = [
  "微歩き",
  "最速",
  "ディレイ",
  "DR",
  "キャンセル",
  "リンク",
  "溜め",
];

type ComboFlowMoveGroupDefinition = {
  label: string;
  options: string[];
};

const CLASSIC_MOVE_GROUPS: ComboFlowMoveGroupDefinition[] = [
  {
    label: "通常技",
    options: [
      "弱P",
      "中P",
      "大P",
      "弱K",
      "中K",
      "大K",
      "しゃがみ弱P",
      "しゃがみ中P",
      "しゃがみ大P",
      "しゃがみ弱K",
      "しゃがみ中K",
      "しゃがみ大K",
      "ジャンプ弱P",
      "ジャンプ中P",
      "ジャンプ大P",
      "ジャンプ弱K",
      "ジャンプ中K",
      "ジャンプ大K",
    ],
  },
  {
    label: "特殊技",
    options: ["引き大P", "前大P", "溜め大P", "前中K", "前大K"],
  },
  {
    label: "コマンド技",
    options: [
      "↓↘→+弱P",
      "↓↘→+中P",
      "↓↘→+大P",
      "↓↘→+弱K",
      "↓↘→+中K",
      "↓↘→+大K",
      "←溜め→+弱P",
      "←溜め→+中P",
      "←溜め→+大P",
      "←溜め→+弱K",
      "←溜め→+中K",
      "←溜め→+大K",
      "↓溜め↑+弱P",
      "↓溜め↑+中P",
      "↓溜め↑+大P",
      "↓溜め↑+K",
      "→↓↘+P",
      "1回転+大P",
      "1回転+大K",
      "P派生",
      "K派生",
    ],
  },
  {
    label: "SA",
    options: ["SA1", "SA2", "SA3"],
  },
  {
    label: "その他",
    options: [
      "ジャンプ",
      "前ステップ",
      "後ろステップ",
      "ドライブラッシュ",
      "OD必殺技",
      "↓↓",
      "↑↑",
      "→→",
      "←←",
    ],
  },
];

const MODERN_MOVE_GROUPS: ComboFlowMoveGroupDefinition[] = [
  {
    label: "通常技",
    options: [
      "弱",
      "中",
      "強",
      "しゃがみ弱",
      "しゃがみ中",
      "しゃがみ強",
      "ジャンプ弱",
      "ジャンプ中",
      "ジャンプ強",
      "アシスト弱",
      "アシスト中",
      "アシスト強",
    ],
  },
  {
    label: "特殊技",
    options: ["引き強", "前強", "溜め強", "前中", "タゲコン"],
  },
  {
    label: "コマンド技",
    options: [
      "必殺技",
      "↓+必殺技",
      "→+必殺技",
      "←+必殺技",
      "↑+必殺技",
      "P派生",
      "K派生",
    ],
  },
  {
    label: "SA",
    options: ["SA1", "SA2", "SA3"],
  },
  {
    label: "その他",
    options: [
      "ジャンプ",
      "前ステップ",
      "後ろステップ",
      "ドライブラッシュ",
      "OD必殺技",
      "↓↓",
      "↑↑",
      "→→",
      "←←",
    ],
  },
];

export const COMBO_FLOW_MOVE_GROUPS = CLASSIC_MOVE_GROUPS;
export type ComboFlowNodeTag = (typeof COMBO_FLOW_NODE_TAGS)[number];
export type ComboFlowMoveGroup = ComboFlowMoveGroupDefinition;
export type ComboFlowMoveGroupLabel = string;
export const COMBO_FLOW_HANDLE_SIDES = ["left", "right", "top", "bottom"] as const;
export type ComboFlowNodeHandleSide = (typeof COMBO_FLOW_HANDLE_SIDES)[number];

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
  fromSide?: ComboFlowNodeHandleSide;
  toSide?: ComboFlowNodeHandleSide;
  action: string;
  note: string;
};

export type ComboFlowPost = {
  id: number;
  user_id: string;
  author_name: string;
  character_name: string;
  control_scheme: ComboFlowControlScheme;
  title: string;
  summary: string;
  flow_nodes: ComboFlowNode[];
  flow_edges: ComboFlowEdge[];
  created_at: string;
  updated_at?: string;
};

export function getComboFlowMoveGroups(controlScheme: ComboFlowControlScheme) {
  return controlScheme === "modern" ? MODERN_MOVE_GROUPS : CLASSIC_MOVE_GROUPS;
}

export function getComboFlowMoveGroupLabel(
  move: string,
  controlScheme: ComboFlowControlScheme = "classic",
): ComboFlowMoveGroupLabel | "" {
  const group = getComboFlowMoveGroups(controlScheme).find((item) =>
    item.options.some((option) => option === move),
  );
  return group?.label ?? "";
}

export function getComboFlowControlSchemeLabel(controlScheme: ComboFlowControlScheme) {
  return controlScheme === "modern" ? "モダン" : "クラシック";
}

export function isComboFlowCharacter(value: string): value is ComboFlowCharacter {
  return COMBO_FLOW_CHARACTERS.includes(value as ComboFlowCharacter);
}

export function isComboFlowControlScheme(value: string): value is ComboFlowControlScheme {
  return COMBO_FLOW_CONTROL_SCHEMES.includes(value as ComboFlowControlScheme);
}

export function getComboFlowDetailHref(id: number) {
  return `/combo-flow/${id}`;
}

export function getComboFlowEditHref(id: number) {
  return `/combo-flow/${id}/edit`;
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

export function createEmptyComboNode(
  index: number,
  controlScheme: ComboFlowControlScheme = "classic",
): ComboFlowNode {
  return {
    id: `node-${Date.now()}-${index}`,
    move: controlScheme === "modern" ? "弱" : "弱P",
    tags: index === 0 ? ["始動"] : [],
    note: "",
    x: 80 + index * 220,
    y: 80,
  };
}

export function createEmptyComboEdge(
  index: number,
  from = "",
  to = "",
  fromSide: ComboFlowNodeHandleSide = "right",
  toSide: ComboFlowNodeHandleSide = "left",
): ComboFlowEdge {
  return {
    id: `edge-${Date.now()}-${index}`,
    from,
    to,
    fromSide,
    toSide,
    action: "",
    note: "",
  };
}
