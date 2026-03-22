import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

async function getAuthorizedClients(request: Request) {
  if (!supabaseUrl || !supabasePublishableKey || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase のサーバー設定が不足しています。SUPABASE_SERVICE_ROLE_KEY を設定してください。",
    );
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return { error: "認証トークンがありません。", status: 401 as const };
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
    return {
      error: userError?.message ?? "ユーザー確認に失敗しました。",
      status: 401 as const,
    };
  }

  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return { error: "管理者権限がありません。", status: 403 as const };
  }

  return { adminClient, user };
}

export async function GET(request: Request) {
  try {
    const authorized = await getAuthorizedClients(request);
    if ("error" in authorized) {
      return NextResponse.json({ error: authorized.error }, { status: authorized.status });
    }

    const { adminClient } = authorized;
    const [reportsResult, bansResult] = await Promise.all([
      adminClient
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      adminClient
        .from("banned_users")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (reportsResult.error) {
      return NextResponse.json({ error: reportsResult.error.message }, { status: 500 });
    }

    if (bansResult.error) {
      return NextResponse.json({ error: bansResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      reports: reportsResult.data ?? [],
      bannedUsers: bansResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "取得に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await getAuthorizedClients(request);
    if ("error" in authorized) {
      return NextResponse.json({ error: authorized.error }, { status: authorized.status });
    }

    const { adminClient, user } = authorized;
    const payload = (await request.json().catch(() => null)) as
      | {
          action?: string;
          reportId?: number;
          userId?: string;
          reason?: string;
          targetSource?: string;
          targetId?: number;
        }
      | null;

    if (!payload?.action) {
      return NextResponse.json({ error: "action が必要です。" }, { status: 400 });
    }

    if (payload.action === "resolve_report") {
      const { error } = await adminClient
        .from("reports")
        .update({
          status: "resolved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", payload.reportId ?? -1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (payload.action === "delete_target") {
      if (!payload.targetSource || payload.targetId == null) {
        return NextResponse.json({ error: "対象情報が不足しています。" }, { status: 400 });
      }

      const { error } = await adminClient
        .from(payload.targetSource)
        .delete()
        .eq("id", payload.targetId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (payload.reportId) {
        await adminClient
          .from("reports")
          .update({
            status: "resolved",
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          })
          .eq("id", payload.reportId);
      }

      return NextResponse.json({ ok: true });
    }

    if (payload.action === "ban_user") {
      if (!payload.userId) {
        return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });
      }

      const { error } = await adminClient.from("banned_users").upsert(
        {
          user_id: payload.userId,
          reason: payload.reason ?? "",
          updated_at: new Date().toISOString(),
          created_by: user.id,
        },
        { onConflict: "user_id" },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (payload.action === "unban_user") {
      if (!payload.userId) {
        return NextResponse.json({ error: "userId が必要です。" }, { status: 400 });
      }

      const { error } = await adminClient
        .from("banned_users")
        .delete()
        .eq("user_id", payload.userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "不明な action です。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新に失敗しました。" },
      { status: 500 },
    );
  }
}
