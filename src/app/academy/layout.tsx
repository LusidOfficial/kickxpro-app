import Link from "next/link";
import { IconUsers, IconUser, IconClipboard, IconActivity } from "@/components/Icons";

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Academy Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">Academy Portal</h2>
              <p className="text-xs text-slate-500">Admin Area</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/academy" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
            <IconActivity size={18} />
            Dashboard
          </Link>
          <Link href="/academy/coaches" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
            <IconUser size={18} />
            Manage Coaches
          </Link>
          <Link href="/academy/students" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
            <IconUsers size={18} />
            Student Roster
          </Link>
          <Link href="/academy/tournaments" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
            <IconClipboard size={18} />
            Tournaments
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors">
            Exit to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
