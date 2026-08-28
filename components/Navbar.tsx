"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleToggle } from "./LocaleToggle";

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative rounded-md px-3 py-1.5 transition-colors hover:opacity-80"
      style={{ color: active ? "var(--accent)" : "inherit", fontWeight: active ? 700 : 500 }}
    >
      {children}
      {active && (
        <span
          className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      )}
    </Link>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const { user, signOut, configured } = useAuth();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <NavLink href="/play" onClick={() => setOpen(false)}>
        {t.nav.play}
      </NavLink>
      <NavLink href="/leaderboard" onClick={() => setOpen(false)}>
        {t.nav.leaderboard}
      </NavLink>
      {configured && user ? (
        <>
          <NavLink href="/profile" onClick={() => setOpen(false)}>
            {t.nav.profile}
          </NavLink>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="rounded-md px-3 py-1.5 text-start hover:opacity-80"
          >
            {t.nav.logout}
          </button>
        </>
      ) : (
        <>
          <NavLink href="/login" onClick={() => setOpen(false)}>
            {t.nav.login}
          </NavLink>
          <NavLink href="/signup" onClick={() => setOpen(false)}>
            {t.nav.signup}
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <header
      className="sticky top-4 z-40 mx-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 backdrop-blur sm:mx-auto sm:max-w-5xl"
      style={{
        background: "color-mix(in srgb, var(--card) 82%, transparent)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <Link href="/" className="flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--accent)" }}>
        <span className="text-2xl">🎲</span> {t.appName}
      </Link>

      <nav className="hidden flex-wrap items-center gap-1 text-sm sm:flex">
        {links}
        <LocaleToggle />
        <ThemeToggle />
      </nav>

      <div className="flex items-center gap-2 sm:hidden">
        <LocaleToggle />
        <ThemeToggle />
        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border px-2.5 py-1.5 text-sm"
          style={{ borderColor: "var(--border)" }}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="animate-fade-up flex w-full flex-col gap-1 border-t pt-3 text-sm sm:hidden" style={{ borderColor: "var(--border)" }}>
          {links}
        </nav>
      )}
    </header>
  );
}
