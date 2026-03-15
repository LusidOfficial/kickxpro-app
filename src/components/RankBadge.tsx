/* ──────────────────────────────────────────────
   RANK BADGE — Bronze / Silver / Gold animated
   badge based on player improvement rate.
   ────────────────────────────────────────────── */

import { getRankTier } from "@/lib/constants";
import { IconAward } from "./Icons";

interface RankBadgeProps {
  /** Average skill score (0-5) */
  avgScore: number;
}

export default function RankBadge({ avgScore }: RankBadgeProps) {
  const tier = getRankTier(avgScore);

  return (
    <div
      className="card-static p-5 flex items-center gap-4"
    >
      {/* Badge icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          background: tier.bgColor,
          border: `1px solid ${tier.borderColor}`,
          boxShadow: `0 0 20px ${tier.bgColor}`,
        }}
      >
        <IconAward size={28} color={tier.color} />
      </div>

      {/* Info */}
      <div>
        <div
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)", color: tier.color }}
        >
          {tier.label} Tier
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Based on improvement rate
        </div>
      </div>
    </div>
  );
}
