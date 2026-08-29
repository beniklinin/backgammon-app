"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import { Avatar } from "./Avatar";
import { computeAchievements } from "@/lib/backgammon/achievements";
import { supabase } from "@/lib/supabase/client";
import type { GameRecord, Profile } from "@/lib/supabase/types";
import { useI18n } from "@/lib/i18n";

function winRate(profile: Profile): number {
  const total = profile.wins + profile.losses;
  return total === 0 ? 0 : Math.round((profile.wins / total) * 100);
}

function AvatarUploader({ profile, onUploaded }: { profile: Profile; onUploaded: (url: string) => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase) return;
    setBusy(true);
    setError(false);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadErr) {
      setBusy(false);
      setError(true);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    setBusy(false);
    onUploaded(url);
  };

  return (
    <label className="cursor-pointer text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
      {busy ? t.profile.uploading : t.profile.changeAvatar}
      <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={busy} />
      {error && <div style={{ color: "var(--danger)" }}>{t.profile.uploadError}</div>}
    </label>
  );
}

export function ProfileView({
  profile,
  isOwn,
  games,
  opponentNames,
  onAvatarChange,
}: {
  profile: Profile;
  isOwn: boolean;
  games: GameRecord[];
  opponentNames: Record<string, string>;
  onAvatarChange?: (url: string) => void;
}) {
  const { t, locale } = useI18n();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  const rankedGames = useMemo(() => games.filter((g) => g.room_code), [games]);
  const achievements = useMemo(
    () => computeAchievements(profile, rankedGames, profile.id),
    [profile, rankedGames]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card animate-fade-up flex flex-wrap items-center gap-4 p-5">
        <Avatar username={profile.username} avatarUrl={avatarUrl} size={72} />
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.username}</h1>
          <p className="text-sm opacity-60">
            {t.profile.memberSince} {new Date(profile.created_at).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}
          </p>
          {isOwn && (
            <div className="mt-1">
              <AvatarUploader
                profile={profile}
                onUploaded={(url) => {
                  setAvatarUrl(url);
                  onAvatarChange?.(url);
                }}
              />
            </div>
          )}
        </div>
        <div className="text-end">
          <div className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
            {profile.rating}
          </div>
          <div className="text-xs uppercase tracking-wide opacity-50">{t.leaderboard.rating}</div>
        </div>
      </div>

      <div className="card animate-fade-up grid grid-cols-2 gap-4 p-5 sm:grid-cols-4" style={{ animationDelay: "0.05s" }}>
        <Stat label={t.profile.gamesPlayed} value={rankedGames.length} />
        <Stat label={t.profile.winRate} value={`${winRate(profile)}%`} />
        <Stat label={t.leaderboard.wins} value={profile.wins} accent="success" />
        <Stat label={t.leaderboard.losses} value={profile.losses} accent="danger" />
      </div>

      <div className="card animate-fade-up p-5" style={{ animationDelay: "0.1s" }}>
        <h2 className="mb-3 text-sm font-semibold opacity-70">🏅 {t.profile.achievements}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-opacity"
              style={{
                borderColor: a.unlocked ? "var(--accent)" : "var(--border)",
                opacity: a.unlocked ? 1 : 0.4,
              }}
              title={t.achievements[a.id].description}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold">{t.achievements[a.id].name}</span>
              {!a.unlocked && a.target > 1 && (
                <span className="text-[10px] opacity-60">
                  {a.current}/{a.target}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card animate-fade-up p-5" style={{ animationDelay: "0.15s" }}>
        <h2 className="mb-3 text-sm font-semibold opacity-70">📜 {t.profile.recentGames}</h2>
        {games.length === 0 ? (
          <p className="text-sm opacity-50">{t.profile.noGames}</p>
        ) : (
          <div className="space-y-1.5">
            {games.slice(0, 15).map((g) => {
              const isWhite = g.white_player === profile.id;
              const won = g.winner === (isWhite ? "white" : "black");
              const opponentId = isWhite ? g.black_player : g.white_player;
              const opponentLabel = !g.room_code
                ? t.profile.practice
                : opponentId
                  ? opponentNames[opponentId] ?? "..."
                  : t.profile.deletedPlayer;
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm"
                  style={{ background: "var(--bg-alt)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: won ? "var(--success)" : "var(--danger)" }}
                    >
                      {won ? "W" : "L"}
                    </span>
                    <span className="opacity-80">
                      {t.profile.vs} {opponentLabel}
                    </span>
                    {g.win_kind && g.win_kind !== "normal" && (
                      <span className="text-xs opacity-50">({g.win_kind})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs opacity-50">
                      {g.finished_at ? new Date(g.finished_at).toLocaleDateString(locale === "he" ? "he-IL" : "en-US") : ""}
                    </span>
                    {g.moves && g.moves.length > 0 && (
                      <Link href={`/replay/${g.id}`} className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                        {t.profile.viewReplay}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: "success" | "danger" }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold" style={accent ? { color: `var(--${accent})` } : undefined}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide opacity-50">{label}</div>
    </div>
  );
}
