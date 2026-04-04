import { ComboFlowCreateGate } from "@/components/combo-flow-create-gate";
import { ComboFlowEditor } from "@/components/combo-flow-editor";
import {
  isComboFlowCharacter,
  isComboFlowControlScheme,
  type ComboFlowCharacter,
  type ComboFlowControlScheme,
} from "@/lib/combo-flow";

export default async function NewComboFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ character?: string; control?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const character = isComboFlowCharacter(resolvedSearchParams.character ?? "")
    ? (resolvedSearchParams.character as ComboFlowCharacter)
    : null;
  const controlScheme = isComboFlowControlScheme(resolvedSearchParams.control ?? "")
    ? (resolvedSearchParams.control as ComboFlowControlScheme)
    : null;

  if (!character || !controlScheme) {
    return <ComboFlowCreateGate />;
  }

  return (
    <ComboFlowEditor
      mode="create"
      initialCharacter={character}
      initialControlScheme={controlScheme}
    />
  );
}
