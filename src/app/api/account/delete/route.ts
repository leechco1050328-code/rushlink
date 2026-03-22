import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();

  if (!supabaseUrl || !supabasePublishableKey || !supabaseServiceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Supabase のサーバー設定が不足しています。SUPABASE_SERVICE_ROLE_KEY を設定してください。",
      },
      { status: 500 },
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "認証トークンがありません。" },
      { status: 401 },
    );
  }

  const authClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { error: userError?.message ?? "ユーザー確認に失敗しました。" },
      { status: 401 },
    );
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("user_id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 },
    );
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
