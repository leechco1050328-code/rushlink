import { BrandPageHeader } from "@/components/brand-page-header";
import { ProfileEditor } from "@/components/profile-editor";

export default function ProfilePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          kicker="Profile Edit"
          title="プロフィール編集"
          description="表示名、メイン / サブキャラ、MR、SNS を更新できます。Street Fighter 6 の募集や相談に使う情報をここで整えてください。"
        />

        <section className="space-y-6">
          <ProfileEditor />
        </section>
      </section>
    </main>
  );
}
