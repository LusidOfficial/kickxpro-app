/* ──────────────────────────────────────────────
   CONSTANTS — Skill metrics (1-99 scale),
   trait chips, session types, coach tags,
   and navigation configuration.
   ────────────────────────────────────────────── */

/** Skill metrics — coaches rate players 1-99 (FIFA-style) */
export const SKILL_METRICS = [
  { key: "pace", label: "Pace", short: "PAC" },
  { key: "shooting", label: "Shooting", short: "SHO" },
  { key: "passing", label: "Passing", short: "PAS" },
  { key: "dribbling", label: "Dribbling", short: "DRI" },
  { key: "defending", label: "Defending", short: "DEF" },
  { key: "physical", label: "Physical", short: "PHY" },
] as const;

export type SkillKey = (typeof SKILL_METRICS)[number]["key"];

/** Default skill values for new evaluations */
export const DEFAULT_SKILLS: Record<string, number> = {
  pace: 65,
  shooting: 60,
  passing: 70,
  dribbling: 68,
  defending: 55,
  physical: 62,
};

/** Notable strength traits — coach tags during evaluation */
export const STRENGTH_TRAITS = [
  "Vision", "Work Rate", "First Touch", "Finishing",
  "Composure", "Leadership", "Acceleration", "Aerial Ability",
  "Long Passing", "Ball Control",
] as const;

/** Development focus traits — areas needing improvement */
export const FOCUS_TRAITS = [
  "Weak Foot", "Stamina", "Positioning", "Decision Making",
  "Aerial Duels", "Tracking Back", "Off-ball Movement", "Set Pieces",
  "Defensive Awareness", "Crossing",
] as const;

/** Session types */
export const SESSION_TYPES = [
  { key: "training", label: "Training", color: "#60A5FA" },
  { key: "match", label: "Match Day", color: "#00C853" },
  { key: "fitness", label: "Fitness", color: "#F59E0B" },
  { key: "tactical", label: "Tactical", color: "#A78BFA" },
] as const;

/** Duration presets in minutes */
export const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

/** Coach rating tags (used by players to rate coaches) */
export const COACH_TAGS = [
  "Motivating", "Technical", "Patient", "Disciplined",
  "Innovative", "Supportive", "Communicative", "Strategic",
] as const;

/** Attendance statuses */
export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
} as const;

export type AttendanceStatusType =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

/** Player rank tiers */
export const RANK_TIERS = [
  {
    key: "bronze",
    label: "Bronze",
    minScore: 0,
    color: "#CD7F32",
    bgColor: "rgba(205, 127, 50, 0.1)",
    borderColor: "rgba(205, 127, 50, 0.25)",
  },
  {
    key: "silver",
    label: "Silver",
    minScore: 50,
    color: "#C0C0C0",
    bgColor: "rgba(192, 192, 192, 0.1)",
    borderColor: "rgba(192, 192, 192, 0.25)",
  },
  {
    key: "gold",
    label: "Gold",
    minScore: 75,
    color: "#FFD700",
    bgColor: "rgba(255, 215, 0, 0.1)",
    borderColor: "rgba(255, 215, 0, 0.25)",
  },
] as const;

export function getRankTier(avgScore: number) {
  const sorted = [...RANK_TIERS].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((tier) => avgScore >= tier.minScore) || RANK_TIERS[0];
}

/** Navigation items for each portal */
export const NAV_ITEMS = {
  coach: [
    { href: "/coach", label: "Dashboard", icon: "grid" },
    { href: "/coach/sessions", label: "Sessions", icon: "timer" },
    { href: "/coach/roster", label: "Roster", icon: "users" },
    { href: "/coach/evaluate", label: "Evaluate", icon: "clipboard" },
    { href: "/coach/match-iq", label: "Match IQ", icon: "target" },
  ],
  player: [
    { href: "/player", label: "Dashboard", icon: "grid" },
    { href: "/player/match-iq", label: "Match IQ", icon: "target" },
    { href: "/player/discipline", label: "Discipline", icon: "activity" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: "grid" },
    { href: "/admin/tournaments", label: "Tournaments", icon: "users" },
  ],
} as const;

/** Pre-written focus tips (kept for quick-pick in report) */
export const FOCUS_TIPS = [
  "Work on weaker foot accuracy",
  "Improve off-the-ball movement",
  "Practice 1v1 defending scenarios",
  "Focus on quick passing combinations",
  "Build stamina with interval training",
  "Develop awareness of space",
  "Practice set-piece delivery",
  "Work on communication during play",
  "Improve decision-making under pressure",
  "Focus on finishing from inside the box",
] as const;
