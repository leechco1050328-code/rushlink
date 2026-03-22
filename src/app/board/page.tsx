import { BrandPageHeader } from "@/components/brand-page-header";
import { CommunityBoard } from "@/components/community-board";

export default async function BoardPage({
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
          backHref="/#board"
          kicker="Community Board"
          title="募集一覧"
          description="Street Fighter 6 のランク帯、MR帯、通話あり/なし、教えたい/教わりたいを見ながら募集を探せます。10件ずつ表示しています。"
        />

        <CommunityBoard
          currentPage={Number.isNaN(currentPage) ? 1 : currentPage}
          pageSize={10}
          listPageHref="/board"
          showComposer={false}
          multiColumnList
        />
      </section>
    </main>
  );
}
