"use client";

import { useEffect, useState } from "react";

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value, used, rolling }: { value: number; used: boolean; rolling: boolean }) {
  return (
    <div
      className={`relative h-10 w-10 rounded-xl border shadow-sm sm:h-12 sm:w-12 ${rolling ? "animate-dice" : ""}`}
      style={{
        background: used ? "var(--border)" : "var(--card)",
        borderColor: "var(--border)",
        opacity: used ? 0.4 : 1,
        boxShadow: used ? "none" : "var(--shadow)",
      }}
    >
      {(PIPS[value] ?? []).map(([x, y], i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
            background: "var(--fg)",
          }}
        />
      ))}
    </div>
  );
}

export function DiceRoller({
  dice,
  remaining,
  onRoll,
  canRoll,
}: {
  dice: [number, number] | null;
  remaining: number[];
  onRoll: () => void;
  canRoll: boolean;
}) {
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!dice) return;
    setRolling(true);
    const timer = setTimeout(() => setRolling(false), 500);
    return () => clearTimeout(timer);
  }, [dice]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {dice ? (
          dice.map((d, i) => {
            const usedCount = dice.filter((_, j) => j < i).length;
            const isUsed = remaining.filter((r) => r === d).length <= usedCount;
            return <Die key={i} value={d} used={isUsed} rolling={rolling} />;
          })
        ) : (
          <>
            <Die value={0} used rolling={false} />
            <Die value={0} used rolling={false} />
          </>
        )}
      </div>
      {canRoll && (
        <button onClick={onRoll} className="btn-accent rounded-lg px-4 py-2 text-sm font-semibold">
          🎲 Roll
        </button>
      )}
    </div>
  );
}
