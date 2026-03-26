import { AuthPanel } from "@/components/auth-panel";
import { BrandPageHeader } from "@/components/brand-page-header";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const initialMode = params.mode === "sign-in" ? "sign-in" : "sign-up";

  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          backLabel="トップへ戻る"
          kicker="Entry"
          title="ユーザー登録とログイン"
          description="メールアドレスとパスワードでアカウントを作成し、募集投稿やリプレイコーチングを使えるようにします。"
        />

        <AuthPanel initialMode={initialMode} />
      </section>
    </main>
  );
}
