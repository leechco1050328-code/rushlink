"use client";

import { useParams } from "next/navigation";
import { ReplayReviewDetail } from "@/components/replay-review-detail";

export default function ReplayReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = typeof params.id === "string" ? params.id : "";
  const postId = Number.parseInt(rawId, 10);

  return <ReplayReviewDetail postId={Number.isNaN(postId) ? null : postId} />;
}
