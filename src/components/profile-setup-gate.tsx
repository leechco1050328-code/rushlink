"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSavedProfile } from "@/lib/has-saved-profile";

type ProfileSetupGateProps = {
  children: ReactNode;
};

export function ProfileSetupGate({ children }: ProfileSetupGateProps) {
  const supabase = getSupabaseBrowserClient();
  const [isHidden, setIsHidden] = useState(false);
  const [isReady, setIsReady] = useState(() => !supabase);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function refreshVisibility() {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        setIsHidden(false);
        setIsReady(true);
        return;
      }

      const { data, error } = await client
        .from("profiles")
        .select("display_name, main_character, sub_character, bio")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setIsHidden(false);
        setIsReady(true);
        return;
      }

      setIsHidden(hasSavedProfile(data));
      setIsReady(true);
    }

    refreshVisibility().catch(() => {
      if (!isMounted) {
        return;
      }
      setIsHidden(false);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      refreshVisibility().catch(() => {
        if (!isMounted) {
          return;
        }
        setIsHidden(false);
        setIsReady(true);
      });
    });

    function handleSaved() {
      refreshVisibility().catch(() => {
        if (!isMounted) {
          return;
        }
        setIsHidden(false);
        setIsReady(true);
      });
    }

    window.addEventListener("profile:saved", handleSaved);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("profile:saved", handleSaved);
    };
  }, [supabase]);

  if (!isReady) {
    return null;
  }

  if (isHidden) {
    return null;
  }

  return <>{children}</>;
}
