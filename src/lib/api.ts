/* ──────────────────────────────────────────────
   API CLIENT — Typed fetch wrappers for the
   FastAPI backend. Uses NEXT_PUBLIC_API_URL env
   variable (defaults to localhost:8000).
   ────────────────────────────────────────────── */

const API_BASE =
  (typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:8000";

/* ── Generic fetch helper ── */
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${errBody}`);
  }
  return res.json() as Promise<T>;
}

/* ── Types ── */

export interface Player {
  name: string;
  lastNote: string | null;
  coachName: string;
}

export interface PlayerStats {
  sessions: number;
  attendance_pct: number;
  notes: number;
  streak: number;
}

export interface AttendanceRecord {
  date: string;
  present: boolean;
}

export interface CoachNote {
  id: string;
  playerName: string;
  coachName: string;
  coachUid: string;
  observation: string;
  diagnosis: string;
  recommendation: string;
  fileName: string;
  fileContent: string;
  timestamp: string | null;
}

export interface SessionLog {
  id: string;
  playerName: string;
  coachName: string;
  sessionNotes: string;
  sessionDate: string;
  attendance: string;
  drillsFocus: string;
  timestamp: string | null;
}

export interface AdminStats {
  total_users: number;
  coaches: number;
  players: number;
  admins: number;
  total_notes: number;
  total_academies: number;
  total_sessions: number;
}

export interface PlatformUser {
  uid: string;
  name: string;
  role: string;
  academy: string;
  status: string;
  created: string;
}

export interface Academy {
  id: string;
  name: string;
  city: string;
  plan: string;
  contact: string;
  status: string;
  created: string;
}

/* ── API Functions ── */

/** Health check */
export const checkHealth = () =>
  apiFetch<{ ok: boolean; message: string }>("/health");

/** List players (optionally by coach) */
export const getPlayers = (coachUid?: string) =>
  apiFetch<{ players: Player[]; count: number }>(
    `/players${coachUid ? `?coach_uid=${coachUid}` : ""}`
  );

/** Get player stats */
export const getPlayerStats = (playerName: string) =>
  apiFetch<PlayerStats>(
    `/player/stats?player_name=${encodeURIComponent(playerName)}`
  );

/** Get player attendance history */
export const getPlayerAttendance = (playerName: string) =>
  apiFetch<{ attendance: AttendanceRecord[]; count: number }>(
    `/player/attendance?player_name=${encodeURIComponent(playerName)}`
  );

/** Get coach notes */
export const getCoachNotes = (coachUid?: string, playerName?: string) => {
  const params = new URLSearchParams();
  if (coachUid) params.set("coach_uid", coachUid);
  if (playerName) params.set("player_name", playerName);
  const qs = params.toString();
  return apiFetch<{ notes: CoachNote[]; count: number }>(
    `/get_notes${qs ? `?${qs}` : ""}`
  );
};

/** Save a session log */
export const saveSession = (data: {
  coachUid: string;
  coachName: string;
  playerName: string;
  sessionNotes: string;
  sessionDate?: string;
  attendance?: string;
  drillsFocus?: string;
}) =>
  apiFetch<{ status: string; document_id: string }>("/save_session", {
    method: "POST",
    body: JSON.stringify(data),
  });

/** Get session logs */
export const getSessionLogs = (coachUid?: string, playerName?: string) => {
  const params = new URLSearchParams();
  if (coachUid) params.set("coach_uid", coachUid);
  if (playerName) params.set("player_name", playerName);
  const qs = params.toString();
  return apiFetch<{ logs: SessionLog[]; count: number }>(
    `/session_logs${qs ? `?${qs}` : ""}`
  );
};

/** Admin stats */
export const getAdminStats = () =>
  apiFetch<AdminStats>("/admin/stats");

/** List platform users */
export const getUsers = () =>
  apiFetch<{ users: PlatformUser[]; count: number }>("/admin/users");

/** Create platform user */
export const createUser = (data: {
  uid: string;
  name: string;
  role: string;
  academy?: string;
}) =>
  apiFetch<{ status: string; uid: string }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

/** Deactivate user */
export const deactivateUser = (uid: string) =>
  apiFetch<{ status: string; uid: string }>(
    `/admin/users/${uid}/deactivate`,
    { method: "PUT" }
  );

/** List academies */
export const getAcademies = () =>
  apiFetch<{ academies: Academy[]; count: number }>("/admin/academies");

/** Create academy */
export const createAcademy = (data: {
  name: string;
  city?: string;
  plan?: string;
  contact?: string;
}) =>
  apiFetch<{ status: string; id: string }>("/admin/academies", {
    method: "POST",
    body: JSON.stringify(data),
  });
