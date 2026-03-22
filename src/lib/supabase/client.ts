import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getMissingSupabaseEnv() {
  return [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabasePublishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null,
  ].filter((value): value is string => Boolean(value));
}

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(supabaseUrl!, supabasePublishableKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
