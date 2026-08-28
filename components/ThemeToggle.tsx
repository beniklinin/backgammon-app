"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";
import { useI18n } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-md border px-3 py-1.5 text-sm"
      style={{ borderColor: "var(--border)" }}
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? `🌙 ${t.theme.dark}` : `☀️ ${t.theme.light}`}
    </button>
  );
}
