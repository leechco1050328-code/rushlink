import { BrandPageHeader } from "@/components/brand-page-header";
import { MyPostsPanel } from "@/components/my-posts-panel";

export default function MyPostsPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          kicker="My Posts"
          title="自分の投稿一覧"
          description="自分が出した対戦募集、教えたい / 教わりたい募集、リプレイコーチング投稿をまとめて確認できます。"
        />

        <MyPostsPanel />
      </section>
    </main>
  );
}
