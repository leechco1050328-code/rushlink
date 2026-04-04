import { ComboFlowCreateGate } from "@/components/combo-flow-create-gate";
import { ComboFlowEditor } from "@/components/combo-flow-editor";
import {
  COMBO_FLOW_CHARACTERS,
  type ComboFlowCharacter,
} from "@/lib/combo-flow";

export default async function NewComboFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ character?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const character =
    resolvedSearchParams.character &&
    COMBO_FLOW_CHARACTERS.includes(resolvedSearchParams.character as ComboFlowCharacter)
      ? (resolvedSearchParams.character as ComboFlowCharacter)
      : null;

  if (!character) {
    return <ComboFlowCreateGate />;
  }

  return <ComboFlowEditor mode="create" initialCharacter={character} />;
}
