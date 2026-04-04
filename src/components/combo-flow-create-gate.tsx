"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMBO_FLOW_CHARACTERS, type ComboFlowCharacter } from "@/lib/combo-flow";

export function ComboFlowCreateGate() {
  const router = useRouter();
  const [characterName, setCharacterName] = useState<ComboFlowCharacter | "">("");

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8 md:px-10 md:py-12">
        <div className="panel rounded-[28px] px-6 py-6">
          <Link
            href="/combo-flow"
            className="text-sm text-[var(--accent-soft)] underline underline-offset-4"
          >
            コンボフロー管理へ戻る
          </Link>

          <div className="mt-5 space-y-3">
            <h1 className="text-3xl font-semibold text-white">新規コンボフロー作成</h1>
            <p className="text-sm leading-7 text-[var(--muted)]">
              先にキャラクターを選んでから、フロー作成画面へ進みます。
            </p>
          </div>
        </div>

        <section className="panel rounded-[28px] px-6 py-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="combo-flow-create-character"
                className="text-sm font-medium text-white"
              >
                キャラクター
              </label>
              <select
                id="combo-flow-create-character"
                value={characterName}
                onChange={(event) => setCharacterName(event.target.value as ComboFlowCharacter)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">キャラクターを選択</option>
                {COMBO_FLOW_CHARACTERS.map((character) => (
                  <option key={character} value={character}>
                    {character}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={!characterName}
              onClick={() =>
                router.push(`/combo-flow/new?character=${encodeURIComponent(characterName)}`)
              }
              className="primary-action min-w-[12rem] disabled:opacity-50"
            >
              作成画面へ進む
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
