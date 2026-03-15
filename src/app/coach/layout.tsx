/* ──────────────────────────────────────────────
   COACH LAYOUT — Shared layout for all
   /coach/* pages with sidebar navigation.
   ────────────────────────────────────────────── */

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { NAV_ITEMS } from "@/lib/constants";

export const metadata = {
  title: "Coach Dashboard — KickXPro",
  description: "Manage your roster, log sessions, and track player development.",
};

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role="coach" />
      <div className="flex flex-1">
        <Sidebar items={[...NAV_ITEMS.coach]} accentColor="#60A5FA" />
        <main className="flex-1 p-6 md:p-8 relative z-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
