import { BrandPageHeader } from "@/components/brand-page-header";
import { NotificationsPanel } from "@/components/notifications-panel";

export default function NotificationsPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          backLabel="トップへ戻る"
          kicker="Notifications"
          title="応募通知"
          description="あなたの募集に対して届いた応募を確認できます。未読通知はここでまとめて既読にできます。"
        />

        <NotificationsPanel />
      </section>
    </main>
  );
}
