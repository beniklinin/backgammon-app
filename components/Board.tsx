"use client";

import type { GameState, Move, MoveStart, Player } from "@/lib/backgammon/engine";

interface BoardProps {
  state: GameState;
  selectableFrom: MoveStart[];
  legalDestinationsForSelected: Move[];
  selectedFrom: MoveStart | null;
  onSelectFrom: (from: MoveStart) => void;
  onSelectDestination: (move: Move) => void;
}

const TOP_ROW = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const BOTTOM_ROW = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function Checker({ owner, highlight }: { owner: Player; highlight?: boolean }) {
  return (
    <div
      className={`animate-pop h-6 w-6 rounded-full border-2 sm:h-7 sm:w-7 ${highlight ? "animate-pulse-ring" : ""}`}
      style={{
        background:
          owner === "white"
            ? "radial-gradient(circle at 35% 30%, #fffaf2, #e7dcc7 70%)"
            : "radial-gradient(circle at 35% 30%, #4a3c2e, #17110c 75%)",
        borderColor: owner === "white" ? "#a5673f" : "#0a0705",
        boxShadow: "0 2px 4px rgba(0,0,0,0.35)",
      }}
    />
  );
}

function Point({
  point,
  pointState,
  flip,
  index,
  selectable,
  isDestination,
  isSelected,
  onSelectFrom,
  onSelectDestination,
}: {
  point: number;
  pointState: { count: number; owner: Player | null };
  flip: boolean; // true for top row (triangle points down)
  index: number;
  selectable: boolean;
  isDestination: boolean;
  isSelected: boolean;
  onSelectFrom: () => void;
  onSelectDestination: () => void;
}) {
  const even = index % 2 === 0;
  const gradient = even
    ? "linear-gradient(180deg, #b97a4c, #8a5330)"
    : "linear-gradient(180deg, #f1dcae, #dcc088)";
  const clip = flip ? "polygon(0 0, 100% 0, 50% 100%)" : "polygon(50% 0, 100% 100%, 0 100%)";

  return (
    <button
      type="button"
      onClick={isDestination ? onSelectDestination : selectable ? onSelectFrom : undefined}
      className="group relative flex h-28 flex-1 flex-col items-center gap-0.5 overflow-visible px-0.5 outline-none"
      aria-label={`Point ${point}`}
    >
      <div
        className="absolute inset-x-0 transition-opacity"
        style={{
          top: flip ? 0 : undefined,
          bottom: flip ? undefined : 0,
          height: "100%",
          background: gradient,
          clipPath: clip,
          opacity: isDestination ? 0.95 : 0.85,
        }}
      />
      {(isSelected || isDestination) && (
        <div
          className="absolute inset-x-0 transition-all"
          style={{
            top: flip ? 0 : undefined,
            bottom: flip ? undefined : 0,
            height: "100%",
            clipPath: clip,
            outline: isSelected ? "3px solid var(--success)" : "3px dashed var(--success)",
            outlineOffset: -2,
          }}
        />
      )}
      {selectable && !isDestination && (
        <div
          className="absolute inset-x-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            top: flip ? 0 : undefined,
            bottom: flip ? undefined : 0,
            height: "100%",
            clipPath: clip,
            background: "color-mix(in srgb, var(--success) 18%, transparent)",
          }}
        />
      )}
      <div
        className={`relative z-10 flex ${flip ? "flex-col" : "flex-col-reverse"} items-center`}
        style={{ marginTop: flip ? 4 : "auto", marginBottom: flip ? "auto" : 4 }}
      >
        {Array.from({ length: Math.min(pointState.count, 5) }).map((_, i) => (
          <div key={i} style={{ marginTop: i === 0 ? 0 : -6 }}>
            <Checker owner={pointState.owner as Player} />
          </div>
        ))}
        {pointState.count > 5 && (
          <span className="z-20 text-xs font-bold text-white [text-shadow:0_0_2px_black]">
            +{pointState.count - 5}
          </span>
        )}
      </div>
      <span className="relative z-10 text-[10px] font-medium opacity-70">{point}</span>
    </button>
  );
}

export function Board({
  state,
  selectableFrom,
  legalDestinationsForSelected,
  selectedFrom,
  onSelectFrom,
  onSelectDestination,
}: BoardProps) {
  const destinationPoints = new Set(
    legalDestinationsForSelected.filter((m) => m.to !== "off").map((m) => m.to as number)
  );
  const canBearOff = legalDestinationsForSelected.some((m) => m.to === "off");

  const isSelectable = (p: MoveStart) => selectableFrom.includes(p);

  const renderRow = (row: number[], flip: boolean) => (
    <div className="flex">
      {row.map((point, i) => (
        <Point
          key={point}
          point={point}
          pointState={state.points[point - 1]}
          flip={flip}
          index={i}
          selectable={isSelectable(point)}
          isDestination={destinationPoints.has(point)}
          isSelected={selectedFrom === point}
          onSelectFrom={() => onSelectFrom(point)}
          onSelectDestination={() => {
            const move = legalDestinationsForSelected.find((m) => m.to === point);
            if (move) onSelectDestination(move);
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      className="card w-full select-none p-3"
      style={{ background: "linear-gradient(160deg, var(--card), var(--bg-alt))" }}
    >
      <div className="mb-2 flex items-center justify-between text-sm">
        <BarBadge
          player="black"
          count={state.bar.black}
          selectable={isSelectable("bar") && selectedFrom !== "bar"}
          selected={selectedFrom === "bar"}
          onClick={() => onSelectFrom("bar")}
        />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Bar</span>
        <BarBadge
          player="white"
          count={state.bar.white}
          selectable={isSelectable("bar") && selectedFrom !== "bar"}
          selected={selectedFrom === "bar"}
          onClick={() => onSelectFrom("bar")}
        />
      </div>

      <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
        {renderRow(TOP_ROW, true)}
        <div className="h-2" style={{ background: "var(--border)" }} />
        {renderRow(BOTTOM_ROW, false)}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <OffBadge
          player="white"
          count={state.borneOff.white}
          active={canBearOff}
          onClick={() => {
            const move = legalDestinationsForSelected.find((m) => m.to === "off");
            if (move) onSelectDestination(move);
          }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Borne off</span>
        <OffBadge
          player="black"
          count={state.borneOff.black}
          active={canBearOff}
          onClick={() => {
            const move = legalDestinationsForSelected.find((m) => m.to === "off");
            if (move) onSelectDestination(move);
          }}
        />
      </div>
    </div>
  );
}

function BarBadge({
  player,
  count,
  selectable,
  selected,
  onClick,
}: {
  player: Player;
  count: number;
  selectable: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  if (count === 0) return <span className="w-16" />;
  return (
    <button
      onClick={selectable ? onClick : undefined}
      className="flex items-center gap-1 rounded-md border px-2 py-1 transition-colors"
      style={{
        borderColor: selected ? "var(--success)" : "var(--border)",
        cursor: selectable ? "pointer" : "default",
      }}
    >
      <Checker owner={player} highlight={selectable && !selected} />
      <span className="text-xs font-semibold">×{count}</span>
    </button>
  );
}

function OffBadge({
  player,
  count,
  active,
  onClick,
}: {
  player: Player;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={active ? onClick : undefined}
      className="flex items-center gap-1 rounded-md border px-2 py-1 transition-colors"
      style={{ borderColor: active ? "var(--success)" : "var(--border)", cursor: active ? "pointer" : "default" }}
    >
      <Checker owner={player} />
      <span className="text-xs font-semibold">×{count}</span>
    </button>
  );
}
