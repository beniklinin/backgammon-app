"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      router.push("/profile");
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-bold">{t.auth.loginTitle}</h1>
      {!isSupabaseConfigured && (
        <p className="card mb-4 p-3 text-sm opacity-70">{t.auth.needsSupabase}</p>
      )}
      <form onSubmit={onSubmit} className="card space-y-3 p-4">
        <input
          type="email"
          required
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          disabled={!isSupabaseConfigured}
        />
        <input
          type="password"
          required
          placeholder={t.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          disabled={!isSupabaseConfigured}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={!isSupabaseConfigured || loading}
          className="w-full rounded-md py-2 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {t.auth.submit}
        </button>
        <a href="/signup" className="block text-center text-xs opacity-70 hover:opacity-100">
          {t.auth.noAccount}
        </a>
      </form>
    </div>
  );
}
