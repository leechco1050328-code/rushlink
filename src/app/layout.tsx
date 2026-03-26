import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteDescription =
  "Street Fighter 6 でMR帯別の対戦募集、教えたい / 教わりたい募集、リプレイIDを使ったコーチング相談まで扱うコミュニティーです。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Rush Link | Street Fighter 6 コミュニティー",
  description: siteDescription,
  keywords: [
    "Street Fighter 6",
    "スト6",
    "対戦募集",
    "教えたい",
    "教わりたい",
    "リプレイコーチング",
    "MR",
    "格ゲーコミュニティー",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Rush Link",
    title: "Rush Link | Street Fighter 6 コミュニティー",
    description: siteDescription,
    locale: "ja_JP",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rush Link | Street Fighter 6 コミュニティー",
    description: siteDescription,
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/icon-black.svg",
    apple: "/icon-black.svg",
    shortcut: "/icon-black.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AdSenseScript />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
