/**
 * KickXPro MVP — Seed Script (CommonJS compatible)
 * 
 * Usage: node seed_mvp.js
 * 
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local
 */

const fs = require("fs");
const path = require("path");

// Parse .env.local manually
const envPath = path.join(__dirname, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  const idx = line.indexOf("=");
  if (idx > 0 && !line.startsWith("#")) {
    envVars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE URL or KEY in .env.local");
  process.exit(1);
}

// Dynamic import for ESM supabase
async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const PASSWORD = "kickxpro123";

  const COACHES = [
    { email: "coach.ramesh@kickxpro.test", name: "Coach Ramesh" },
    { email: "coach.priya@kickxpro.test", name: "Coach Priya" },
  ];

  const PLAYERS = [
    { email: "arjun.mehta@kickxpro.test", name: "Arjun Mehta", position: "ST", age: 17, coachIdx: 0 },
    { email: "riya.sharma@kickxpro.test", name: "Riya Sharma", position: "MID", age: 16, coachIdx: 0 },
    { email: "dev.patel@kickxpro.test", name: "Dev Patel", position: "CB", age: 18, coachIdx: 0 },
    { email: "ananya.rao@kickxpro.test", name: "Ananya Rao", position: "LW", age: 15, coachIdx: 0 },
    { email: "ishaan.kumar@kickxpro.test", name: "Ishaan Kumar", position: "GK", age: 17, coachIdx: 1 },
    { email: "sneha.nair@kickxpro.test", name: "Sneha Nair", position: "RW", age: 16, coachIdx: 1 },
  ];

  const PARENTS = [
    { email: "parent.mehta@kickxpro.test", name: "Mr. Mehta", childIdx: 0 },
  ];

  async function ensureUser(email, password) {
    const { data: signUpData } = await supabase.auth.signUp({ email, password });
    if (signUpData?.user) return signUpData.user.id;
    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
    if (signInData?.user) return signInData.user.id;
    const { data: profileData } = await supabase.from("profiles").select("id").eq("email", email).single();
    if (profileData) return profileData.id;
    return null;
  }

  console.log("\n🌱 KickXPro MVP Seed Script\n");
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  // 1. COACHES
  console.log("── Creating Coaches ──");
  const coachIds = [];
  for (const coach of COACHES) {
    const id = await ensureUser(coach.email, PASSWORD);
    if (id) {
      coachIds.push(id);
      await supabase.from("profiles").upsert({ id, full_name: coach.name, email: coach.email, role: "coach" });
      console.log(`  ✅ ${coach.name} (${coach.email})`);
    } else {
      coachIds.push(null);
      console.log(`  ❌ ${coach.name} FAILED`);
    }
  }

  // 2. PLAYERS
  console.log("\n── Creating Players ──");
  const playerIds = [];
  for (const player of PLAYERS) {
    const coachId = coachIds[player.coachIdx];
    const id = await ensureUser(player.email, PASSWORD);
    if (id) {
      playerIds.push(id);
      await supabase.from("profiles").upsert({
        id, full_name: player.name, email: player.email, role: "player",
        position: player.position, age: player.age,
        overall_score: Math.floor(Math.random() * 30) + 55,
        coach_id: coachId,
      });
      console.log(`  ✅ ${player.name} → ${COACHES[player.coachIdx].name}`);
    } else {
      playerIds.push(null);
      console.log(`  ❌ ${player.name} FAILED`);
    }
  }

  // 3. PARENTS
  console.log("\n── Creating Parents ──");
  for (const parent of PARENTS) {
    const childId = playerIds[parent.childIdx];
    const id = await ensureUser(parent.email, PASSWORD);
    if (id) {
      await supabase.from("profiles").upsert({
        id, full_name: parent.name, email: parent.email, role: "parent", child_id: childId,
      });
      console.log(`  ✅ ${parent.name} → child: ${PLAYERS[parent.childIdx].name}`);
    }
  }

  const coach0 = coachIds[0];
  const coach0Players = playerIds.slice(0, 4).filter(Boolean);

  if (coach0 && coach0Players.length > 0) {
    // 4. SESSIONS
    console.log("\n── Creating Sessions ──");
    const sessionDefs = [
      { title: "Training — Mon Apr 1", type: "training", date: "2026-04-01", start: "17:30:00", dur: 60 },
      { title: "Tactical — Wed Apr 3", type: "tactical", date: "2026-04-03", start: "18:00:00", dur: 90 },
      { title: "Fitness — Fri Apr 5", type: "fitness", date: "2026-04-05", start: "06:00:00", dur: 45 },
      { title: "Match Day — Sat Apr 6", type: "match_day", date: "2026-04-06", start: "15:00:00", dur: 90 },
      { title: "Training — Mon Apr 8", type: "training", date: "2026-04-08", start: "17:30:00", dur: 60 },
      { title: "Tactical — Wed Apr 9", type: "tactical", date: "2026-04-09", start: "18:00:00", dur: 75 },
      { title: "Fitness — Fri Apr 11", type: "fitness", date: "2026-04-11", start: "06:30:00", dur: 45 },
    ];

    const sessionIds = [];
    for (const s of sessionDefs) {
      const { data, error } = await supabase.from("sessions").insert({
        coach_id: coach0, title: s.title, session_type: s.type,
        session_date: s.date, start_time: s.start, duration_mins: s.dur,
        notes: `${s.type} session with drills and conditioning.`,
      }).select("id").single();
      if (data) { sessionIds.push(data.id); console.log(`  ✅ ${s.title}`); }
      else { sessionIds.push(null); console.log(`  ⚠️ ${s.title} — ${error?.message}`); }
    }

    // 5. ATTENDANCE
    console.log("\n── Creating Attendance ──");
    let attCount = 0;
    for (const sessionId of sessionIds.filter(Boolean)) {
      for (const playerId of coach0Players) {
        const status = Math.random() > 0.15 ? "Present" : Math.random() > 0.5 ? "Late" : "Absent";
        const { error } = await supabase.from("attendance_logs").upsert({
          session_id: sessionId, player_id: playerId, status, marked_by: coach0,
        }, { onConflict: "session_id,player_id" });
        if (!error) attCount++;
      }
    }
    console.log(`  ✅ ${attCount} attendance records`);

    // 6. EVALUATIONS
    console.log("\n── Creating Evaluations ──");
    let evalCount = 0;
    for (const sessionId of sessionIds.slice(0, 4).filter(Boolean)) {
      for (const playerId of coach0Players) {
        const scores = {
          pace: 55 + Math.floor(Math.random() * 30),
          shooting: 50 + Math.floor(Math.random() * 30),
          passing: 60 + Math.floor(Math.random() * 25),
          dribbling: 55 + Math.floor(Math.random() * 30),
          defending: 45 + Math.floor(Math.random() * 30),
          physical: 55 + Math.floor(Math.random() * 25),
        };
        const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6);
        const badges = ["Rising Star", "Iron Wall", "Playmaker", "Goal Machine", null];
        const { error } = await supabase.from("evaluations").insert({
          session_id: sessionId, player_id: playerId, coach_id: coach0, scores,
          overall_score: avg,
          strengths: ["Vision", "Work Rate", "First Touch"].slice(0, 1 + Math.floor(Math.random() * 2)),
          focus_areas: ["Weak Foot", "Positioning"].slice(0, 1 + Math.floor(Math.random() * 1)),
          summary: `Solid performance overall. Score: ${avg}. Keep pushing.`,
          badge_awarded: avg > 70 ? badges[Math.floor(Math.random() * 4)] : null,
        });
        if (!error) evalCount++;
      }
    }
    console.log(`  ✅ ${evalCount} evaluations`);

    // 7. GOALS
    console.log("\n── Creating Goals ──");
    const goalDefs = [
      { title: "Score 5 goals this month", category: "Shooting", status: "in_progress" },
      { title: "90% pass accuracy", category: "Passing", status: "not_started" },
      { title: "30km running this week", category: "Fitness", status: "achieved" },
    ];
    let goalCount = 0;
    for (const playerId of coach0Players) {
      for (const g of goalDefs.slice(0, 2 + Math.floor(Math.random() * 2))) {
        const { error } = await supabase.from("goals").insert({
          player_id: playerId, coach_id: coach0, title: g.title, category: g.category, status: g.status,
        });
        if (!error) goalCount++;
      }
    }
    console.log(`  ✅ ${goalCount} goals`);

    // 8. MESSAGES
    console.log("\n── Creating Messages ──");
    const msgs = [
      "Great effort today! Keep pushing 💪",
      "Remember to stretch before tomorrow.",
      "Your passing improved significantly!",
      "Thanks Coach! Working on weak foot.",
    ];
    let msgCount = 0;
    for (let i = 0; i < coach0Players.length; i++) {
      for (let j = 0; j < 2; j++) {
        await supabase.from("messages").insert({ sender_id: coach0, receiver_id: coach0Players[i], content: msgs[(i + j) % msgs.length], read_status: j === 0 });
        msgCount++;
      }
      await supabase.from("messages").insert({ sender_id: coach0Players[i], receiver_id: coach0, content: msgs[3], read_status: false });
      msgCount++;
    }
    console.log(`  ✅ ${msgCount} messages`);

    // 9. FEES
    console.log("\n── Creating Fees ──");
    const currentMonth = new Date().toISOString().slice(0, 7);
    let feeCount = 0;
    for (const playerId of coach0Players) {
      const status = Math.random() > 0.5 ? "Paid" : "Pending";
      const { error } = await supabase.from("fees").upsert({
        player_id: playerId, coach_id: coach0, amount: 2000, month: currentMonth, status,
        paid_at: status === "Paid" ? new Date().toISOString() : null,
      }, { onConflict: "player_id,month" });
      if (!error) feeCount++;
    }
    console.log(`  ✅ ${feeCount} fee records`);

    // 10. COACH RATINGS
    console.log("\n── Creating Ratings ──");
    let ratingCount = 0;
    for (const playerId of coach0Players) {
      const { error } = await supabase.from("coach_ratings").upsert({
        coach_id: coach0, player_id: playerId, rating: 4 + Math.floor(Math.random() * 2),
        tags: ["Motivating", "Technical"].slice(0, 1 + Math.floor(Math.random() * 2)),
      }, { onConflict: "coach_id,player_id" });
      if (!error) ratingCount++;
    }
    console.log(`  ✅ ${ratingCount} ratings`);

    // 11. EVENTS
    console.log("\n── Creating Events ──");
    const eventDefs = [
      { title: "Inter-Academy U16 Cup", type: "tournament", date: "2026-04-20", location: "Central Stadium" },
      { title: "Friendly vs. City FC", type: "friendly", date: "2026-04-15", location: "Home Ground" },
      { title: "Open Trial Day", type: "trial", date: "2026-04-25", location: "Academy Ground" },
    ];
    let eventCount = 0;
    for (const ev of eventDefs) {
      const { error } = await supabase.from("events").insert({
        coach_id: coach0, title: ev.title, event_type: ev.type, event_date: ev.date, location: ev.location,
        description: `Scheduled ${ev.type} event at ${ev.location}.`,
      });
      if (!error) eventCount++;
    }
    console.log(`  ✅ ${eventCount} events`);
  }

  // Summary
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║  🎉 Seed Complete!                    ║");
  console.log("╠═══════════════════════════════════════╣");
  console.log("║  All users password: kickxpro123      ║");
  console.log("║                                       ║");
  console.log("║  Coach:  coach.ramesh@kickxpro.test   ║");
  console.log("║  Player: arjun.mehta@kickxpro.test    ║");
  console.log("║  Parent: parent.mehta@kickxpro.test   ║");
  console.log("╚═══════════════════════════════════════╝\n");

  await supabase.auth.signOut();
}

main().catch(console.error);
