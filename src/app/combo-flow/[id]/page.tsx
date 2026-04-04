import { ComboFlowViewer } from "@/components/combo-flow-viewer";

export default async function ComboFlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const postId = Number.parseInt(resolvedParams.id, 10);

  return <ComboFlowViewer postId={Number.isNaN(postId) ? 0 : postId} />;
}
