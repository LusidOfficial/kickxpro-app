/* ──────────────────────────────────────────────
   STREAK INDICATOR — Visual dot grid showing
   attendance streak and training completion.
   ────────────────────────────────────────────── */

interface StreakIndicatorProps {
  /** Current consecutive streak count */
  streak: number;
  /** Attendance records (most recent first) */
  records: { date: string; present: boolean }[];
  /** Maximum dots to show */
  maxDots?: number;
}

import { IconFire } from "./Icons";

export default function StreakIndicator({
  streak,
  records,
  maxDots = 20,
}: StreakIndicatorProps) {
  const dots = records.slice(0, maxDots);

  return (
    <div className="card-static p-5">
      {/* Streak header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconFire size={20} color="#F59E0B" />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Attendance Streak
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: streak > 0 ? "#00C853" : "var(--color-text-dim)" }}
          >
            {streak}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            days
          </span>
        </div>
      </div>

      {/* Dot grid */}
      <div className="flex flex-wrap gap-1.5">
        {dots.map((record, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm transition-all"
            style={{
              background: record.present
                ? i < streak
                  ? "#00C853"
                  : "rgba(0, 200, 83, 0.3)"
                : "rgba(239, 68, 68, 0.3)",
              boxShadow: record.present && i < streak
                ? "0 0 6px rgba(0, 200, 83, 0.4)"
                : "none",
            }}
            title={`${record.date}: ${record.present ? "Present" : "Absent"}`}
          />
        ))}
        {dots.length === 0 && (
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            No attendance records yet
          </span>
        )}
      </div>
    </div>
  );
}
