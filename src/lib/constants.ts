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

/** Session types with brand colors */
export const SESSION_TYPES = [
  { key: "training", label: "Training", color: "#10B981" },
  { key: "tactical", label: "Tactical", color: "#8B5CF6" },
  { key: "match_day", label: "Match Day", color: "#EF4444" },
  { key: "fitness", label: "Fitness", color: "#F59E0B" },
  { key: "recovery", label: "Recovery", color: "#06B6D4" },
];

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
export const RANK_TIERS = {
  Beginner: { color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.25)" },
  Intermediate: { color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.25)" },
  Advanced: { color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)", borderColor: "rgba(139, 92, 246, 0.25)" },
  Elite: { color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.25)" },
  Pro: { color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.25)" },
} as const;

export type PlayerTier = keyof typeof RANK_TIERS;

/** Navigation items for each portal */
export const NAV_ITEMS = {
  coach: [
    { href: "/coach", label: "Dashboard", icon: "grid" },
    { href: "/coach/students", label: "My Students", icon: "users" },
    { href: "/coach/attendance", label: "Attendance", icon: "clipboard" },
    { href: "/coach/evaluate", label: "Evaluate", icon: "target" },
    { href: "/coach/messages", label: "Messages", icon: "message-square" },
    { href: "/coach/events", label: "Events", icon: "calendar" },
    { href: "/coach/ai-assistant", label: "AI Assistant", icon: "zap" },
    { href: "/coach/wallet", label: "Wallet", icon: "wallet" },
    { href: "/marketplace", label: "Marketplace", icon: "shopping-bag" },
  ],
  coachClassic: [
    { href: "/coach", label: "Dashboard", icon: "grid" },
    { href: "/coach/squad", label: "Squad", icon: "shield" },
    { href: "/coach/sessions", label: "Sessions", icon: "timer" },
    { href: "/coach/roster", label: "Roster", icon: "users" },
    { href: "/coach/evaluate", label: "Evaluate", icon: "clipboard" },
    { href: "/coach/messages", label: "Messages", icon: "message-square" },
    { href: "/coach/events", label: "Events", icon: "calendar" },
    { href: "/coach/ai-assistant", label: "AI Assistant", icon: "zap" },
    { href: "/coach/wallet", label: "Wallet", icon: "wallet" },
    { href: "/marketplace", label: "Marketplace", icon: "shopping-bag" },
  ],
  player: [
    { href: "/player", label: "Dashboard", icon: "grid" },
    { href: "/player/progress", label: "My Progress", icon: "trending-up" },
    { href: "/player/schedule", label: "Schedule", icon: "calendar" },
    { href: "/player/leaderboard", label: "Leaderboard", icon: "award" },
    { href: "/player/report-card", label: "Report Card", icon: "bar-chart" },
    { href: "/player/messages", label: "Messages", icon: "message-square" },
    { href: "/player/events", label: "Events", icon: "calendar" },
    { href: "/player/ai-assistant", label: "AI Assistant", icon: "zap" },
    { href: "/marketplace", label: "Marketplace", icon: "shopping-bag" },
  ],
  playerClassic: [
    { href: "/player", label: "Dashboard", icon: "grid" },
    { href: "/player/discipline", label: "Discipline", icon: "activity" },
    { href: "/player/match-iq", label: "Match IQ", icon: "target" },
    { href: "/player/messages", label: "Messages", icon: "message-square" },
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
