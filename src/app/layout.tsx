import type { Metadata } from "next";
import "./globals.css";

/* ──────────────────────────────────────────────
   ROOT LAYOUT — KickXPro MVP
   Google Fonts loaded via <link> for simplicity
   with Tailwind v4 (no next/font needed).
   ────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "KickXPro — Sports Performance Platform",
  description:
    "AI-powered sports tech platform for coaches and players. Track performance, log sessions, and build champions.",
  keywords: ["football", "soccer", "coaching", "performance", "sports tech"],
  openGraph: {
    title: "KickXPro — Sports Performance Platform",
    description: "Track performance, log sessions, and build champions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise-overlay">{children}</body>
    </html>
  );
}
