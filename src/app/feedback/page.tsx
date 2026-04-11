import { BrandPageHeader } from "@/components/brand-page-header";
import { FeedbackForm } from "@/components/feedback-form";
import { SITE_BETA_NOTE } from "@/lib/site";

export default function FeedbackPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="grid-noise absolute inset-0 opacity-40" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <BrandPageHeader
          backHref="/"
          kicker="Beta Feedback"
          title="要望フォーム"
          description={SITE_BETA_NOTE}
        />

        <FeedbackForm />
      </section>
    </main>
  );
}
