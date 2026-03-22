import { BrandPageHeader } from "@/components/brand-page-header";

const sections = [
  {
    title: "1. 取得する情報",
    body: "メールアドレス、表示名、使用キャラ、ランク帯、MR、SNSアカウント、プロフィール文、投稿内容、通報情報などを取得します。",
  },
  {
    title: "2. 利用目的",
    body: "ユーザー認証、募集機能の提供、リプレイコーチング機能の提供、通報対応、不正利用対策、サービス改善のために利用します。",
  },
  {
    title: "3. 外部サービス",
    body: "本サービスは Vercel、Supabase、Google AdSense などの外部サービスを利用する場合があります。これらのサービス上でデータが処理されることがあります。",
  },
  {
    title: "4. 第三者提供",
    body: "法令に基づく場合を除き、本人の同意なく個人情報を第三者へ提供しません。ただし、SNSアカウントやプロフィール情報は公開設定された内容として他のユーザーに表示されます。",
  },
  {
    title: "5. 保存期間",
    body: "アカウント削除または運営上不要となるまで、必要な範囲で情報を保持します。法令対応や不正利用対策上、一定期間ログを保持することがあります。",
  },
  {
    title: "6. お問い合わせ",
    body: "プライバシーに関する問い合わせは、今後設置する運営連絡先または案内ページから受け付けます。",
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          kicker="Privacy"
          title="プライバシーポリシー"
          description="Rush Link で取り扱う情報と、その利用目的をまとめています。Street Fighter 6 の対戦募集やリプレイ相談に必要な範囲で情報を扱います。"
        />

        <section className="panel rounded-[30px] px-6 py-6 md:px-8">
          <div className="space-y-6">
            {sections.map((section) => (
              <article key={section.title} className="space-y-2">
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                <p className="text-sm leading-8 text-[var(--muted)] md:text-base">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
