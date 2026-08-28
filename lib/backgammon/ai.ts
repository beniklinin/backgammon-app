import {
  applyMove,
  getLegalFirstMoves,
  opponent,
  type GameState,
  type Move,
  type Player,
} from "./engine";

export type Difficulty = "easy" | "medium" | "hard";

function pointOwner(state: GameState, point: number) {
  return state.points[point - 1];
}

/** Rough number of opposing dice-roll combinations (out of 36) that could hit a blot on `point`. */
function shotCount(state: GameState, player: Player, point: number): number {
  const opp = opponent(player);
  const dir = player === "white" ? 1 : -1; // direction back toward the opponent's approach
  let shots = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      const dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
      let reach = 0;
      let acc = 0;
      for (const d of dice) {
        acc += d;
        const from = point + dir * acc;
        if (from >= 1 && from <= 24) {
          const p = pointOwner(state, from);
          if (p.owner === opp && p.count > 0) reach = 1;
        }
      }
      if (reach) shots++;
    }
  }
  return shots;
}

/** Heuristic score for a resulting state, from `player`'s perspective. Higher is better. */
function evaluate(state: GameState, player: Player, difficulty: Difficulty): number {
  let score = 0;
  score += state.borneOff[player] * 10;
  score -= state.borneOff[opponent(player)] * 10;
  score -= state.bar[player] * 6;
  score += state.bar[opponent(player)] * 6;

  for (let point = 1; point <= 24; point++) {
    const p = pointOwner(state, point);
    if (p.owner !== player) continue;
    if (p.count === 1) {
      const exposure = difficulty === "hard" ? shotCount(state, player, point) / 4 : 2;
      score -= exposure;
    }
    if (p.count >= 2) {
      score += difficulty === "hard" ? 0.75 : 0.5; // made point / prime value
    }
  }

  if (difficulty === "hard") {
    // Reward escaping back checkers and building a strong home board.
    const homeStart = player === "white" ? 1 : 19;
    const homeEnd = player === "white" ? 6 : 24;
    for (let point = homeStart; point <= homeEnd; point++) {
      const p = pointOwner(state, point);
      if (p.owner === player && p.count >= 2) score += 0.3;
    }
  }

  return score;
}

/**
 * Plays a full AI turn. Easy picks mostly at random among legal candidates,
 * Medium is a greedy 1-ply heuristic, Hard uses a stronger evaluation
 * (shot-probability aware blot penalties + home-board bonuses).
 */
export function playAiTurn(
  state: GameState,
  player: Player,
  diceRemaining: number[],
  difficulty: Difficulty = "medium",
  rand: () => number = Math.random
): { finalState: GameState; movesPlayed: Move[] } {
  let current = state;
  let dice = [...diceRemaining];
  const movesPlayed: Move[] = [];

  while (dice.length > 0) {
    const candidates = getLegalFirstMoves(current, player, dice);
    if (candidates.length === 0) break;

    let bestMove = candidates[0];

    if (difficulty === "easy" && rand() < 0.55) {
      bestMove = candidates[Math.floor(rand() * candidates.length)];
    } else {
      let bestScore = -Infinity;
      for (const move of candidates) {
        const resultState = applyMove(current, move, player);
        const score = evaluate(resultState, player, difficulty);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    current = applyMove(current, bestMove, player);
    movesPlayed.push(bestMove);
    const dieIdx = dice.indexOf(bestMove.die);
    dice = [...dice.slice(0, dieIdx), ...dice.slice(dieIdx + 1)];
  }

  return { finalState: current, movesPlayed };
}
