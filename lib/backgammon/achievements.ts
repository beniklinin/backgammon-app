import type { GameRecord, Profile } from "@/lib/supabase/types";

export type AchievementId =
  | "firstWin"
  | "tenGames"
  | "fiftyGames"
  | "streak3"
  | "streak5"
  | "gammonWin"
  | "backgammonWin"
  | "rating1200"
  | "rating1400";

export interface Achievement {
  id: AchievementId;
  icon: string;
  unlocked: boolean;
  /** Current progress and target, for achievements that track a count. */
  current: number;
  target: number;
}

const ICONS: Record<AchievementId, string> = {
  firstWin: "🥇",
  tenGames: "🎮",
  fiftyGames: "💪",
  streak3: "🔥",
  streak5: "⚡",
  gammonWin: "🎯",
  backgammonWin: "💀",
  rating1200: "📈",
  rating1400: "🏆",
};

/** Best (longest) run of consecutive wins across `games`, in chronological order. */
function bestWinStreak(games: GameRecord[], userId: string): number {
  let best = 0;
  let current = 0;
  for (const g of games) {
    const seat = g.white_player === userId ? "white" : g.black_player === userId ? "black" : null;
    if (!seat || !g.winner) continue;
    if (g.winner === seat) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

/**
 * Computes achievement unlock state from a profile and the player's *ranked*
 * (online, room-based) game history. Local AI/pass-and-play games are
 * intentionally excluded so streaks and gammon badges reflect real matches.
 */
export function computeAchievements(
  profile: Profile,
  rankedGames: GameRecord[],
  userId: string
): Achievement[] {
  const chronological = [...rankedGames].sort(
    (a, b) => new Date(a.finished_at ?? a.created_at).getTime() - new Date(b.finished_at ?? b.created_at).getTime()
  );
  const streak = bestWinStreak(chronological, userId);
  const gammonWins = chronological.filter((g) => {
    const seat = g.white_player === userId ? "white" : g.black_player === userId ? "black" : null;
    return seat && g.winner === seat && g.win_kind === "gammon";
  }).length;
  const backgammonWins = chronological.filter((g) => {
    const seat = g.white_player === userId ? "white" : g.black_player === userId ? "black" : null;
    return seat && g.winner === seat && g.win_kind === "backgammon";
  }).length;

  const defs: Array<{ id: AchievementId; current: number; target: number }> = [
    { id: "firstWin", current: profile.wins, target: 1 },
    { id: "tenGames", current: chronological.length, target: 10 },
    { id: "fiftyGames", current: chronological.length, target: 50 },
    { id: "streak3", current: streak, target: 3 },
    { id: "streak5", current: streak, target: 5 },
    { id: "gammonWin", current: gammonWins, target: 1 },
    { id: "backgammonWin", current: backgammonWins, target: 1 },
    { id: "rating1200", current: profile.rating, target: 1200 },
    { id: "rating1400", current: profile.rating, target: 1400 },
  ];

  return defs.map((d) => ({
    ...d,
    icon: ICONS[d.id],
    unlocked: d.current >= d.target,
    current: Math.min(d.current, d.target),
  }));
}
