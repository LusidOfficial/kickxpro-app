/* ──────────────────────────────────────────────
   RANK BADGE — Bronze / Silver / Gold animated
   badge based on player improvement rate.
   ────────────────────────────────────────────── */

import { RANK_TIERS, PlayerTier } from "@/lib/constants";
import { IconAward } from "./Icons";

interface RankBadgeProps {
  /** Average skill score (0-100 scale) */
  avgScore: number;
  /** The explicit tier from the player's profile */
  tier?: PlayerTier;
}

export default function RankBadge({ avgScore, tier = "Beginner" }: RankBadgeProps) {
  const tierData = RANK_TIERS[tier] || RANK_TIERS.Beginner;

  return (
    <div
      className="card-static p-5 flex items-center gap-4"
    >
      {/* Badge icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          background: tierData.bgColor,
          border: `1px solid ${tierData.borderColor}`,
          boxShadow: `0 0 20px ${tierData.bgColor}`,
        }}
      >
        <IconAward size={28} color={tierData.color} />
      </div>

      {/* Info */}
      <div>
        <div
          className="text-lg font-bold flex items-center gap-2"
          style={{ fontFamily: "var(--font-heading)", color: tierData.color }}
        >
          {tier} Tier
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Rating: <strong style={{ color: tierData.color }}>{(avgScore / 10).toFixed(1)}/10</strong>
        </div>
      </div>
    </div>
  );
}
