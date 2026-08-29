"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ProfileView } from "@/components/ProfileView";
import type { GameRecord, Profile } from "@/lib/supabase/types";
import { useI18n } from "@/lib/i18n";

export default function PublicProfilePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supabase) {
      setProfile(null);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle()
      .then(async ({ data }: { data: Profile | null }) => {
        if (!active) return;
        setProfile(data);
        if (!data || !supabase) return;

        const { data: gameRows } = await supabase
          .from("games")
          .select("*")
          .or(`white_player.eq.${data.id},black_player.eq.${data.id}`)
          .order("finished_at", { ascending: false })
          .limit(50);
        const rows = (gameRows as GameRecord[] | null) ?? [];
        if (!active) return;
        setGames(rows);

        const opponentIds = Array.from(
          new Set(
            rows
              .map((g) => (g.white_player === data.id ? g.black_player : g.white_player))
              .filter((id): id is string => !!id && id !== data.id)
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
      });
    return () => {
      active = false;
    };
  }, [username]);

  if (!isSupabaseConfigured) {
    return <div className="card mx-auto max-w-md p-6 text-center text-sm opacity-70">{t.auth.needsSupabase}</div>;
  }

  if (profile === undefined) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="card h-32 animate-pulse" style={{ background: "var(--bg-alt)" }} />
      </div>
    );
  }

  if (profile === null) {
    return <div className="card mx-auto max-w-md p-6 text-center text-sm opacity-70">{t.profile.notFound}</div>;
  }

  return (
    <ProfileView profile={profile} isOwn={user?.id === profile.id} games={games} opponentNames={opponentNames} />
  );
}
