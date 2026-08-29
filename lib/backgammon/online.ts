"use client";

// Realtime sync for online rooms, over a single Supabase Realtime channel per
// room code — Presence for seat/spectator tracking, Broadcast for game-state
// sync. No dedicated backend: whichever seated player is authenticated writes
// their own `profiles` row (RLS: auth.uid() = id) and, if seated as white (or
// the only authenticated seat), inserts the finished `games` row.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { nextRating } from "@/lib/backgammon/elo";
import {
  applyMove as engineApplyMove,
  checkWinner,
  createInitialState,
  getLegalFirstMoves,
  opponent,
  rollDice,
  type GameState,
  type Move,
  type Player,
  type WinResult,
} from "@/lib/backgammon/engine";

export interface HistoryEntry {
  player: Player;
  move: Move;
  hit: boolean;
}

interface SeatInfo {
  id: string;
  name: string;
  rating: number;
  authed: boolean;
  joinedAt: number;
}

type Seat = "white" | "black" | "spectator";

interface RoomSnapshot {
  state: GameState | null;
  dice: [number, number] | null;
  diceRemaining: number[];
  turnCount: number;
  history: HistoryEntry[];
  winner: WinResult | null;
}

type BroadcastPayload =
  | ({ type: "state" } & RoomSnapshot)
  | { type: "request-state" };

const EMPTY_SNAPSHOT: RoomSnapshot = {
  state: null,
  dice: null,
  diceRemaining: [],
  turnCount: 1,
  history: [],
  winner: null,
};

function storageKey(code: string, suffix: string): string {
  return `bg-room-${code}-${suffix}`;
}

function getOrCreateGuestId(code: string): string {
  if (typeof window === "undefined") return "server";
  const key = storageKey(code, "guest-id");
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(key, id);
  }
  return id;
}

function getOrCreateJoinedAt(code: string, id: string): number {
  if (typeof window === "undefined") return Date.now();
  const key = storageKey(code, `joined-${id}`);
  const stored = window.sessionStorage.getItem(key);
  if (stored) return Number(stored);
  const now = Date.now();
  window.sessionStorage.setItem(key, String(now));
  return now;
}

export function useOnlineRoom(code: string) {
  const { user, profile, refreshProfile } = useAuth();

  const myId = useMemo(() => user?.id ?? getOrCreateGuestId(code), [user?.id, code]);
  const joinedAtRef = useRef<number>(getOrCreateJoinedAt(code, myId));
  const displayName = profile?.username ?? `Guest-${myId.slice(0, 4)}`;

  const [seats, setSeats] = useState<{ white: SeatInfo | null; black: SeatInfo | null }>({
    white: null,
    black: null,
  });
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [snapshot, setSnapshot] = useState<RoomSnapshot>(EMPTY_SNAPSHOT);
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);

  const roomRef = useRef<RoomSnapshot>(EMPTY_SNAPSHOT);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const startRatingsRef = useRef<{ white: number; black: number } | null>(null);

  const mySeat: Seat = useMemo(() => {
    if (seats.white?.id === myId) return "white";
    if (seats.black?.id === myId) return "black";
    return "spectator";
  }, [seats, myId]);

  const ratedMatch = Boolean(seats.white?.authed && seats.black?.authed);

  useEffect(() => {
    if (seats.white && seats.black && !startRatingsRef.current) {
      startRatingsRef.current = { white: seats.white.rating, black: seats.black.rating };
    }
  }, [seats.white, seats.black]);

  const broadcastSnapshot = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "game",
      payload: { type: "state", ...roomRef.current },
    });
  }, []);

  const applySnapshot = useCallback((next: RoomSnapshot) => {
    roomRef.current = next;
    setSnapshot(next);
  }, []);

  const finalizeGameOver = useCallback(
    async (win: WinResult, history: HistoryEntry[]) => {
      if (!supabase) return;
      const ratings = startRatingsRef.current;
      const currentSeats = seats;

      if (ratings && ratedMatch && user && profile && mySeat !== "spectator") {
        const won = win.winner === mySeat;
        const myRating = mySeat === "white" ? ratings.white : ratings.black;
        const oppRating = mySeat === "white" ? ratings.black : ratings.white;
        const updated = nextRating(myRating, oppRating, won);
        await supabase
          .from("profiles")
          .update({
            rating: updated,
            wins: won ? profile.wins + 1 : profile.wins,
            losses: won ? profile.losses : profile.losses + 1,
          })
          .eq("id", user.id);
        setRatingDelta(updated - myRating);
        await refreshProfile();
        channelRef.current?.track({
          id: myId,
          name: displayName,
          rating: updated,
          authed: true,
          joinedAt: joinedAtRef.current,
        });
      }

      const inserterSeat: Seat | null = currentSeats.white?.authed
        ? "white"
        : currentSeats.black?.authed
          ? "black"
          : null;
      if (inserterSeat && mySeat === inserterSeat) {
        await supabase.from("games").insert({
          room_code: code,
          white_player: currentSeats.white?.authed ? currentSeats.white.id : null,
          black_player: currentSeats.black?.authed ? currentSeats.black.id : null,
          winner: win.winner,
          win_kind: win.kind,
          moves_count: history.length,
          moves: history.map((h) => ({ player: h.player, from: h.move.from, to: h.move.to, die: h.move.die, hit: h.hit })),
          finished_at: new Date().toISOString(),
        });
      }
    },
    [seats, ratedMatch, user, profile, mySeat, myId, displayName, refreshProfile, code]
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !code) return;

    const channel = supabase.channel(`room:${code}`, {
      config: { broadcast: { self: false }, presence: { key: myId } },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const raw = channel.presenceState<SeatInfo>();
      const list = Object.values(raw)
        .map((entries) => entries[entries.length - 1])
        .filter((e): e is SeatInfo & { presence_ref: string } => !!e)
        .sort((a, b) => a.joinedAt - b.joinedAt);
      setSeats({ white: list[0] ?? null, black: list[1] ?? null });
      setSpectatorCount(Math.max(0, list.length - 2));
    });

    channel.on("broadcast", { event: "game" }, ({ payload }: { payload: BroadcastPayload }) => {
      if (payload.type === "state") {
        applySnapshot({
          state: payload.state,
          dice: payload.dice,
          diceRemaining: payload.diceRemaining,
          turnCount: payload.turnCount,
          history: payload.history,
          winner: payload.winner,
        });
      } else if (payload.type === "request-state" && roomRef.current.state) {
        broadcastSnapshot();
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: myId,
          name: displayName,
          rating: profile?.rating ?? 1000,
          authed: !!user,
          joinedAt: joinedAtRef.current,
        });
        channel.send({ type: "broadcast", event: "game", payload: { type: "request-state" } });
      }
    });

    return () => {
      supabase?.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, myId, user?.id, profile?.username]);

  // White seat bootstraps a fresh game if no snapshot arrives shortly after
  // both seats are filled (i.e. this is a genuinely new room, not a
  // reconnect into a game already in progress on the opponent's side).
  useEffect(() => {
    if (!(mySeat === "white" && seats.white && seats.black)) return;
    if (roomRef.current.state) return;
    const timer = setTimeout(() => {
      if (!roomRef.current.state) {
        const initial: RoomSnapshot = {
          state: createInitialState(),
          dice: null,
          diceRemaining: [],
          turnCount: 1,
          history: [],
          winner: null,
        };
        applySnapshot(initial);
        broadcastSnapshot();
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [mySeat, seats.white, seats.black, applySnapshot, broadcastSnapshot]);

  const roll = useCallback(() => {
    const room = roomRef.current;
    if (!room.state || room.state.turn !== mySeat || room.dice !== null || room.winner) return;
    const { dice, movesRemaining } = rollDice();
    let state = room.state;
    let diceRemaining = movesRemaining;
    let turnCount = room.turnCount;
    const legal = getLegalFirstMoves(state, state.turn, diceRemaining);
    if (legal.length === 0) {
      state = { ...state, turn: opponent(state.turn) };
      turnCount += 1;
      diceRemaining = [];
    }
    applySnapshot({ ...room, state, dice, diceRemaining, turnCount });
    broadcastSnapshot();
  }, [mySeat, applySnapshot, broadcastSnapshot]);

  const playMove = useCallback(
    (move: Move) => {
      const room = roomRef.current;
      if (!room.state || room.state.turn !== mySeat || room.winner) return;
      const before = room.state;
      const dest = move.to === "off" ? null : before.points[move.to - 1];
      const hit = dest ? dest.owner !== null && dest.owner !== before.turn : false;
      const next = engineApplyMove(before, move, before.turn);
      const history = [...room.history, { player: before.turn, move, hit }];

      const remaining = [...room.diceRemaining];
      remaining.splice(remaining.indexOf(move.die), 1);

      const win = checkWinner(next);
      let finalState = next;
      let dice = room.dice;
      let diceRemaining = remaining;
      let turnCount = room.turnCount;

      if (win) {
        dice = null;
        diceRemaining = [];
      } else {
        const stillPlayable = getLegalFirstMoves(next, next.turn, remaining);
        if (remaining.length === 0 || stillPlayable.length === 0) {
          finalState = { ...next, turn: opponent(next.turn) };
          turnCount += 1;
          dice = null;
          diceRemaining = [];
        }
      }

      applySnapshot({ state: finalState, dice, diceRemaining, turnCount, history, winner: win });
      broadcastSnapshot();
      if (win) void finalizeGameOver(win, history);
    },
    [mySeat, applySnapshot, broadcastSnapshot, finalizeGameOver]
  );

  const resetRoom = useCallback(() => {
    if (mySeat === "spectator") return;
    startRatingsRef.current = null;
    setRatingDelta(null);
    applySnapshot({ state: createInitialState(), dice: null, diceRemaining: [], turnCount: 1, history: [], winner: null });
    broadcastSnapshot();
  }, [mySeat, applySnapshot, broadcastSnapshot]);

  return {
    configured: isSupabaseConfigured,
    myId,
    displayName,
    mySeat,
    seats,
    spectatorCount,
    roomFull: Boolean(seats.white && seats.black),
    state: snapshot.state,
    dice: snapshot.dice,
    diceRemaining: snapshot.diceRemaining,
    turnCount: snapshot.turnCount,
    history: snapshot.history,
    winner: snapshot.winner,
    ratedMatch,
    ratingDelta,
    roll,
    playMove,
    resetRoom,
  };
}
