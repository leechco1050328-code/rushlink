import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AdSenseScript } from "@/components/adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${SITE_NAME} | Street Fighter 6 コミュニティー`,
  description: SITE_DESCRIPTION,
  keywords: [
    "Street Fighter 6",
    "スト6",
    "対戦募集",
    "教えたい",
    "教わりたい",
    "リプレイコーチング",
    "MR",
    "格闘ゲームコミュニティー",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Street Fighter 6 コミュニティー`,
    description: SITE_DESCRIPTION,
    locale: "ja_JP",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Street Fighter 6 コミュニティー`,
    description: SITE_DESCRIPTION,
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
