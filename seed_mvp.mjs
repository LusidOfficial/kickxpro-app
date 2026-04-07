/**
 * KickXPro MVP — Comprehensive Seed Script
 * 
 * Creates realistic test data:
 * - 3 Coaches
 * - 8 Players (spread across coaches)
 * - 2 Parents (linked to players)
 * - Sessions, evaluations, attendance, fees, messages, goals, ratings
 * 
 * Usage:
 *   node seed_mvp.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE URL or KEY in .env.local");
  process.exit(1);
}

// Use service role key for admin operations (user creation)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PASSWORD = "kickxpro123";

// ── USER DEFINITIONS ──
const COACHES = [
  { email: "coach.ramesh@kickxpro.test", name: "Coach Ramesh", position: null },
  { email: "coach.priya@kickxpro.test", name: "Coach Priya", position: null },
  { email: "coach.vikram@kickxpro.test", name: "Coach Vikram", position: null },
];

const PLAYERS = [
  { email: "arjun.mehta@kickxpro.test", name: "Arjun Mehta", position: "ST", age: 17, coachIdx: 0 },
  { email: "riya.sharma@kickxpro.test", name: "Riya Sharma", position: "MID", age: 16, coachIdx: 0 },
  { email: "dev.patel@kickxpro.test", name: "Dev Patel", position: "CB", age: 18, coachIdx: 0 },
  { email: "ananya.rao@kickxpro.test", name: "Ananya Rao", position: "LW", age: 15, coachIdx: 0 },
  { email: "ishaan.kumar@kickxpro.test", name: "Ishaan Kumar", position: "GK", age: 17, coachIdx: 1 },
  { email: "sneha.nair@kickxpro.test", name: "Sneha Nair", position: "RW", age: 16, coachIdx: 1 },
  { email: "rahul.verma@kickxpro.test", name: "Rahul Verma", position: "CM", age: 19, coachIdx: 1 },
  { email: "maya.desai@kickxpro.test", name: "Maya Desai", position: "FWD", age: 14, coachIdx: 2 },
];

const PARENTS = [
  { email: "parent.mehta@kickxpro.test", name: "Mr. Mehta", childIdx: 0 },
  { email: "parent.rao@kickxpro.test", name: "Mrs. Rao", childIdx: 3 },
];

// ── HELPERS ──
async function ensureUser(email, password) {
  // Try sign up first
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
  if (signUpData?.user) return signUpData.user.id;

  // If already exists, try to find by email in auth (only works with service role)
  // For local dev, we can try sign in
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInData?.user) return signInData.user.id;

  // Last resort: check profiles table
  const { data: profileData } = await supabase.from("profiles").select("id").eq("email", email).single();
  if (profileData) return profileData.id;

  console.warn(`⚠️  Could not create/find user: ${email} (${signUpErr?.message || signInErr?.message})`);
  return null;
}

async function upsertProfile(id, data) {
  const { error } = await supabase.from("profiles").upsert({ id, ...data });
  if (error) console.warn(`⚠️  Profile upsert failed for ${data.email}:`, error.message);
}

// ── MAIN ──
async function seed() {
  console.log("\n🌱 KickXPro MVP Seed Script\n");
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  // 1. CREATE COACHES
  console.log("──── Creating Coaches ────");
  const coachIds = [];
  for (const coach of COACHES) {
    const id = await ensureUser(coach.email, PASSWORD);
    if (id) {
      coachIds.push(id);
      await upsertProfile(id, {
        full_name: coach.name,
        email: coach.email,
        role: "coach",
        position: null,
        age: null,
        overall_score: 0,
        coach_id: null,
        academy_id: null,
      });
      console.log(`  ✅ ${coach.name} (${coach.email})`);
    } else {
      coachIds.push(null);
      console.log(`  ❌ ${coach.name} FAILED`);
    }
  }

  // 2. CREATE PLAYERS
  console.log("\n──── Creating Players ────");
  const playerIds = [];
  for (const player of PLAYERS) {
    const coachId = coachIds[player.coachIdx];
    const id = await ensureUser(player.email, PASSWORD);
    if (id) {
      playerIds.push(id);
      await upsertProfile(id, {
        full_name: player.name,
        email: player.email,
        role: "player",
        position: player.position,
        age: player.age,
        overall_score: Math.floor(Math.random() * 30) + 55,
        coach_id: coachId,
        academy_id: null,
      });
      console.log(`  ✅ ${player.name} → ${COACHES[player.coachIdx].name}`);
    } else {
      playerIds.push(null);
      console.log(`  ❌ ${player.name} FAILED`);
    }
  }

  // 3. CREATE PARENTS
  console.log("\n──── Creating Parents ────");
  for (const parent of PARENTS) {
    const childId = playerIds[parent.childIdx];
    const id = await ensureUser(parent.email, PASSWORD);
    if (id) {
      await upsertProfile(id, {
        full_name: parent.name,
        email: parent.email,
        role: "parent",
        position: null,
        age: null,
        overall_score: 0,
        coach_id: null,
        child_id: childId,
        academy_id: null,
      });
      console.log(`  ✅ ${parent.name} → child: ${PLAYERS[parent.childIdx].name}`);
    } else {
      console.log(`  ❌ ${parent.name} FAILED`);
    }
  }

  // 4. CREATE SESSIONS (for Coach Ramesh)
  console.log("\n──── Creating Sessions ────");
  const coach0 = coachIds[0];
  if (!coach0) {
    console.log("  ⚠️ Skipping sessions — Coach Ramesh not created");
  } else {
    const sessionDefs = [
      { title: "Training — Mon, Apr 1", type: "training", date: "2026-04-01", start: "17:30:00", dur: 60 },
      { title: "Tactical — Wed, Apr 3", type: "tactical", date: "2026-04-03", start: "18:00:00", dur: 90 },
      { title: "Fitness — Fri, Apr 5", type: "fitness", date: "2026-04-05", start: "06:00:00", dur: 45 },
      { title: "Match Day — Sat, Apr 6", type: "match_day", date: "2026-04-06", start: "15:00:00", dur: 90 },
      { title: "Recovery — Sun, Apr 7", type: "recovery", date: "2026-04-07", start: "09:00:00", dur: 30 },
    ];

    const sessionIds = [];
    for (const s of sessionDefs) {
      const { data, error } = await supabase.from("sessions").upsert({
        coach_id: coach0,
        title: s.title,
        session_type: s.type,
        session_date: s.date,
        start_time: s.start,
        duration_mins: s.dur,
        notes: `${s.type.replace("_", " ")} session with focus drills. 4P/0L/0A.`,
      }, { onConflict: "coach_id,title" }).select("id").single();

      if (data) {
        sessionIds.push(data.id);
        console.log(`  ✅ ${s.title}`);
      } else {
        // If upsert failed due to no unique constraint, try insert
        const { data: insertData, error: insertErr } = await supabase.from("sessions").insert({
          coach_id: coach0,
          title: s.title,
          session_type: s.type,
          session_date: s.date,
          start_time: s.start,
          duration_mins: s.dur,
          notes: `${s.type.replace("_", " ")} session.`,
        }).select("id").single();
        
        if (insertData) {
          sessionIds.push(insertData.id);
          console.log(`  ✅ ${s.title} (inserted)`);
        } else {
          sessionIds.push(null);
          console.log(`  ⚠️ ${s.title} — ${insertErr?.message || error?.message}`);
        }
      }
    }

    // 5. ATTENDANCE LOGS
    console.log("\n──── Creating Attendance Logs ────");
    const coach0Players = playerIds.slice(0, 4).filter(Boolean);
    let attCount = 0;
    for (const sessionId of sessionIds.filter(Boolean)) {
      for (const playerId of coach0Players) {
        const status = Math.random() > 0.15 ? "Present" : Math.random() > 0.5 ? "Late" : "Absent";
        const { error } = await supabase.from("attendance_logs").upsert({
          session_id: sessionId,
          player_id: playerId,
          status,
          marked_by: coach0,
          marked_at: new Date().toISOString(),
        }, { onConflict: "session_id,player_id" });
        if (!error) attCount++;
      }
    }
    console.log(`  ✅ ${attCount} attendance records`);

    // 6. EVALUATIONS
    console.log("\n──── Creating Evaluations ────");
    let evalCount = 0;
    for (const sessionId of sessionIds.slice(0, 3).filter(Boolean)) {
      for (const playerId of coach0Players) {
        const scores = {
          pace: Math.floor(Math.random() * 30) + 55,
          shooting: Math.floor(Math.random() * 30) + 50,
          passing: Math.floor(Math.random() * 25) + 60,
          dribbling: Math.floor(Math.random() * 30) + 55,
          defending: Math.floor(Math.random() * 30) + 45,
          physical: Math.floor(Math.random() * 25) + 55,
        };
        const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6);
        const strengths = ["Vision", "Work Rate", "First Touch"].slice(0, Math.floor(Math.random() * 3) + 1);
        const focusAreas = ["Weak Foot", "Positioning", "Stamina"].slice(0, Math.floor(Math.random() * 2) + 1);
        const badges = ["Rising Star", "Iron Wall", "Playmaker", "Goal Machine", null];
        const badge = avgScore > 70 ? badges[Math.floor(Math.random() * 4)] : null;

        const { error } = await supabase.from("evaluations").insert({
          session_id: sessionId,
          player_id: playerId,
          coach_id: coach0,
          scores,
          overall_score: avgScore,
          strengths,
          focus_areas: focusAreas,
          summary: `Solid performance. ${strengths[0] || "Work Rate"} stood out. Needs work on ${focusAreas[0] || "consistency"}.`,
          badge_awarded: badge,
        });
        if (!error) evalCount++;
      }
    }
    console.log(`  ✅ ${evalCount} evaluations`);

    // 7. GOALS
    console.log("\n──── Creating Goals ────");
    const goalDefs = [
      { title: "Score 5 goals this month", category: "Shooting", status: "in_progress" },
      { title: "90% pass accuracy in training", category: "Passing", status: "not_started" },
      { title: "Complete 30km running this week", category: "Fitness", status: "achieved" },
      { title: "Lead warm-up for 3 sessions", category: "Leadership", status: "in_progress" },
    ];
    let goalCount = 0;
    for (const playerId of coach0Players) {
      for (const g of goalDefs.slice(0, Math.floor(Math.random() * 3) + 2)) {
        const { error } = await supabase.from("goals").insert({
          player_id: playerId,
          coach_id: coach0,
          title: g.title,
          category: g.category,
          status: g.status,
          description: `Focus on ${g.category.toLowerCase()} improvement.`,
        });
        if (!error) goalCount++;
      }
    }
    console.log(`  ✅ ${goalCount} goals`);

    // 8. MESSAGES
    console.log("\n──── Creating Messages ────");
    const msgTemplates = [
      "Great effort today! Keep pushing your limits 💪",
      "Remember to stretch before tomorrow's session.",
      "Your passing has improved significantly this week!",
      "Can we schedule an extra practice on Friday?",
      "Thanks Coach! I'll work on my weak foot this week.",
      "Don't forget to bring your shin guards tomorrow!",
    ];
    let msgCount = 0;
    for (let i = 0; i < coach0Players.length; i++) {
      const playerId = coach0Players[i];
      // Coach → Player messages
      for (let j = 0; j < 2; j++) {
        const { error } = await supabase.from("messages").insert({
          sender_id: coach0,
          receiver_id: playerId,
          content: msgTemplates[(i * 2 + j) % msgTemplates.length],
          read_status: j === 0,
        });
        if (!error) msgCount++;
      }
      // Player → Coach message
      const { error } = await supabase.from("messages").insert({
        sender_id: playerId,
        receiver_id: coach0,
        content: msgTemplates[(i + 4) % msgTemplates.length],
        read_status: false,
      });
      if (!error) msgCount++;
    }
    console.log(`  ✅ ${msgCount} messages`);

    // 9. FEES
    console.log("\n──── Creating Fees ────");
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    let feeCount = 0;
    for (const playerId of coach0Players) {
      // Last month — all paid
      const { error: e1 } = await supabase.from("fees").upsert({
        player_id: playerId,
        coach_id: coach0,
        amount: 2000,
        month: lastMonth,
        status: "Paid",
        paid_at: new Date().toISOString(),
      }, { onConflict: "player_id,month" });
      if (!e1) feeCount++;

      // This month — some paid, some pending
      const status = Math.random() > 0.5 ? "Paid" : "Pending";
      const { error: e2 } = await supabase.from("fees").upsert({
        player_id: playerId,
        coach_id: coach0,
        amount: 2000,
        month: currentMonth,
        status,
        paid_at: status === "Paid" ? new Date().toISOString() : null,
      }, { onConflict: "player_id,month" });
      if (!e2) feeCount++;
    }
    console.log(`  ✅ ${feeCount} fee records`);

    // 10. COACH RATINGS
    console.log("\n──── Creating Coach Ratings ────");
    let ratingCount = 0;
    for (const playerId of coach0Players) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
      const tags = ["Motivating", "Technical", "Patient"].slice(0, Math.floor(Math.random() * 3) + 1);
      const { error } = await supabase.from("coach_ratings").upsert({
        coach_id: coach0,
        player_id: playerId,
        rating,
        tags,
      }, { onConflict: "coach_id,player_id" });
      if (!error) ratingCount++;
    }
    console.log(`  ✅ ${ratingCount} coach ratings`);
  }

  // Summary
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║  🎉 Seed Complete!                    ║");
  console.log("╠═══════════════════════════════════════╣");
  console.log("║  All users password: kickxpro123      ║");
  console.log("║                                       ║");
  console.log("║  Coach logins:                        ║");
  for (const c of COACHES) {
    console.log(`║  • ${c.email.padEnd(37)}║`);
  }
  console.log("║                                       ║");
  console.log("║  Player logins:                       ║");
  for (const p of PLAYERS.slice(0, 4)) {
    console.log(`║  • ${p.email.padEnd(37)}║`);
  }
  console.log("║                                       ║");
  console.log("║  Parent logins:                       ║");
  for (const p of PARENTS) {
    console.log(`║  • ${p.email.padEnd(37)}║`);
  }
  console.log("╚═══════════════════════════════════════╝");

  // Sign out
  await supabase.auth.signOut();
}

seed().catch(console.error);
