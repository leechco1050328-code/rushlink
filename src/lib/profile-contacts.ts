import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileContact = {
  user_id: string;
  x_account: string;
  discord_account: string;
};

export type ProfileContactMap = Record<
  string,
  {
    x_account: string;
    discord_account: string;
  }
>;

export async function loadProfileContacts(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<ProfileContactMap> {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, x_account, discord_account")
    .in("user_id", uniqueUserIds);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfileContact[]).reduce<ProfileContactMap>((result, row) => {
    result[row.user_id] = {
      x_account: row.x_account?.trim() ?? "",
      discord_account: row.discord_account?.trim() ?? "",
    };
    return result;
  }, {});
}
