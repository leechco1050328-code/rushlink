import Link from "next/link";
import { CharacterChip } from "@/components/character-chip";
import {
  COMBO_FLOW_CHARACTERS,
  getComboFlowHref,
} from "@/lib/combo-flow";

export function ComboFlowCatalog() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {COMBO_FLOW_CHARACTERS.map((character) => (
        <Link
          key={character}
          href={getComboFlowHref(character)}
          className="panel rounded-[28px] px-6 py-6 transition-transform duration-200 hover:-translate-y-1"
        >
          <div className="space-y-4">
            <CharacterChip name={character} size="md" tone="accent" />
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">{character}</h2>
              <p className="text-sm leading-7 text-[var(--muted)]">
                このキャラのコンボフロー、始動別ルート、微歩きやDR付きの分岐をまとめて見られます。
              </p>
            </div>
            <span className="text-sm text-[var(--accent-soft)] underline underline-offset-4">
              {character} のページへ
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
