"use client";

import { useI18n } from "@/lib/i18n";

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "he" : "en")}
      className="rounded-md border px-3 py-1.5 text-sm"
      style={{ borderColor: "var(--border)" }}
      aria-label="Toggle language"
    >
      {locale === "en" ? "עברית" : "English"}
    </button>
  );
}
