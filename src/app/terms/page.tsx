import { BrandPageHeader } from "@/components/brand-page-header";

const sections = [
  {
    title: "1. サービス内容",
    body: "Rush Link は、Street Fighter 6 を中心とした対戦募集、教えたい / 教わりたい募集、リプレイコーチング依頼、プロフィール公開機能を提供します。",
  },
  {
    title: "2. 禁止事項",
    body: "迷惑行為、誹謗中傷、なりすまし、外部サービスへの誘導を目的としたスパム、違法行為、運営判断で不適切とみなす行為を禁止します。",
  },
  {
    title: "3. 投稿内容",
    body: "投稿内容、プロフィール、SNS情報は、他のユーザーが閲覧できる前提で登録してください。大会結果、MR、ランク帯などの記載は、本人が責任をもって管理してください。",
  },
  {
    title: "4. アカウント停止",
    body: "通報内容や利用状況に応じて、運営は投稿削除、アカウント停止、アクセス制限を行うことがあります。",
  },
  {
    title: "5. 免責",
    body: "ユーザー間のやり取り、外部SNSでの連絡、対戦やコーチングの実施結果について、運営は直接の責任を負いません。",
  },
  {
    title: "6. 規約変更",
    body: "本規約は、必要に応じて変更することがあります。重要な変更はサイト上で案内します。",
  },
];

export default function TermsPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          kicker="Terms"
          title="利用規約"
          description="Rush Link を利用する前に確認してほしいルールです。Street Fighter 6 の募集やリプレイ相談を安全に行うための前提をまとめています。"
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
