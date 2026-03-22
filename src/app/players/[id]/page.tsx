"use client";

import { useParams } from "next/navigation";
import { PublicProfile } from "@/components/public-profile";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = typeof params.id === "string" ? params.id : null;

  return <PublicProfile userId={userId} />;
}
