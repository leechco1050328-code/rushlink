import { BrandPageHeader } from "@/components/brand-page-header";
import { ComboFlowCatalog } from "@/components/combo-flow-catalog";

export default function ComboFlowPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          backLabel="トップへ戻る"
          kicker="Combo Flow"
          title="キャラ別のコンボフロー"
          description="キャラごとに、技ノードと矢印でスト6のコンボルートを整理します。カウンターやパニカン、微歩きやDRも図のまま共有できます。"
        />

        <ComboFlowCatalog />
      </section>
    </main>
  );
}
