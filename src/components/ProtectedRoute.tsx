"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (role && profile && profile.role !== role) {
        // Option to redirect to their valid dashboard
        router.replace(`/${profile.role}`);
      }
    }
  }, [user, profile, loading, router, role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 animate-pulse">
           <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
           <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading context...</div>
        </div>
      </div>
    );
  }

  if (!user || (role && profile && profile.role !== role)) {
    return null; // Redirecting...
  }

  return <>{children}</>;
}
