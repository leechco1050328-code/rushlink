export const MISHAP_STORAGE_CATEGORY = "mishap";

export const MISHAP_CATEGORIES = [
  "朝のうっかり",
  "料理",
  "買い物事故",
  "家の中",
  "持ち物",
  "仕事・勉強",
] as const;

export type MishapCategory = (typeof MISHAP_CATEGORIES)[number];

export type MishapPost = {
  id: number;
  title: string;
  body: string;
  category: MishapCategory;
  tags: string[];
  createdAt: string;
};

export type MishapInsertPayload = {
  title: string;
  body: string;
  category: MishapCategory;
  tags: string[];
};

type ParsedMishapMetadata = {
  category: MishapCategory | null;
  tags: string[];
};

export function isMishapCategory(value: string): value is MishapCategory {
  return MISHAP_CATEGORIES.includes(value as MishapCategory);
}

export function normalizeMishapTags(value: string | string[]) {
  const source = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : value
        .split(/[\s,、]+/)
        .map((item) => item.trim())
        .filter(Boolean);

  return source
    .map((item) => item.replace(/^#+/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => `#${item.slice(0, 18)}`);
}

type MishapMetadata = {
  category?: string;
  tags?: string[];
};

export function serializeMishapMetadata(payload: MishapInsertPayload) {
  return JSON.stringify({
    category: payload.category,
    tags: payload.tags,
  });
}

export function parseMishapMetadata(raw: string | null): ParsedMishapMetadata {
  if (!raw) {
    return {
      category: null as MishapCategory | null,
      tags: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as MishapMetadata;
    const categoryCandidate = parsed.category ?? "";
    let category: MishapCategory | null = null;

    if (isMishapCategory(categoryCandidate)) {
      category = categoryCandidate;
    }

    const tags = normalizeMishapTags(parsed.tags ?? []);

    return {
      category,
      tags,
    };
  } catch {
    return {
      category: null as MishapCategory | null,
      tags: [],
    };
  }
}
