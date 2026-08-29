"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { applyMove, createInitialState, type GameState } from "@/lib/backgammon/engine";
import { Board } from "@/components/Board";
import type { GameRecord } from "@/lib/supabase/types";
import { useI18n } from "@/lib/i18n";

function moveLabel(from: number | "bar", to: number | "off"): string {
  const f = from === "bar" ? "Bar" : from;
  const t = to === "off" ? "Off" : to;
  return `${f} → ${t}`;
}

export default function ReplayPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [game, setGame] = useState<GameRecord | null | undefined>(undefined);
  const [names, setNames] = useState<{ white: string; black: string }>({ white: "White", black: "Black" });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!supabase) {
      setGame(null);
      return;
    }
    let active = true;
    supabase
      .from("games")
      .select("*")
      .eq("id", params.id)
      .maybeSingle()
      .then(async ({ data }: { data: GameRecord | null }) => {
        if (!active) return;
        setGame(data);
        if (!data || !supabase) return;
        const ids = [data.white_player, data.black_player].filter((id): id is string => !!id);
        if (ids.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("id,username").in("id", ids);
          const byId = new Map((profiles as Array<{ id: string; username: string }> | null)?.map((p) => [p.id, p.username]));
          if (active) {
            setNames({
              white: (data.white_player && byId.get(data.white_player)) || t.profile.practice,
              black: (data.black_player && byId.get(data.black_player)) || t.profile.practice,
            });
          }
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const moves = useMemo(() => game?.moves ?? [], [game]);

  const states = useMemo(() => {
    const result: GameState[] = [createInitialState()];
    let cursor = result[0];
    for (const m of moves) {
      cursor = applyMove(cursor, { from: m.from, to: m.to, die: m.die }, m.player);
      result.push(cursor);
    }
    return result;
  }, [moves]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= states.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 900);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, states.length]);

  if (!isSupabaseConfigured) {
    return <div className="card mx-auto max-w-md p-6 text-center text-sm opacity-70">{t.game.needsSupabaseOnline}</div>;
  }

  if (game === undefined) {
    return <div className="card mx-auto max-w-xl h-64 animate-pulse" style={{ background: "var(--bg-alt)" }} />;
  }

  if (!game || moves.length === 0) {
    return <div className="card mx-auto max-w-md p-6 text-center text-sm opacity-70">{t.profile.notFound}</div>;
  }

  const currentMove = index > 0 ? moves[index - 1] : null;

  return (
    <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-[1fr_240px]">
      <div className="space-y-3">
        <div className="animate-fade-up flex items-center justify-between">
          <h1 className="text-xl font-bold">
            🎬 {t.replay.title}: {names.white} {t.profile.vs} {names.black}
          </h1>
        </div>

        <Board
          state={states[index]}
          selectableFrom={[]}
          legalDestinationsForSelected={[]}
          selectedFrom={null}
          onSelectFrom={() => {}}
          onSelectDestination={() => {}}
        />

        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm font-semibold">
            {t.replay.move} {index} {t.replay.of} {states.length - 1}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPlaying(false);
                setIndex(0);
              }}
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              ⏮ {t.replay.restart}
            </button>
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              style={{ borderColor: "var(--border)" }}
            >
              ◀ {t.replay.prev}
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="btn-accent rounded-lg px-4 py-1.5 text-sm font-semibold"
            >
              {playing ? `⏸ ${t.replay.pause}` : `▶ ${t.replay.play}`}
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(states.length - 1, i + 1))}
              disabled={index === states.length - 1}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              style={{ borderColor: "var(--border)" }}
            >
              {t.replay.next} ▶
            </button>
          </div>
        </div>
      </div>

      <aside className="card flex max-h-[500px] flex-col p-4">
        <div className="mb-2 text-sm font-semibold opacity-70">{t.game.history}</div>
        <div className="flex-1 space-y-1 overflow-y-auto text-sm">
          {moves.map((m, i) => (
            <button
              key={i}
              onClick={() => {
                setPlaying(false);
                setIndex(i + 1);
              }}
              className="flex w-full items-center justify-between rounded-md px-1.5 py-1 text-start"
              style={{
                background:
                  i + 1 === index ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
              }}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: m.player === "white" ? "#f3ece1" : "#2b2118", border: "1px solid var(--border)" }}
                />
                {moveLabel(m.from, m.to)}
              </span>
              {m.hit && <span title="Hit">💥</span>}
            </button>
          ))}
        </div>
        {currentMove && (
          <div className="mt-2 border-t pt-2 text-xs opacity-60" style={{ borderColor: "var(--border)" }}>
            {t.replay.move} {index}: {currentMove.player} {moveLabel(currentMove.from, currentMove.to)}
          </div>
        )}
        <Link href="/leaderboard" className="mt-2 text-center text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
          {t.replay.back}
        </Link>
      </aside>
    </div>
  );
}
