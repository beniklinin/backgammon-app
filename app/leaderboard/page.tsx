"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n";

type Period = "all" | "week" | "month";

interface Row {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
}

function periodStart(period: Period): string | null {
  if (period === "all") return null;
  const now = new Date();
  const days = period === "week" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function fetchAllTime(): Promise<Row[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("leaderboard").select("*");
  return (data as Row[] | null) ?? [];
}

async function fetchPeriod(period: Period): Promise<Row[]> {
  if (!supabase) return [];
  const since = periodStart(period);
  let query = supabase
    .from("games")
    .select("white_player,black_player,winner,finished_at,room_code")
    .not("winner", "is", null)
    .not("room_code", "is", null);
  if (since) query = query.gte("finished_at", since);
  const { data } = await query;
  const games = (data as Array<{ white_player: string | null; black_player: string | null; winner: "white" | "black" }> | null) ?? [];

  const tally = new Map<string, { wins: number; losses: number }>();
  const bump = (id: string | null, key: "wins" | "losses") => {
    if (!id) return;
    const entry = tally.get(id) ?? { wins: 0, losses: 0 };
    entry[key] += 1;
    tally.set(id, entry);
  };
  for (const g of games) {
    const winnerId = g.winner === "white" ? g.white_player : g.black_player;
    const loserId = g.winner === "white" ? g.black_player : g.white_player;
    bump(winnerId, "wins");
    bump(loserId, "losses");
  }

  const ids = Array.from(tally.keys());
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("id,username,rating").in("id", ids);
  const byId = new Map((profiles as Array<{ id: string; username: string; rating: number }> | null)?.map((p) => [p.id, p]));

  return ids
    .map((id) => {
      const p = byId.get(id);
      const tallyEntry = tally.get(id)!;
      return p ? { id, username: p.username, rating: p.rating, ...tallyEntry } : null;
    })
    .filter((r): r is Row => r !== null)
    .sort((a, b) => b.wins - a.wins || b.rating - a.rating);
}

export default function LeaderboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const fetcher = period === "all" ? fetchAllTime() : fetchPeriod(period);
    fetcher.then((data) => {
      if (active) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [period]);

  const tabs = useMemo(
    () => [
      { id: "all" as Period, label: t.leaderboard.allTime },
      { id: "week" as Period, label: t.leaderboard.weekly },
      { id: "month" as Period, label: t.leaderboard.monthly },
    ],
    [t]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="animate-fade-up space-y-1 text-center">
        <h1 className="text-2xl font-bold">🏆 {t.leaderboard.title}</h1>
        <p className="text-sm opacity-60">{t.leaderboard.subtitle}</p>
      </div>

      <div className="animate-fade-up flex justify-center gap-2" style={{ animationDelay: "0.05s" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className="rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors"
            style={{
              borderColor: period === tab.id ? "var(--accent)" : "var(--border)",
              background: period === tab.id ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
              color: period === tab.id ? "var(--accent)" : "inherit",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!isSupabaseConfigured ? (
        <div className="card animate-fade-up p-6 text-center text-sm opacity-70">{t.leaderboard.empty}</div>
      ) : loading ? (
        <div className="card animate-fade-up space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: "var(--bg-alt)" }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card animate-fade-up p-6 text-center text-sm opacity-70">{t.leaderboard.empty}</div>
      ) : (
        <div className="card animate-fade-up overflow-x-auto p-2">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-start text-xs uppercase tracking-wide opacity-50">
                <th className="px-3 py-2 text-start">{t.leaderboard.rank}</th>
                <th className="px-3 py-2 text-start">{t.leaderboard.player}</th>
                <th className="px-3 py-2 text-end">{t.leaderboard.rating}</th>
                <th className="px-3 py-2 text-end">{t.leaderboard.wins}</th>
                <th className="px-3 py-2 text-end">{t.leaderboard.losses}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="rounded-lg transition-colors"
                  style={{
                    background:
                      user?.id === r.id ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
                  }}
                >
                  <td className="px-3 py-2 font-semibold opacity-70">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    <Link href={`/profile/${encodeURIComponent(r.username)}`} className="hover:underline">
                      {r.username}
                    </Link>
                    {user?.id === r.id && (
                      <span
                        className="ms-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "var(--accent)", color: "white" }}
                      >
                        {t.leaderboard.you}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-end font-mono">{r.rating}</td>
                  <td className="px-3 py-2 text-end" style={{ color: "var(--success)" }}>
                    {r.wins}
                  </td>
                  <td className="px-3 py-2 text-end" style={{ color: "var(--danger)" }}>
                    {r.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
