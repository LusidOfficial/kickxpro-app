/* ──────────────────────────────────────────────
   MARKETPLACE LAYOUT — Public storefront wrapper.
   No auth gating — browseable by everyone.
   ────────────────────────────────────────────── */
"use client";

import Navbar from "@/components/Navbar";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
