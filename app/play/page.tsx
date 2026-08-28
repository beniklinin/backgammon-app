"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyMove,
  checkWinner,
  createInitialState,
  getLegalFirstMoves,
  rollDice,
  type GameState,
  type Move,
  type MoveStart,
  type Player,
  type WinResult,
} from "@/lib/backgammon/engine";
import { playAiTurn, type Difficulty } from "@/lib/backgammon/ai";
import { pipCount } from "@/lib/backgammon/pip";
import { Board } from "@/components/Board";
import { DiceRoller } from "@/components/DiceRoller";
import { Modal } from "@/components/Modal";
import { useI18n } from "@/lib/i18n";

type Mode = "ai" | "pass" | null;

interface HistoryEntry {
  player: Player;
  move: Move;
  hit: boolean;
}

function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function moveLabel(move: Move): string {
  const from = move.from === "bar" ? "Bar" : move.from;
  const to = move.to === "off" ? "Off" : move.to;
  return `${from} → ${to}`;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [diceRemaining, setDiceRemaining] = useState<number[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<MoveStart | null>(null);
  const [winner, setWinner] = useState<WinResult | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [turnCount, setTurnCount] = useState(1);
  const [confirmReset, setConfirmReset] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt || winner) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt, winner]);

  const legalFirstMoves = useMemo(() => {
    if (winner || diceRemaining.length === 0) return [];
    return getLegalFirstMoves(state, state.turn, diceRemaining);
  }, [state, diceRemaining, winner]);

  const selectableFrom = useMemo(
    () => Array.from(new Set(legalFirstMoves.map((m) => m.from))),
    [legalFirstMoves]
  );

  const legalDestinationsForSelected: Move[] = useMemo(
    () => (selectedFrom === null ? [] : legalFirstMoves.filter((m) => m.from === selectedFrom)),
    [legalFirstMoves, selectedFrom]
  );

  const pushHistory = useCallback((player: Player, move: Move, before: GameState) => {
    const dest = move.to === "off" ? null : before.points[move.to - 1];
    const hit = dest ? dest.owner !== null && dest.owner !== player : false;
    setHistory((prev) => [...prev, { player, move, hit }]);
  }, []);

  const endTurnIfNoMoves = useCallback((s: GameState, remaining: number[]) => {
    if (remaining.length === 0) return;
    const moves = getLegalFirstMoves(s, s.turn, remaining);
    if (moves.length === 0) {
      setTimeout(() => {
        setState((prev) => ({ ...prev, turn: prev.turn === "white" ? "black" : "white" }));
        setTurnCount((c) => c + 1);
        setDice(null);
        setDiceRemaining([]);
      }, 400);
    }
  }, []);

  const handleRoll = useCallback(() => {
    const { dice: d, movesRemaining } = rollDice();
    setDice(d);
    setDiceRemaining(movesRemaining);
    endTurnIfNoMoves(state, movesRemaining);
  }, [state, endTurnIfNoMoves]);

  const finishTurnIfDone = useCallback((s: GameState, remaining: number[]) => {
    const stillPlayable = getLegalFirstMoves(s, s.turn, remaining);
    if (remaining.length === 0 || stillPlayable.length === 0) {
      setTimeout(() => {
        setState((prev) => ({ ...s, turn: s.turn === "white" ? "black" : "white" }));
        setTurnCount((c) => c + 1);
        setDice(null);
        setDiceRemaining([]);
      }, 300);
    }
  }, []);

  const handleSelectFrom = useCallback((from: MoveStart) => {
    setSelectedFrom((prev) => (prev === from ? null : from));
  }, []);

  const handleSelectDestination = useCallback(
    (move: Move) => {
      const next = applyMove(state, move, state.turn);
      pushHistory(state.turn, move, state);
      const remaining = [...diceRemaining];
      const dieIdx = remaining.indexOf(move.die);
      remaining.splice(dieIdx, 1);

      setState(next);
      setDiceRemaining(remaining);
      setSelectedFrom(null);

      const win = checkWinner(next);
      if (win) {
        setWinner(win);
        setDice(null);
        setDiceRemaining([]);
        return;
      }
      finishTurnIfDone(next, remaining);
    },
    [state, diceRemaining, finishTurnIfDone, pushHistory]
  );

  // AI turn handling
  useEffect(() => {
    if (mode !== "ai" || winner || state.turn !== "black" || dice !== null) return;
    setAiThinking(true);
    const timer = setTimeout(() => {
      const { dice: d, movesRemaining } = rollDice();
      const { finalState, movesPlayed } = playAiTurn(state, "black", movesRemaining, difficulty);
      let cursor = state;
      for (const m of movesPlayed) {
        pushHistory("black", m, cursor);
        cursor = applyMove(cursor, m, "black");
      }
      const flipped: GameState = { ...finalState, turn: "white" };
      setDice(d);
      const win = checkWinner(finalState);
      setTimeout(() => {
        setState(win ? finalState : flipped);
        setTurnCount((c) => c + 1);
        setDice(null);
        setDiceRemaining([]);
        setAiThinking(false);
        if (win) setWinner(win);
      }, 700);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state, winner, dice, difficulty]);

  const resetGame = useCallback((next: Mode) => {
    setMode(next);
    setState(createInitialState());
    setDice(null);
    setDiceRemaining([]);
    setSelectedFrom(null);
    setWinner(null);
    setHistory([]);
    setTurnCount(1);
    setStartedAt(Date.now());
    setElapsed(0);
    setConfirmReset(false);
  }, []);

  const hits = useMemo(() => history.filter((h) => h.hit).length, [history]);
  const pipWhite = useMemo(() => pipCount(state, "white"), [state]);
  const pipBlack = useMemo(() => pipCount(state, "black"), [state]);

  const winnerLabel = (p: Player) => (p === "white" ? t.game.white : t.game.black);

  if (mode === null) {
    return (
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="animate-fade-up text-2xl font-bold">{t.home.heading}</h1>
        <p className="animate-fade-up opacity-70">{t.home.subheading}</p>

        <div className="card animate-fade-up p-4 text-start">
          <div className="mb-2 text-sm font-semibold opacity-70">{t.game.difficulty}</div>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                style={{
                  borderColor: difficulty === d ? "var(--accent)" : "var(--border)",
                  background: difficulty === d ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                  color: difficulty === d ? "var(--accent)" : "inherit",
                }}
              >
                {t.game[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => resetGame("ai")} className="card card-hover animate-fade-up p-4 font-semibold">
            🤖 {t.home.playLocal}
          </button>
          <button onClick={() => resetGame("pass")} className="card card-hover animate-fade-up p-4 font-semibold">
            👥 {t.home.playPass}
          </button>
          <button
            onClick={() => router.push(`/play/${randomRoomCode()}`)}
            className="card card-hover animate-fade-up p-4 font-semibold"
          >
            🌐 {t.home.createRoom}
          </button>
          <JoinRoomButton label={t.home.joinRoom} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{mode === "ai" ? t.home.playLocal : t.home.playPass}</h1>
          <button onClick={() => setConfirmReset(true)} className="text-sm underline opacity-70 hover:opacity-100">
            {t.game.newGame}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: state.turn === "white" ? "#f3ece1" : "#2b2118", border: "1px solid var(--border)" }}
            />
            <span className="font-semibold">{state.turn === "white" ? t.game.white : t.game.black}</span>
            {mode === "ai" && state.turn === "black" && aiThinking ? " 🤔" : ""}
            <span className="opacity-50">— {t.game.yourTurn}</span>
          </div>
          <DiceRoller
            dice={dice}
            remaining={diceRemaining}
            canRoll={!winner && dice === null && !(mode === "ai" && state.turn === "black")}
            onRoll={handleRoll}
          />
        </div>

        <Board
          state={state}
          selectableFrom={selectableFrom}
          legalDestinationsForSelected={legalDestinationsForSelected}
          selectedFrom={selectedFrom}
          onSelectFrom={handleSelectFrom}
          onSelectDestination={handleSelectDestination}
        />

        <div className="card grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-4">
          <Stat label={t.game.pipCount} value={`${pipWhite} / ${pipBlack}`} />
          <Stat label={t.game.hits} value={hits} />
          <Stat label={t.game.turns} value={turnCount} />
          <Stat label={t.game.time} value={formatClock(elapsed)} />
        </div>
      </div>

      <aside className="card flex max-h-[420px] flex-col p-4">
        <div className="mb-2 text-sm font-semibold opacity-70">{t.game.history}</div>
        <div className="flex-1 space-y-1 overflow-y-auto text-sm">
          {history.length === 0 && <p className="opacity-50">{t.game.noHistory}</p>}
          {history
            .slice()
            .reverse()
            .map((h, i) => (
              <div key={history.length - i} className="flex items-center justify-between rounded-md px-1.5 py-1" style={{ background: i === 0 ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent" }}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: h.player === "white" ? "#f3ece1" : "#2b2118", border: "1px solid var(--border)" }}
                  />
                  {moveLabel(h.move)}
                </span>
                {h.hit && <span title="Hit">💥</span>}
              </div>
            ))}
        </div>
      </aside>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <p className="mb-4 text-sm">{t.game.newGameConfirm}</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmReset(false)} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
            {t.game.cancel}
          </button>
          <button onClick={() => resetGame(mode)} className="btn-accent rounded-lg px-3 py-1.5 text-sm font-semibold">
            {t.game.confirm}
          </button>
        </div>
      </Modal>

      <Modal open={!!winner}>
        <div className="text-center">
          <div className="mb-2 text-4xl">🏆</div>
          <p className="text-lg font-bold">{winner && t.game.winner.replace("{player}", winnerLabel(winner.winner))}</p>
          {winner && winner.kind !== "normal" && (
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--accent)" }}>
              {winner.kind === "gammon" ? t.game.gammon : t.game.backgammon}
            </p>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => resetGame(mode)} className="btn-accent rounded-lg px-4 py-2 text-sm font-semibold">
              {t.game.rematch}
            </button>
            <button onClick={() => resetGame(null)} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              {t.game.backToMenu}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide opacity-50">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function JoinRoomButton({ label }: { label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="card card-hover animate-fade-up p-4 font-semibold">
        🔑 {label}
      </button>
    );
  }

  return (
    <div className="card flex items-center gap-2 p-4">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        maxLength={6}
        className="w-24 rounded-md border px-2 py-1 text-sm uppercase"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      />
      <button
        onClick={() => code.length === 6 && router.push(`/play/${code}`)}
        className="btn-accent rounded-md px-3 py-1 text-sm"
      >
        →
      </button>
    </div>
  );
}
