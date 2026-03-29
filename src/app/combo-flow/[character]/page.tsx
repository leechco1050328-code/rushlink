import { notFound } from "next/navigation";
import { BrandPageHeader } from "@/components/brand-page-header";
import { ComboFlowBoard } from "@/components/combo-flow-board";
import {
  decodeComboFlowCharacter,
  isComboFlowCharacter,
} from "@/lib/combo-flow";

export default async function CharacterComboFlowPage({
  params,
}: {
  params: Promise<{ character: string }>;
}) {
  const resolvedParams = await params;
  const characterName = decodeComboFlowCharacter(resolvedParams.character);

  if (!isComboFlowCharacter(characterName)) {
    notFound();
  }

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/combo-flow"
          backLabel="キャラ一覧へ戻る"
          kicker="Combo Flow"
          title={`${characterName} のコンボフロー`}
          description="技コマンドや技強度をノードで置き、カウンター・パニカンのラベルや微歩き付きの矢印で、実戦向けのルートを共有します。"
        />

        <ComboFlowBoard characterName={characterName} />
      </section>
    </main>
  );
}
