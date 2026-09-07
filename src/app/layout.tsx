import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fleora.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Fleora — Plan the party. Find the people to bring it to life.",
  description: "Plan your event, discover the right vendors, compare quotes, and keep every detail together with Fleora.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Fleora",
    title: "Fleora — Plan the party. Find the people to bring it to life.",
    description: "Plan your event, discover the right vendors, compare quotes, and keep every detail together with Fleora.",
    images: [
      {
        url: "/fleora-social-share.jpg",
        width: 1200,
        height: 630,
        alt: "Fleora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fleora — Plan the party. Find the people to bring it to life.",
    description: "Plan your event, discover the right vendors, compare quotes, and keep every detail together with Fleora.",
    images: ["/fleora-social-share.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
