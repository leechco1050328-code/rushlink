"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { CharacterChip } from "@/components/character-chip";
import { CHARACTER_OPTIONS } from "@/lib/characters";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileEditorProps = {
  onSaved?: () => void;
};

type ProfileForm = {
  display_name: string;
  main_character: string;
  sub_character: string;
  main_character_rank: string;
  main_character_mr: string;
  sub_character_rank: string;
  sub_character_mr: string;
  platform: string;
  voice_preference: string;
  x_account: string;
  discord_account: string;
  bio: string;
};

const defaultProfile: ProfileForm = {
  display_name: "",
  main_character: "",
  sub_character: "",
  main_character_rank: "",
  main_character_mr: "1500",
  sub_character_rank: "",
  sub_character_mr: "1500",
  platform: "",
  voice_preference: "",
  x_account: "",
  discord_account: "",
  bio: "",
};

const characterOptions = [...CHARACTER_OPTIONS];

const rankOptions = [
  "ルーキー",
  "アイアン",
  "ブロンズ",
  "シルバー",
  "ゴールド",
  "プラチナ",
  "ダイヤ",
  "マスター",
  "レジェンド",
];

const voiceOptions = ["通話あり希望", "通話なし希望", "どちらでも可"];

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "原因不明のエラーが発生しました。";
}

export function ProfileEditor({ onSaved }: ProfileEditorProps) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [form, setForm] = useState<ProfileForm>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(
    "ログインすると、ここでプロフィールを確認して保存できます。",
  );
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setMessage("Supabase の接続情報がまだ入っていません。");
      return;
    }

    const client = supabase;
    let isMounted = true;

    async function loadProfile(nextSession?: Session | null) {
      const activeSession =
        nextSession ??
        (await client.auth.getSession().then(({ data }) => data.session)) ??
        null;

      if (!isMounted) {
        return;
      }

      setSession(activeSession);

      if (!activeSession?.user) {
        setForm(defaultProfile);
        setIsLoading(false);
        setMessage("ログイン後にプロフィールを確認して保存できます。");
        return;
      }

      const userDisplayName = String(
        activeSession.user.user_metadata.display_name ?? "",
      ).trim();

      const { data, error } = await client
        .from("profiles")
        .select(
          "display_name, main_character, sub_character, main_character_rank, main_character_mr, sub_character_rank, sub_character_mr, platform, voice_preference, x_account, discord_account, bio",
        )
        .eq("user_id", activeSession.user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setForm({
          ...defaultProfile,
          display_name: userDisplayName,
        });
        setIsLoading(false);
        setMessage(
          `プロフィールの読み込みに失敗しました。docs/profile-setup.sql を Supabase の SQL Editor で実行してください。詳細: ${error.message}`,
        );
        return;
      }

      setForm({
        display_name: data?.display_name ?? userDisplayName,
        main_character: data?.main_character ?? "",
        sub_character: data?.sub_character ?? "",
        main_character_rank: data?.main_character_rank ?? "",
        main_character_mr: data?.main_character_mr || "1500",
        sub_character_rank: data?.sub_character_rank ?? "",
        sub_character_mr: data?.sub_character_mr || "1500",
        platform: data?.platform ?? "",
        voice_preference: data?.voice_preference ?? "",
        x_account: data?.x_account ?? "",
        discord_account: data?.discord_account ?? "",
        bio: data?.bio ?? "",
      });
      setIsLoading(false);
      setMessage("プロフィールを確認して保存できます。");
    }

    loadProfile().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setIsLoading(false);
      setMessage(
        `プロフィールの読み込みに失敗しました: ${getMessageFromError(error)}`,
      );
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);

      loadProfile(nextSession).catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
        setMessage(
          `プロフィールの読み込みに失敗しました: ${getMessageFromError(error)}`,
        );
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function updateField<Key extends keyof ProfileForm>(
    key: Key,
    value: ProfileForm[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function dispatchSavedEvent() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("profile:saved"));
    }
    onSaved?.();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !session?.user) {
      setMessage("ログインしてからプロフィールを保存してください。");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          user_id: session.user.id,
          display_name: form.display_name.trim(),
          main_character: form.main_character,
          sub_character: form.sub_character,
          main_character_rank: form.main_character_rank,
          main_character_mr:
            form.main_character_rank === "マスター" ? form.main_character_mr : "",
          sub_character_rank: form.sub_character_rank,
          sub_character_mr:
            form.sub_character_rank === "マスター" ? form.sub_character_mr : "",
          platform: form.platform.trim(),
          voice_preference: form.voice_preference,
          x_account: form.x_account.trim(),
          discord_account: form.discord_account.trim(),
          bio: form.bio.trim(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("profiles")
          .upsert(payload, { onConflict: "user_id" });

        if (error) {
          throw error;
        }

        const { error: authError } = await supabase.auth.updateUser({
          data: {
            display_name: form.display_name.trim(),
          },
        });

        if (authError) {
          throw authError;
        }

        setMessage("プロフィールを保存しました。");
        dispatchSavedEvent();
      } catch (error: unknown) {
        setMessage(`プロフィール保存に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  function handleDeleteAccount() {
    if (!supabase || !session?.user) {
      setMessage("ログインしてから削除してください。");
      return;
    }

    const isConfirmed = window.confirm(
      "このアカウントを削除すると、プロフィールと投稿も使えなくなります。続けますか？",
    );

    if (!isConfirmed) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        const accessToken = session.access_token;

        if (!accessToken) {
          throw new Error("ログイン情報を確認できませんでした。再ログインしてください。");
        }

        const response = await fetch("/api/account/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "アカウント削除に失敗しました。");
        }

        await supabase.auth.signOut();
        setSession(null);
        setForm(defaultProfile);
        setMessage("アカウントを削除しました。");
      } catch (error: unknown) {
        setMessage(`アカウント削除に失敗しました: ${getMessageFromError(error)}`);
      }
    });
  }

  return (
    <section className="panel rounded-[30px] px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display text-2xl text-white">プロフィール編集</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            表示名、使用キャラ、ランク、SNS を更新できます。
          </p>
        </div>
        <span
          className={`pill-button px-3 py-1 text-xs ${
            session?.user
              ? "bg-[var(--secondary)]/15 text-[var(--secondary)]"
              : "bg-white/8 text-[var(--muted)]"
          }`}
        >
          {session?.user ? "ログイン中" : "未ログイン"}
        </span>
      </div>

      <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[var(--muted)]">
        <p>{message}</p>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-[var(--muted)]">
          プロフィールを読み込み中...
        </p>
      ) : !session?.user ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-[var(--muted)]">
          ログインするとプロフィールを編集できます。
        </div>
      ) : (
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-[var(--muted)]">表示名</span>
            <input
              value={form.display_name}
              onChange={(event) => updateField("display_name", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="例: Kaito"
              required
            />
          </label>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">メインキャラ</span>
                <select
                  value={form.main_character}
                  onChange={(event) => updateField("main_character", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">選択してください</option>
                  {characterOptions.map((character) => (
                    <option key={character} value={character}>
                      {character}
                    </option>
                  ))}
                </select>
                <div className="mt-3">
                  <CharacterChip
                    name={form.main_character}
                    labelPrefix="選択中"
                    size="md"
                    tone="accent"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">
                  メインキャラのランク
                </span>
                <select
                  value={form.main_character_rank}
                  onChange={(event) => {
                    const nextRank = event.target.value;
                    updateField("main_character_rank", nextRank);
                    if (nextRank !== "マスター") {
                      updateField("main_character_mr", "1500");
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">選択してください</option>
                  {rankOptions.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </label>

              {form.main_character_rank === "マスター" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--muted)]">
                    メインキャラのMR
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="800"
                    max="2600"
                    step="50"
                    value={form.main_character_mr}
                    onChange={(event) =>
                      updateField("main_character_mr", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              ) : null}
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">サブキャラ</span>
                <select
                  value={form.sub_character}
                  onChange={(event) => updateField("sub_character", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">選択してください</option>
                  {characterOptions.map((character) => (
                    <option key={character} value={character}>
                      {character}
                    </option>
                  ))}
                </select>
                <div className="mt-3">
                  <CharacterChip
                    name={form.sub_character}
                    labelPrefix="選択中"
                    size="md"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">
                  サブキャラのランク
                </span>
                <select
                  value={form.sub_character_rank}
                  onChange={(event) => {
                    const nextRank = event.target.value;
                    updateField("sub_character_rank", nextRank);
                    if (nextRank !== "マスター") {
                      updateField("sub_character_mr", "1500");
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">選択してください</option>
                  {rankOptions.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </label>

              {form.sub_character_rank === "マスター" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-[var(--muted)]">
                    サブキャラのMR
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="800"
                    max="2600"
                    step="50"
                    value={form.sub_character_mr}
                    onChange={(event) =>
                      updateField("sub_character_mr", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              ) : null}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">
              プラットフォーム
            </span>
            <input
              value={form.platform}
              onChange={(event) => updateField("platform", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="例: PC / PS5"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">通話設定</span>
            <select
              value={form.voice_preference}
              onChange={(event) =>
                updateField("voice_preference", event.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">選択してください</option>
              {voiceOptions.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">X アカウント</span>
            <input
              value={form.x_account}
              onChange={(event) => updateField("x_account", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="@your_handle"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[var(--muted)]">Discord</span>
            <input
              value={form.discord_account}
              onChange={(event) =>
                updateField("discord_account", event.target.value)
              }
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="yourname"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-[var(--muted)]">自己紹介</span>
            <textarea
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="対戦したい時間帯や、教わりたいことを書いてください。"
            />
          </label>

          <div className="grid gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isPending || isDeleting}
              className="primary-action disabled:opacity-60"
            >
              {isPending ? "保存中..." : "プロフィールを保存する"}
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isPending || isDeleting}
              className="secondary-action disabled:opacity-60"
            >
              {isDeleting ? "削除中..." : "ユーザーを削除する"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
