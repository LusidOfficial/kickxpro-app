import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('Seeding Database...');

  // 1. Create Coach
  const { data: coachData, error: coachErr } = await supabase.auth.signUp({
    email: 'coach@kickxpro.com',
    password: 'password123',
  });
  if (coachErr && !coachErr.message.includes('already registered')) console.error('Coach Auth Error:', coachErr);
  
  // Login to get session for coach
  const { data: coachSession } = await supabase.auth.signInWithPassword({
    email: 'coach@kickxpro.com',
    password: 'password123',
  });
  const coachId = coachSession?.user?.id;

  if (coachId) {
    // Attempt to update profile
    const { error: pErr1 } = await supabase.from('profiles').upsert({
      id: coachId,
      full_name: 'Coach Anita',
      role: 'coach',
      academy_id: 'ACADEMY_KICKX'
    });
    if (pErr1) console.error('Coach Profile Error:', pErr1);
  } else {
    console.error("Could not obtain coach ID.");
    return;
  }

  // 1b. Create a Default Squad for the Coach
  const { data: teamData, error: teamErr } = await supabase.from('teams').insert({
    coach_id: coachId,
    name: 'Elite U-17 Squad',
    age_group: 'U-17',
    level: 'Advanced'
  }).select().single();
  
  if (teamErr) console.error('Team Creation Error:', teamErr);
  const teamId = teamData?.id;

  // 2. Create Player
  const { data: playerData, error: playerErr } = await supabase.auth.signUp({
    email: 'player@kickxpro.com',
    password: 'password123',
  });
  if (playerErr && !playerErr.message.includes('already registered')) console.error('Player Auth Error:', playerErr);

  const { data: playerSession } = await supabase.auth.signInWithPassword({
    email: 'player@kickxpro.com',
    password: 'password123',
  });
  const playerId = playerSession?.user?.id;

  if (playerId) {
    // We need to use service_role to bypass RLS for inserting another user's profile if we are currently logged in as coach, or just let them login and upsert. Let's do it while logged in as player.
    const { error: pErr2 } = await supabase.from('profiles').upsert({
      id: playerId,
      full_name: 'Arjun M.',
      role: 'player',
      position: 'ST',
      age: 18,
      overall_score: 72,
      academy_id: 'ACADEMY_KICKX',
      coach_id: coachId
    });
    if (pErr2) console.error('Player Profile Error:', pErr2);
    
    // 2b. Assign Player to Team
    if (teamId) {
        const { error: tpErr } = await supabase.from('team_players').insert({
            team_id: teamId,
            player_id: playerId
        });
        if (tpErr) console.error('Team Player Assignment Error:', tpErr);
    }
  } else {
    console.error("Could not obtain player ID.");
  }

  // Re-login as coach to create sessions and evaluations
  await supabase.auth.signInWithPassword({
    email: 'coach@kickxpro.com',
    password: 'password123',
  });

  // 3. Create Session
  const { data: sessionData, error: sErr } = await supabase.from('sessions').insert({
    coach_id: coachId,
    title: 'Attacking Drills',
    session_type: 'Training',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '16:00:00',
    duration_mins: 90,
    notes: 'Focus on finishing'
  }).select().single();
  
  if (sErr) {
    console.error('Session Error:', sErr);
  } else {
    console.log('Session inserted:', sessionData.id);
    
    // 4. Create Evaluation for Player
    if (playerId) {
      const { error: evErr } = await supabase.from('evaluations').insert({
        session_id: sessionData.id,
        player_id: playerId,
        coach_id: coachId,
        scores: { pace: 80, shooting: 75, passing: 65, effort: 90 },
        strengths: ["Pace", "Finishing"],
        focus_areas: ["Left foot", "Hold up play"],
        summary: "Good effort today, keep working on weak foot passing."
      });
      if (evErr) console.error('Evaluation Error:', evErr);
      else console.log('Evaluation inserted for player');
    }
  }

  console.log('Seed Complete');
}

seed();
