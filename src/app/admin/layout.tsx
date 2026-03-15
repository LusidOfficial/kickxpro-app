/* ──────────────────────────────────────────────
   ADMIN LAYOUT — Shared layout for all
   /admin/* pages with sidebar navigation.
   ────────────────────────────────────────────── */

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { NAV_ITEMS } from "@/lib/constants";

export const metadata = {
  title: "Admin Dashboard — KickXPro",
  description: "Platform ops — user management, academies, approvals & analytics.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role="admin" />
      <div className="flex flex-1">
        <Sidebar items={[...NAV_ITEMS.admin]} accentColor="#A78BFA" />
        <main className="flex-1 p-6 md:p-8 relative z-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
