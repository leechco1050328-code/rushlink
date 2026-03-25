import type { SupabaseClient } from "@supabase/supabase-js";

export type ApplicationSource = "recruitment_posts" | "coaching_posts";
export type ApplicationKind = "対戦募集" | "教えたい" | "教わりたい";

export type CommunityApplication = {
  id: number;
  post_source: ApplicationSource;
  post_id: number;
  post_owner_id: string;
  post_title: string;
  post_kind: ApplicationKind;
  post_character_name: string;
  applicant_user_id: string;
  applicant_name: string;
  application_type: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

export function getApplicationActionLabel(postKind: ApplicationKind) {
  switch (postKind) {
    case "対戦募集":
      return "対戦を申し込む";
    case "教えたい":
      return "教えてもらう";
    case "教わりたい":
      return "教えたい";
    default:
      return "応募する";
  }
}

export async function fetchUnreadApplicationCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("community_post_applications")
    .select("id", { count: "exact", head: true })
    .eq("post_owner_id", userId)
    .is("read_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function fetchApplicationsForOwner(
  supabase: SupabaseClient,
  userId: string,
): Promise<CommunityApplication[]> {
  const { data, error } = await supabase
    .from("community_post_applications")
    .select(
      "id, post_source, post_id, post_owner_id, post_title, post_kind, post_character_name, applicant_user_id, applicant_name, application_type, message, created_at, read_at",
    )
    .eq("post_owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CommunityApplication[];
}

export async function markApplicationsAsRead(
  supabase: SupabaseClient,
  userId: string,
  applicationIds: number[],
) {
  if (applicationIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("community_post_applications")
    .update({ read_at: new Date().toISOString() })
    .eq("post_owner_id", userId)
    .in("id", applicationIds)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}
