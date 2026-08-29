"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLegalFirstMoves, type Move, type MoveStart } from "@/lib/backgammon/engine";
import { pipCount } from "@/lib/backgammon/pip";
import { useOnlineRoom } from "@/lib/backgammon/online";
import { Board } from "@/components/Board";
import { DiceRoller } from "@/components/DiceRoller";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";
import { Chat } from "@/components/Chat";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n";

function moveLabel(move: Move): string {
  const from = move.from === "bar" ? "Bar" : move.from;
  const to = move.to === "off" ? "Off" : move.to;
  return `${from} → ${to}`;
}

export default function OnlineRoomPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();

  const room = useOnlineRoom(code);
  const { user: chatUser, profile: chatProfile } = useAuth();
  const [selectedFrom, setSelectedFrom] = useState<MoveStart | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMyTurn = room.state !== null && room.state.turn === room.mySeat;

  const legalFirstMoves = useMemo(() => {
    if (!room.state || !isMyTurn || room.diceRemaining.length === 0) return [];
    return getLegalFirstMoves(room.state, room.state.turn, room.diceRemaining);
  }, [room.state, room.diceRemaining, isMyTurn]);

  const selectableFrom = useMemo(
    () => Array.from(new Set(legalFirstMoves.map((m) => m.from))),
    [legalFirstMoves]
  );
  const legalDestinationsForSelected = useMemo(
    () => (selectedFrom === null ? [] : legalFirstMoves.filter((m) => m.from === selectedFrom)),
    [legalFirstMoves, selectedFrom]
  );

  const hits = useMemo(() => room.history.filter((h) => h.hit).length, [room.history]);
  const pipWhite = room.state ? pipCount(room.state, "white") : 0;
  const pipBlack = room.state ? pipCount(room.state, "black") : 0;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!room.configured) {
    return (
      <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
        <p className="text-sm opacity-70">{t.game.needsSupabaseOnline}</p>
        <button onClick={() => router.push("/play")} className="btn-accent rounded-lg px-4 py-2 text-sm font-semibold">
          {t.game.backToMenu}
        </button>
      </div>
    );
  }

  const seatLabel = room.mySeat === "white" ? t.game.youAreWhite : room.mySeat === "black" ? t.game.youAreBlack : t.game.spectating;
  const winnerLabel = (p: "white" | "black") => (p === "white" ? t.game.white : t.game.black);

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="animate-fade-up flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">🌐 {t.game.roomCode}: {code}</h1>
            <p className="text-sm opacity-60">{seatLabel}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className="rounded-lg border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: "var(--border)" }}>
              {copied ? `✅ ${t.game.copied}` : `🔗 ${t.game.copyLink}`}
            </button>
            {room.mySeat !== "spectator" && (
              <button onClick={() => setConfirmReset(true)} className="text-sm underline opacity-70 hover:opacity-100">
                {t.game.newGame}
              </button>
            )}
          </div>
        </div>

        <SeatRow room={room} />

        {!room.roomFull ? (
          <div className="card animate-fade-up flex flex-col items-center gap-3 p-10 text-center">
            <div className="animate-pulse text-4xl">⏳</div>
            <p className="font-semibold">{t.game.waitingForOpponent}</p>
            <p className="text-sm opacity-60">{t.game.roomCode}: <span className="font-mono font-bold">{code}</span></p>
          </div>
        ) : !room.state ? (
          <div className="card animate-fade-up p-10 text-center text-sm opacity-60">{t.game.connecting}</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ background: room.state.turn === "white" ? "#f3ece1" : "#2b2118", border: "1px solid var(--border)" }}
                />
                <span className="font-semibold">{room.state.turn === "white" ? t.game.white : t.game.black}</span>
                <span className="opacity-50">— {isMyTurn ? t.game.yourTurn : room.mySeat === "spectator" ? t.game.spectating : t.game.opponentTurn}</span>
              </div>
              <DiceRoller
                dice={room.dice}
                remaining={room.diceRemaining}
                canRoll={isMyTurn && room.dice === null && !room.winner}
                onRoll={room.roll}
              />
            </div>

            <Board
              state={room.state}
              selectableFrom={selectableFrom}
              legalDestinationsForSelected={legalDestinationsForSelected}
              selectedFrom={selectedFrom}
              onSelectFrom={(from) => setSelectedFrom((prev) => (prev === from ? null : from))}
              onSelectDestination={(move) => {
                room.playMove(move);
                setSelectedFrom(null);
              }}
            />

            <div className="card grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-4">
              <Stat label={t.game.pipCount} value={`${pipWhite} / ${pipBlack}`} />
              <Stat label={t.game.hits} value={hits} />
              <Stat label={t.game.turns} value={room.turnCount} />
              <Stat label={room.ratedMatch ? t.game.ranked : t.game.unranked} value={room.ratedMatch ? "⭐" : "—"} />
            </div>

            {!room.ratedMatch && <p className="text-center text-xs opacity-50">{t.game.unrankedHint}</p>}
          </>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card flex max-h-[320px] flex-col p-4">
          <div className="mb-2 text-sm font-semibold opacity-70">{t.game.history}</div>
          <div className="flex-1 space-y-1 overflow-y-auto text-sm">
            {room.history.length === 0 && <p className="opacity-50">{t.game.noHistory}</p>}
            {room.history
              .slice()
              .reverse()
              .map((h, i) => (
                <div key={room.history.length - i} className="flex items-center justify-between rounded-md px-1.5 py-1" style={{ background: i === 0 ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent" }}>
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
        </div>

        <Chat roomCode={code} senderId={chatUser?.id ?? null} senderName={chatProfile?.username ?? "Guest"} />
      </aside>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <p className="mb-4 text-sm">{t.game.newGameConfirm}</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmReset(false)} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
            {t.game.cancel}
          </button>
          <button
            onClick={() => {
              room.resetRoom();
              setConfirmReset(false);
            }}
            className="btn-accent rounded-lg px-3 py-1.5 text-sm font-semibold"
          >
            {t.game.confirm}
          </button>
        </div>
      </Modal>

      <Modal open={!!room.winner}>
        <div className="text-center">
          <div className="mb-2 text-4xl">🏆</div>
          <p className="text-lg font-bold">{room.winner && t.game.winner.replace("{player}", winnerLabel(room.winner.winner))}</p>
          {room.winner && room.winner.kind !== "normal" && (
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--accent)" }}>
              {room.winner.kind === "gammon" ? t.game.gammon : t.game.backgammon}
            </p>
          )}
          {room.ratedMatch && room.ratingDelta !== null && (
            <p className="mt-2 text-sm font-semibold" style={{ color: room.ratingDelta >= 0 ? "var(--success)" : "var(--danger)" }}>
              {room.ratingDelta >= 0 ? "+" : ""}
              {room.ratingDelta} {t.leaderboard.rating}
            </p>
          )}
          <div className="mt-5 flex justify-center gap-2">
            {room.mySeat !== "spectator" && (
              <button onClick={room.resetRoom} className="btn-accent rounded-lg px-4 py-2 text-sm font-semibold">
                {t.game.rematch}
              </button>
            )}
            <button onClick={() => router.push("/play")} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              {t.game.backToMenu}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SeatRow({ room }: { room: ReturnType<typeof useOnlineRoom> }) {
  const { t } = useI18n();
  return (
    <div className="animate-fade-up flex flex-wrap items-center justify-between gap-3 text-sm">
      <SeatBadge label={t.game.white} seat={room.seats.white} />
      {room.spectatorCount > 0 && (
        <span className="opacity-50">
          👀 {room.spectatorCount} {t.game.spectators}
        </span>
      )}
      <SeatBadge label={t.game.black} seat={room.seats.black} />
    </div>
  );
}

function SeatBadge({ label, seat }: { label: string; seat: { name: string; rating: number; authed: boolean } | null }) {
  return (
    <div className="card flex items-center gap-2 px-3 py-2">
      <Avatar username={seat?.name ?? "?"} size={28} />
      <div>
        <div className="text-xs font-semibold">{seat ? seat.name : "..."}</div>
        <div className="text-[10px] opacity-50">
          {label} {seat?.authed ? `· ${seat.rating}` : ""}
        </div>
      </div>
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
