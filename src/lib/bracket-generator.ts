export interface Team {
  id: string;
  name: string;
  seed?: number;
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  team1: Team | null;
  team2: Team | null;
  score1: number | null;
  score2: number | null;
  winner: Team | null;
  nextMatchId: string | null;
}

export function generateBracket(teams: Team[]): Match[] {
  // Shuffle teams for random seeding if seeds are not provided
  const shuffled = [...teams].sort((a, b) => (a.seed || Math.random()) - (b.seed || Math.random()));
  
  // Calculate next power of 2 for bracket size (e.g., 4, 8, 16)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  
  // Create byes (null teams) for the remaining slots
  const byesNeeded = bracketSize - shuffled.length;
  const bracketTeams: (Team | null)[] = [...shuffled];
  for (let i = 0; i < byesNeeded; i++) {
    bracketTeams.push(null);
  }

  const matches: Match[] = [];
  const totalRounds = Math.log2(bracketSize);
  let matchIdCounter = 1;

  // Generate matches round by round
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    
    for (let matchNumber = 1; matchNumber <= matchesInRound; matchNumber++) {
      const matchId = `r${round}_m${matchNumber}`;
      
      // Calculate next match ID
      const nextMatchId = round < totalRounds 
        ? `r${round + 1}_m${Math.ceil(matchNumber / 2)}` 
        : null;

      let team1: Team | null = null;
      let team2: Team | null = null;
      
      // If round 1, assign teams from our bracketTeams array
      if (round === 1) {
        // Standard seeding pattern logic could go here
        // For simplicity, we pair them sequentially (0 vs 1, 2 vs 3)
        team1 = bracketTeams[(matchNumber - 1) * 2] || null;
        team2 = bracketTeams[(matchNumber - 1) * 2 + 1] || null;
      }

      const match: Match = {
        id: matchId,
        round,
        matchNumber,
        team1,
        team2,
        score1: null,
        score2: null,
        winner: null,
        nextMatchId,
      };

      // Auto-advance if one team is a bye (null)
      if (round === 1) {
        if (team1 && !team2) {
          match.winner = team1;
        } else if (!team1 && team2) {
          match.winner = team2;
        }
      }

      matches.push(match);
    }
  }

  return matches;
}
