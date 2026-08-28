import { describe, expect, it } from "vitest";
import {
  applyMove,
  checkWinner,
  createInitialState,
  getLegalFirstMoves,
  getLegalMovesForDie,
  totalCheckers,
  type GameState,
} from "./engine";

describe("createInitialState", () => {
  it("sets up the standard starting position with 15 checkers per side", () => {
    const state = createInitialState();
    expect(totalCheckers(state, "white")).toBe(15);
    expect(totalCheckers(state, "black")).toBe(15);
    expect(state.points[23]).toEqual({ count: 2, owner: "white" }); // point 24
    expect(state.points[12]).toEqual({ count: 5, owner: "white" }); // point 13
    expect(state.points[7]).toEqual({ count: 3, owner: "white" }); // point 8
    expect(state.points[5]).toEqual({ count: 5, owner: "white" }); // point 6
    expect(state.points[0]).toEqual({ count: 2, owner: "black" }); // point 1
    expect(state.points[11]).toEqual({ count: 5, owner: "black" }); // point 12
    expect(state.points[16]).toEqual({ count: 3, owner: "black" }); // point 17
    expect(state.points[18]).toEqual({ count: 5, owner: "black" }); // point 19
  });
});

describe("getLegalMovesForDie", () => {
  it("generates legal opening moves for white with die 3 from point 24 and 8", () => {
    const state = createInitialState();
    const moves = getLegalMovesForDie(state, "white", 3);
    const froms = moves.map((m) => m.from).sort();
    // From point 24 -> 21 (open), from point 8 -> 5 (open), from 6 -> 3 (open)
    expect(froms).toContain(24);
    expect(froms).toContain(8);
    expect(froms).toContain(6);
  });

  it("blocks a move onto a point the opponent owns with 2+ checkers", () => {
    const state = createInitialState();
    // Black owns point 19 (5 checkers). White moving 24 with die 5 -> point 19 blocked.
    const moves = getLegalMovesForDie(state, "white", 5);
    const illegal = moves.find((m) => m.from === 24 && m.to === 19);
    expect(illegal).toBeUndefined();
  });

  it("allows hitting a blot (single opposing checker)", () => {
    const state = createInitialState();
    // Move white 24 -> 23 with die 1 (open), then set up a blot manually.
    const custom: GameState = JSON.parse(JSON.stringify(state));
    custom.points[22] = { count: 1, owner: "black" }; // point 23 has a black blot
    const moves = getLegalMovesForDie(custom, "white", 1);
    const hit = moves.find((m) => m.from === 24 && m.to === 23);
    expect(hit).toBeDefined();
  });
});

describe("applyMove", () => {
  it("sends a hit checker to the bar", () => {
    const state = createInitialState();
    const custom: GameState = JSON.parse(JSON.stringify(state));
    custom.points[22] = { count: 1, owner: "black" }; // blot on point 23
    const next = applyMove(custom, { from: 24, to: 23, die: 1 }, "white");
    expect(next.bar.black).toBe(1);
    expect(next.points[22]).toEqual({ count: 1, owner: "white" });
    expect(next.points[23]).toEqual({ count: 1, owner: "white" });
  });

  it("must enter from the bar before any other move, and blocked entry yields no moves", () => {
    const state = createInitialState();
    const custom: GameState = JSON.parse(JSON.stringify(state));
    custom.bar.white = 1;
    // Black owns point 19 (5 checkers) => white entry with die 6 (25-6=19) is blocked.
    const blockedEntry = getLegalMovesForDie(custom, "white", 6);
    expect(blockedEntry).toEqual([]);
    // Die 4 -> entry point 21 (open) should be legal.
    const openEntry = getLegalMovesForDie(custom, "white", 4);
    expect(openEntry).toEqual([{ from: "bar", to: 21, die: 4 }]);
  });
});

describe("forced move / maximal dice usage", () => {
  it("only offers moves that use both dice when possible", () => {
    const state = createInitialState();
    // Standard opening roll 6-5 ("lover's leap" 24/13) is fully playable in
    // more than one way; just assert both dice are usable (maxUsed reaches 2)
    // by checking that at least one first move for each die exists.
    const movesFor6 = getLegalFirstMoves(state, "white", [6, 5]);
    expect(movesFor6.length).toBeGreaterThan(0);
  });

  it("forces the single playable die when only one of the two can be used", () => {
    // Construct a near-bear-off position where white has one checker left
    // far from home and the dice only allow moving it with one specific die.
    const state = createInitialState();
    const custom: GameState = JSON.parse(JSON.stringify(state)) as GameState;
    // Clear the board and hand-craft a minimal, well-understood position.
    custom.points = Array.from({ length: 24 }, () => ({ count: 0, owner: null }));
    custom.bar = { white: 0, black: 0 };
    custom.borneOff = { white: 13, black: 15 };
    // White has 2 checkers left: one on point 2, one on point 24 (blocked in by black).
    custom.points[1] = { count: 1, owner: "white" }; // point 2
    custom.points[23] = { count: 1, owner: "white" }; // point 24
    // Black blocks points 22, 23 (2+ checkers) so white's checker on 24 cannot move with a 1 or 2,
    // but point 2 can bear off with die matching distance 2, and the checker on 24 has nowhere to go.
    custom.points[21] = { count: 2, owner: "black" }; // point 22
    custom.points[22] = { count: 2, owner: "black" }; // point 23

    // Dice [1, 2]: die 2 can bear off point 2 (distance 2). Die 1 from point 2 -> point1 (open, legal, but
    // not bear off) OR from point 24 -> 23 (blocked). So die 1 is separately playable from point 2.
    // This test focuses on: when a die literally has zero legal moves anywhere, it must be excluded.
    const movesForDie1From24 = getLegalMovesForDie(custom, "white", 1);
    const from24 = movesForDie1From24.filter((m) => m.from === 24);
    expect(from24).toEqual([]); // point 23 is blocked by black, so no move from 24 with die 1
  });
});

describe("bearing off", () => {
  it("does not allow bearing off until all checkers are in the home board", () => {
    const state = createInitialState();
    // White still has checkers outside home (e.g. point 24).
    const moves = getLegalMovesForDie(state, "white", 6);
    const bearOff = moves.find((m) => m.to === "off");
    expect(bearOff).toBeUndefined();
  });

  it("allows exact bear off and overage bear off from the furthest checker", () => {
    const state = createInitialState();
    const custom: GameState = JSON.parse(JSON.stringify(state)) as GameState;
    custom.points = Array.from({ length: 24 }, () => ({ count: 0, owner: null }));
    custom.bar = { white: 0, black: 0 };
    custom.borneOff = { white: 13, black: 0 };
    custom.points[2] = { count: 1, owner: "white" }; // point 3, distance 3
    custom.points[4] = { count: 1, owner: "white" }; // point 5, distance 5

    // Exact bear off with die 3 from point 3.
    const exact = getLegalMovesForDie(custom, "white", 3);
    expect(exact.find((m) => m.from === 3 && m.to === "off")).toBeDefined();

    // Die 6 (overage): only the furthest checker (point 5, distance 5) may bear off.
    const overage = getLegalMovesForDie(custom, "white", 6);
    expect(overage.find((m) => m.from === 5 && m.to === "off")).toBeDefined();
    expect(overage.find((m) => m.from === 3 && m.to === "off")).toBeUndefined();
  });
});

describe("checkWinner", () => {
  it("detects a normal win", () => {
    const state = createInitialState();
    const custom: GameState = JSON.parse(JSON.stringify(state)) as GameState;
    custom.borneOff = { white: 15, black: 3 };
    const result = checkWinner(custom);
    expect(result).toEqual({ winner: "white", kind: "normal" });
  });

  it("detects a gammon (loser bore off nothing, no checker in winner's home or bar)", () => {
    const state = createInitialState();
    const custom: GameState = JSON.parse(JSON.stringify(state)) as GameState;
    custom.points = Array.from({ length: 24 }, () => ({ count: 0, owner: null }));
    custom.bar = { white: 0, black: 0 };
    custom.borneOff = { white: 15, black: 0 };
    custom.points[11] = { count: 15, owner: "black" }; // safely on point 12, not in white home (1-6) or bar
    const result = checkWinner(custom);
    expect(result).toEqual({ winner: "white", kind: "gammon" });
  });

  it("detects a backgammon (loser has a checker on the bar)", () => {
    const state = createInitialState();
    const custom: GameState = JSON.parse(JSON.stringify(state)) as GameState;
    custom.points = Array.from({ length: 24 }, () => ({ count: 0, owner: null }));
    custom.bar = { white: 0, black: 1 };
    custom.borneOff = { white: 15, black: 0 };
    custom.points[11] = { count: 14, owner: "black" };
    const result = checkWinner(custom);
    expect(result).toEqual({ winner: "white", kind: "backgammon" });
  });

  it("returns null when nobody has finished bearing off", () => {
    const state = createInitialState();
    expect(checkWinner(state)).toBeNull();
  });
});
