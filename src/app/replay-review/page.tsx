import { BrandPageHeader } from "@/components/brand-page-header";
import { ReplayReviewBoard } from "@/components/replay-review-board";

export default async function ReplayReviewListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const rawPage = params.page ?? "1";
  const currentPage = Number.parseInt(rawPage, 10);

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/#replay-review"
          kicker="Replay Coaching"
          title="リプレイコーチング一覧"
          description="リプレイID付きの依頼を一覧で確認できます。投稿を開くと詳細画面でコメントと返信ができます。"
        />

        <ReplayReviewBoard
          currentPage={Number.isNaN(currentPage) ? 1 : currentPage}
          pageSize={10}
          listPageHref="/replay-review"
          showComposer={false}
          multiColumnList
        />
      </section>
    </main>
  );
}
