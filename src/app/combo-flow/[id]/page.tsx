import { ComboFlowEditor } from "@/components/combo-flow-editor";

export default async function ComboFlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const postId = Number.parseInt(resolvedParams.id, 10);

  return <ComboFlowEditor mode="edit" postId={Number.isNaN(postId) ? 0 : postId} />;
}
