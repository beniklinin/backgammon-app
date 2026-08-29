"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ProfileView } from "@/components/ProfileView";
import type { GameRecord } from "@/lib/supabase/types";
import { useI18n } from "@/lib/i18n";

export default function OwnProfilePage() {
  const { t } = useI18n();
  const { user, profile, loading, configured } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user) {
      setGamesLoading(false);
      return;
    }
    let active = true;
    setGamesLoading(true);
    supabase
      .from("games")
      .select("*")
      .or(`white_player.eq.${user.id},black_player.eq.${user.id}`)
      .order("finished_at", { ascending: false })
      .limit(50)
      .then(async ({ data }: { data: GameRecord[] | null }) => {
        if (!active) return;
        const rows = data ?? [];
        setGames(rows);
        const opponentIds = Array.from(
          new Set(
            rows
              .map((g) => (g.white_player === user.id ? g.black_player : g.white_player))
              .filter((id): id is string => !!id && id !== user.id)
          )
        );
        if (opponentIds.length > 0 && supabase) {
          const { data: profiles } = await supabase.from("profiles").select("id,username").in("id", opponentIds);
          if (active && profiles) {
            const map: Record<string, string> = {};
            for (const p of profiles as Array<{ id: string; username: string }>) map[p.id] = p.username;
            setOpponentNames(map);
          }
        }
        setGamesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!configured) {
    return <div className="card mx-auto max-w-md p-6 text-center text-sm opacity-70">{t.auth.needsSupabase}</div>;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="card h-32 animate-pulse" style={{ background: "var(--bg-alt)" }} />
        <div className="card h-24 animate-pulse" style={{ background: "var(--bg-alt)" }} />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
        <p className="text-sm opacity-70">{t.profile.loginPrompt}</p>
        <a href="/login" className="btn-accent inline-block rounded-lg px-4 py-2 text-sm font-semibold">
          {t.nav.login}
        </a>
      </div>
    );
  }

  return (
    <ProfileView
      profile={profile}
      isOwn
      games={gamesLoading ? [] : games}
      opponentNames={opponentNames}
    />
  );
}
