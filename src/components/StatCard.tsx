/* ──────────────────────────────────────────────
   STAT CARD (Light Theme)
   Clean, crisp card with high contrast text
   ────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string | React.ReactNode;
  accentColor?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  icon,
  accentColor = "#00C853",
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="card p-5 flex flex-col justify-between opacity-0 animate-fade-up group relative overflow-hidden"
      style={{
        animationDelay: `${delay}s`,
        animationFillMode: "forwards",
      }}
    >
      {/* Decorative gradient orb on hover */}
      <div 
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl pointer-events-none"
        style={{ background: accentColor }}
      />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="text-sm font-semibold tracking-wide text-slate-500">
          {label}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{
              background: `${accentColor}10`,
              color: accentColor,
            }}
          >
            {typeof icon === "string" ? <span className="text-xl">{icon}</span> : icon}
          </div>
        )}
      </div>
      
      <div className="relative z-10 flex items-baseline gap-1">
        <div
          className="text-3xl font-bold tracking-tight text-slate-900 group-hover:translate-x-1 transition-transform"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
