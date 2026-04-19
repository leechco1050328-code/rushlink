import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MISHAP_CATEGORIES,
  MISHAP_STORAGE_CATEGORY,
  isMishapCategory,
  normalizeMishapTags,
  parseMishapMetadata,
  serializeMishapMetadata,
  type MishapInsertPayload,
  type MishapPost,
} from "@/lib/mishap-posts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = "force-dynamic";

type FeedbackRequestRow = {
  id: number;
  title: string;
  detail: string;
  contact: string | null;
  created_at: string;
  status: string;
};

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "投稿の処理に失敗しました。";
}

function buildSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function mapRowToMishapPost(row: FeedbackRequestRow): MishapPost | null {
  const metadata = parseMishapMetadata(row.contact);
  const category = metadata.category;

  if (!category) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    body: row.detail,
    category,
    tags: metadata.tags,
    createdAt: row.created_at,
  };
}

function validatePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {
      error: "投稿内容が見つかりません。",
      value: null,
    };
  }

  const draft = payload as Partial<Record<keyof MishapInsertPayload, unknown>>;
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  const body = typeof draft.body === "string" ? draft.body.trim() : "";
  const category = typeof draft.category === "string" ? draft.category.trim() : "";
  const tags = normalizeMishapTags(Array.isArray(draft.tags) ? draft.tags : []);

  if (title.length < 10 || title.length > 80) {
    return {
      error: "タイトルは10〜80文字で入力してください。",
      value: null,
    };
  }

  if (body.length < 20 || body.length > 280) {
    return {
      error: "本文は20〜280文字で入力してください。",
      value: null,
    };
  }

  if (!isMishapCategory(category)) {
    return {
      error: `カテゴリは ${MISHAP_CATEGORIES.join(" / ")} から選んでください。`,
      value: null,
    };
  }

  return {
    error: null,
    value: {
      title,
      body,
      category,
      tags,
    } satisfies MishapInsertPayload,
  };
}

export async function GET() {
  const client = buildSupabaseClient();

  if (!client) {
    return NextResponse.json(
      {
        error:
          "Supabase のサーバー設定が不足しています。SUPABASE_SERVICE_ROLE_KEY を設定してください。",
      },
      { status: 500 },
    );
  }

  const { data, error } = await client
    .from("feedback_requests")
    .select("id, title, detail, contact, created_at, status")
    .eq("category", MISHAP_STORAGE_CATEGORY)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posts = ((data ?? []) as FeedbackRequestRow[])
    .map(mapRowToMishapPost)
    .filter((post): post is MishapPost => Boolean(post));

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const client = buildSupabaseClient();

  if (!client || !supabasePublishableKey) {
    return NextResponse.json(
      {
        error:
          "Supabase の投稿設定が不足しています。NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY と SUPABASE_SERVICE_ROLE_KEY を確認してください。",
      },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const result = validatePayload(body);

    if (result.error || !result.value) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const payload = result.value;

    const { data, error } = await client
      .from("feedback_requests")
      .insert({
        user_id: null,
        user_email: "",
        category: MISHAP_STORAGE_CATEGORY,
        title: payload.title,
        detail: payload.body,
        contact: serializeMishapMetadata(payload),
        status: "published",
      })
      .select("id, title, detail, contact, created_at, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const post = mapRowToMishapPost(data as FeedbackRequestRow);

    if (!post) {
      return NextResponse.json(
        { error: "投稿の整形に失敗しました。" },
        { status: 500 },
      );
    }

    return NextResponse.json({ post });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getMessageFromError(error) },
      { status: 500 },
    );
  }
}
