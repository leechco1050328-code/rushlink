import type { Metadata } from "next";
import { MishapBoard } from "./mishap-board";

const routePath = "/watashino-fukou-wo-warae";

export const metadata: Metadata = {
  title: "私の不幸を笑え",
  description: "笑ってほしい、日常の小さなやらかしを共有する特設ページ。",
  alternates: {
    canonical: routePath,
  },
  openGraph: {
    title: "私の不幸を笑え",
    description: "笑ってほしい、日常の小さなやらかしを共有する特設ページ。",
    url: routePath,
  },
  twitter: {
    title: "私の不幸を笑え",
    description: "笑ってほしい、日常の小さなやらかしを共有する特設ページ。",
  },
};

export default function MishapLandingPage() {
  return <MishapBoard />;
}
