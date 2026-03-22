import Script from "next/script";
import { getAdSenseClientId } from "@/lib/adsense";

export function AdSenseScript() {
  const clientId = getAdSenseClientId();

  if (!clientId) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}
