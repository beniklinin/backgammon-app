import type { GameState, Player } from "./engine";

/** Total pip count (distance-to-bear-off) for `player` — lower is better. */
export function pipCount(state: GameState, player: Player): number {
  let total = state.bar[player] * 25;
  for (let point = 1; point <= 24; point++) {
    const p = state.points[point - 1];
    if (p.owner !== player || p.count === 0) continue;
    const distance = player === "white" ? point : 25 - point;
    total += distance * p.count;
  }
  return total;
}
