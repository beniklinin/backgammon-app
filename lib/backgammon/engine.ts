// Full backgammon rules engine: standard starting position, legal move
// generation (incl. bar re-entry and bearing off with the overage rule),
// hitting, forced/maximal dice usage, and win/gammon/backgammon detection.
//
// Board convention: 24 points, numbered 1..24.
//   - White moves from 24 -> 1 (direction -1). White's home board is 1..6.
//   - Black moves from 1 -> 24 (direction +1). Black's home board is 19..24.
//   - A player re-entering from the bar enters the opponent's home quadrant
//     and travels across the board, matching standard backgammon.

export type Player = "white" | "black";

export interface PointState {
  count: number;
  owner: Player | null;
}

export interface GameState {
  points: PointState[]; // index 0 = point 1, ... index 23 = point 24
  bar: Record<Player, number>;
  borneOff: Record<Player, number>;
  turn: Player;
}

export type MoveEnd = number | "off";
export type MoveStart = number | "bar";

export interface Move {
  from: MoveStart;
  to: MoveEnd;
  die: number;
}

export type WinKind = "normal" | "gammon" | "backgammon";

export interface WinResult {
  winner: Player;
  kind: WinKind;
}

const START_LAYOUT: Array<[number, number, Player]> = [
  [24, 2, "white"],
  [13, 5, "white"],
  [8, 3, "white"],
  [6, 5, "white"],
  [1, 2, "black"],
  [12, 5, "black"],
  [17, 3, "black"],
  [19, 5, "black"],
];

export function opponent(player: Player): Player {
  return player === "white" ? "black" : "white";
}

export function createInitialState(turn: Player = "white"): GameState {
  const points: PointState[] = Array.from({ length: 24 }, () => ({
    count: 0,
    owner: null,
  }));
  for (const [point, count, owner] of START_LAYOUT) {
    points[point - 1] = { count, owner };
  }
  return {
    points,
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    turn,
  };
}

export function cloneState(state: GameState): GameState {
  return {
    points: state.points.map((p) => ({ ...p })),
    bar: { ...state.bar },
    borneOff: { ...state.borneOff },
    turn: state.turn,
  };
}

function direction(player: Player): 1 | -1 {
  return player === "white" ? -1 : 1;
}

function entryPoint(player: Player, die: number): number {
  return player === "white" ? 25 - die : die;
}

function isInHomeBoard(player: Player, point: number): boolean {
  return player === "white" ? point <= 6 : point >= 19;
}

/** Distance of a point from bearing off, 1..6. */
function distanceFromOff(player: Player, point: number): number {
  return player === "white" ? point : 25 - point;
}

function getPoint(state: GameState, point: number): PointState {
  return state.points[point - 1];
}

/** Can `player` legally move/enter a checker onto `point`? */
function pointOpenFor(state: GameState, point: number, player: Player): boolean {
  if (point < 1 || point > 24) return false;
  const p = getPoint(state, point);
  if (p.count === 0 || p.owner === null) return true;
  if (p.owner === player) return true;
  return p.count === 1; // opponent blot: hittable
}

export function allCheckersInHome(state: GameState, player: Player): boolean {
  if (state.bar[player] > 0) return false;
  for (let point = 1; point <= 24; point++) {
    const p = getPoint(state, point);
    if (p.owner === player && p.count > 0 && !isInHomeBoard(player, point)) {
      return false;
    }
  }
  return true;
}

function isFurthestCheckerFromOff(
  state: GameState,
  player: Player,
  point: number
): boolean {
  let maxDist = 0;
  for (let p = 1; p <= 24; p++) {
    const pt = getPoint(state, p);
    if (pt.owner === player && pt.count > 0 && isInHomeBoard(player, p)) {
      maxDist = Math.max(maxDist, distanceFromOff(player, p));
    }
  }
  return distanceFromOff(player, point) === maxDist;
}

/** All legal single-die moves for `player` using exactly one die of value `die`. */
export function getLegalMovesForDie(
  state: GameState,
  player: Player,
  die: number
): Move[] {
  const moves: Move[] = [];

  if (state.bar[player] > 0) {
    const entry = entryPoint(player, die);
    if (pointOpenFor(state, entry, player)) {
      moves.push({ from: "bar", to: entry, die });
    }
    return moves;
  }

  const canBearOff = allCheckersInHome(state, player);

  for (let point = 1; point <= 24; point++) {
    const p = getPoint(state, point);
    if (p.owner !== player || p.count === 0) continue;

    const dest = point + direction(player) * die;

    if (dest >= 1 && dest <= 24) {
      if (pointOpenFor(state, dest, player)) {
        moves.push({ from: point, to: dest, die });
      }
    } else if (canBearOff) {
      const dist = distanceFromOff(player, point);
      if (die === dist) {
        moves.push({ from: point, to: "off", die });
      } else if (die > dist && isFurthestCheckerFromOff(state, player, point)) {
        moves.push({ from: point, to: "off", die });
      }
    }
  }

  return moves;
}

export function applyMove(state: GameState, move: Move, player: Player): GameState {
  const next = cloneState(state);

  if (move.from === "bar") {
    next.bar[player] -= 1;
  } else {
    const src = next.points[move.from - 1];
    src.count -= 1;
    if (src.count === 0) src.owner = null;
  }

  if (move.to === "off") {
    next.borneOff[player] += 1;
  } else {
    const dest = next.points[move.to - 1];
    if (dest.owner !== null && dest.owner !== player) {
      // hit: send the lone opponent checker to the bar
      next.bar[opponent(player)] += 1;
      dest.owner = player;
      dest.count = 1;
    } else {
      dest.owner = player;
      dest.count += 1;
    }
  }

  return next;
}

interface SequenceSearchResult {
  maxUsed: number;
  sequences: Move[][];
}

/**
 * Recursively finds every sequence of moves (consuming dice from the given
 * multiset) that uses the maximum possible number of dice, per the official
 * "you must use as many dice as legally possible" rule.
 */
function findBestSequences(
  state: GameState,
  player: Player,
  diceRemaining: number[]
): SequenceSearchResult {
  if (diceRemaining.length === 0) {
    return { maxUsed: 0, sequences: [[]] };
  }

  const uniqueDice = Array.from(new Set(diceRemaining));
  let maxUsed = 0;
  let bestSequences: Move[][] = [];

  for (const die of uniqueDice) {
    const dieIndex = diceRemaining.indexOf(die);
    const remainingAfterDie = [
      ...diceRemaining.slice(0, dieIndex),
      ...diceRemaining.slice(dieIndex + 1),
    ];

    const movesForDie = getLegalMovesForDie(state, player, die);
    for (const move of movesForDie) {
      const nextState = applyMove(state, move, player);
      const sub = findBestSequences(nextState, player, remainingAfterDie);
      const used = 1 + sub.maxUsed;

      if (used > maxUsed) {
        maxUsed = used;
        bestSequences = sub.sequences.map((seq) => [move, ...seq]);
      } else if (used === maxUsed && used > 0) {
        bestSequences.push(...sub.sequences.map((seq) => [move, ...seq]));
      }
    }
  }

  if (maxUsed === 0) {
    return { maxUsed: 0, sequences: [[]] };
  }
  return { maxUsed, sequences: bestSequences };
}

function moveKey(m: Move): string {
  return `${m.from}-${m.to}-${m.die}`;
}

/**
 * The set of legal *first* moves for the current dice, restricted to moves
 * that are part of some sequence achieving the maximum number of dice
 * playable this turn (the official forced-move rule).
 */
export function getLegalFirstMoves(
  state: GameState,
  player: Player,
  diceRemaining: number[]
): Move[] {
  if (diceRemaining.length === 0) return [];
  const { maxUsed, sequences } = findBestSequences(state, player, diceRemaining);
  if (maxUsed === 0) return [];

  const seen = new Set<string>();
  const result: Move[] = [];
  for (const seq of sequences) {
    const first = seq[0];
    if (!first) continue;
    const key = moveKey(first);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(first);
    }
  }
  return result;
}

/** Roll two dice; doubles yield four usable moves of that value. */
export function rollDice(rand: () => number = Math.random): {
  dice: [number, number];
  movesRemaining: number[];
} {
  const d1 = Math.floor(rand() * 6) + 1;
  const d2 = Math.floor(rand() * 6) + 1;
  const movesRemaining = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
  return { dice: [d1, d2], movesRemaining };
}

export function checkWinner(state: GameState): WinResult | null {
  for (const player of ["white", "black"] as Player[]) {
    if (state.borneOff[player] === 15) {
      const loser = opponent(player);
      if (state.borneOff[loser] > 0) {
        return { winner: player, kind: "normal" };
      }
      const winnerHomeStart = player === "white" ? 1 : 19;
      const winnerHomeEnd = player === "white" ? 6 : 24;
      let loserInWinnersHomeOrBar = state.bar[loser] > 0;
      if (!loserInWinnersHomeOrBar) {
        for (let point = winnerHomeStart; point <= winnerHomeEnd; point++) {
          const p = getPoint(state, point);
          if (p.owner === loser && p.count > 0) {
            loserInWinnersHomeOrBar = true;
            break;
          }
        }
      }
      return {
        winner: player,
        kind: loserInWinnersHomeOrBar ? "backgammon" : "gammon",
      };
    }
  }
  return null;
}

export function totalCheckers(state: GameState, player: Player): number {
  let total = state.bar[player] + state.borneOff[player];
  for (const p of state.points) {
    if (p.owner === player) total += p.count;
  }
  return total;
}
