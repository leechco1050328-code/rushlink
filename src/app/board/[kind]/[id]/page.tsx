"use client";

import { useParams } from "next/navigation";
import { CommunityPostDetail } from "@/components/community-post-detail";

export default function CommunityPostDetailPage() {
  const params = useParams<{ kind: string; id: string }>();
  const kind =
    params.kind === "recruitment" || params.kind === "coaching" ? params.kind : null;
  const rawId = typeof params.id === "string" ? params.id : "";
  const postId = Number.parseInt(rawId, 10);

  return (
    <CommunityPostDetail
      kind={kind ?? "recruitment"}
      postId={Number.isNaN(postId) ? null : postId}
    />
  );
}
