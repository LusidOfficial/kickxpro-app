"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FeedbackWidget from "@/components/FeedbackWidget";
import ProtectedRoute from "@/components/ProtectedRoute";

const NAV = [
  { href: "/parent", label: "Dashboard", icon: "grid" },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="parent">
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar items={NAV} accentColor="#8B5CF6" />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
        <FeedbackWidget role="parent" />
      </div>
    </ProtectedRoute>
  );
}
