"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const FEATURES = [
  { icon: "🎯", key: "rules" },
  { icon: "🤖", key: "ai" },
  { icon: "🌐", key: "online" },
  { icon: "💬", key: "chat" },
  { icon: "🏆", key: "leaderboard" },
  { icon: "🌓", key: "theme" },
] as const;

const FEATURE_TEXT: Record<(typeof FEATURES)[number]["key"], { en: string; he: string }> = {
  rules: { en: "Real, fully-implemented backgammon rules", he: "חוקי שש-בש אמיתיים ומלאים" },
  ai: { en: "Heuristic AI opponent — three difficulty levels", he: "יריב מחשב עם שלוש רמות קושי" },
  online: { en: "Real-time online rooms via a share code", he: "חדרים אונליין בזמן אמת עם קוד שיתוף" },
  chat: { en: "In-game chat with your opponent", he: "צ'אט במשחק מול היריב" },
  leaderboard: { en: "Global leaderboard and profiles", he: "טבלת דירוג ופרופילים גלובליים" },
  theme: { en: "Light & dark mode, Hebrew & English", he: "מצב בהיר וכהה, עברית ואנגלית" },
};

function MiniBoard() {
  const shades = ["#a5673f", "#e8cf9c"];
  return (
    <div
      className="animate-fade-up card mx-auto flex h-40 w-full max-w-md items-end gap-0.5 overflow-hidden p-2 sm:h-48"
      style={{ animationDelay: "0.1s" }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-full flex-1"
          style={{
            background: shades[i % 2],
            clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { t, locale } = useI18n();

  return (
    <div className="mx-auto max-w-4xl space-y-14 py-6 text-center sm:py-10">
      <div className="space-y-5">
        <span
          className="animate-fade-up inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
          style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
        >
          {locale === "he" ? "חינם · קוד פתוח · חוקים אמיתיים" : "Free · Open source · Real rules"}
        </span>
        <h1 className="animate-fade-up text-4xl font-extrabold leading-tight sm:text-5xl" style={{ animationDelay: "0.05s" }}>
          {t.home.heading}
        </h1>
        <p className="animate-fade-up mx-auto max-w-xl text-lg opacity-70" style={{ animationDelay: "0.1s" }}>
          {t.tagline}
        </p>
        <div className="animate-fade-up flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.15s" }}>
          <Link href="/play" className="btn-accent inline-block rounded-xl px-7 py-3 text-lg font-semibold">
            🎲 {t.nav.play}
          </Link>
          <Link
            href="/leaderboard"
            className="card card-hover inline-block rounded-xl px-7 py-3 text-lg font-semibold"
          >
            🏆 {t.nav.leaderboard}
          </Link>
        </div>
      </div>

      <MiniBoard />

      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div
            key={f.key}
            className="card card-hover animate-fade-up p-5 text-start text-sm sm:text-center"
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            <div className="mb-2 text-3xl">{f.icon}</div>
            <div className="opacity-80">{FEATURE_TEXT[f.key][locale]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
