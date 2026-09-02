import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fleora — Imagine it. Plan it. Book it.",
  description:
    "Fleora is an AI-powered event marketplace: describe your celebration, get matched with local vendors, compare quotes, message, and book — all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
