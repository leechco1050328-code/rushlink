import { BrandPageHeader } from "@/components/brand-page-header";
import { ComboFlowDashboard } from "@/components/combo-flow-dashboard";

export default function ComboFlowPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          backLabel="トップへ戻る"
          kicker="Combo Flow"
          title="自分のコンボフロー管理"
          description="キャラクターを選んで自分用のコンボフローページを作成し、ノードと矢印でルートを整理できます。"
        />

        <ComboFlowDashboard />
      </section>
    </main>
  );
}
