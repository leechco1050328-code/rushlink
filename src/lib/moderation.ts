import type { SupabaseClient } from "@supabase/supabase-js";

export async function getBlockedUserIds(
  client: SupabaseClient,
  blockerUserId: string,
) {
  const { data, error } = await client
    .from("user_blocks")
    .select("blocked_user_id")
    .eq("blocker_user_id", blockerUserId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.blocked_user_id as string);
}

export async function isBannedUser(
  client: SupabaseClient,
  userId: string,
) {
  const { data, error } = await client
    .from("banned_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.user_id);
}
