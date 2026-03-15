/* ──────────────────────────────────────────────
   PLAYER LAYOUT — Shared layout for all
   /player/* pages with sidebar navigation.
   ────────────────────────────────────────────── */

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { NAV_ITEMS } from "@/lib/constants";

export const metadata = {
  title: "Player Dashboard — KickXPro",
  description: "Your progress card, skill radar, streaks, and rank — all in one place.",
};

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role="player" />
      <div className="flex flex-1">
        <Sidebar items={[...NAV_ITEMS.player]} accentColor="#00C853" />
        <main className="flex-1 p-6 md:p-8 relative z-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
