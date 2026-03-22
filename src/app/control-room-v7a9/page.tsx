import { AdminPanel } from "@/components/admin-panel";
import { BrandPageHeader } from "@/components/brand-page-header";

export default function ControlRoomPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          kicker="Control Room"
          title="管理画面"
          description="通報確認、投稿削除、ユーザー利用停止を行うための管理ページです。Street Fighter 6 コミュニティーの運営導線をここに集約しています。"
        />

        <AdminPanel />
      </section>
    </main>
  );
}
