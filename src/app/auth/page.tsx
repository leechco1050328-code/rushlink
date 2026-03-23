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
          kicker="Entry"
          title="ユーザー登録とログイン"
          description="Street Fighter 6 の対戦募集、教えたい / 教わりたい募集、リプレイコーチングに参加するための認証ページです。"
        />

        <AuthPanel initialMode={initialMode} />
      </section>
    </main>
  );
}
