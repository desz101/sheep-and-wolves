import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { FooterAd } from "@/components/FooterAd";
import { HomeMusicPlayer } from "@/components/HomeMusicPlayer";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-W76YFL656N";
const ADSENSE_CLIENT_ID = "ca-pub-4757381719550518";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://sheepandwolves.app";
const SITE_NAME = "Sheep & Wolves";
const DESCRIPTION =
  "Free real-time social deduction party game. Host a game, share the code, and find the wolves before they outnumber the sheep. No app download required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free Online Social Deduction Party Game`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "social deduction game",
    "party game app",
    "werewolf game online",
    "mafia party game",
    "sheep and wolves",
    "group game for phones",
    "free party game no app",
    "online werewolf",
  ],
  authors: [{ name: SITE_NAME }],
  applicationName: SITE_NAME,
  category: "Games",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free Online Social Deduction Party Game`,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Free Online Social Deduction Party Game`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0d17",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <LanguageProvider>
          <LanguageToggle />
          {children}
          <SiteFooter />
          {process.env.NODE_ENV === "production" && <FooterAd />}
          <HomeMusicPlayer />
        </LanguageProvider>
      </body>
      {process.env.NODE_ENV === "production" && (
        <>
          <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        </>
      )}
    </html>
  );
}
