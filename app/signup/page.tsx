"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      setError(t.auth.usernameHint);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: trimmed } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else if (data.session) {
      router.push("/profile");
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="animate-fade-up mb-4 text-xl font-bold">{t.auth.signupTitle}</h1>
      {!isSupabaseConfigured && (
        <p className="card mb-4 p-3 text-sm opacity-70">{t.auth.needsSupabase}</p>
      )}
      {success ? (
        <div className="card animate-fade-up p-4 text-sm">
          <p className="mb-3">{t.auth.confirmEmail}</p>
          <a href="/login" className="btn-accent inline-block rounded-lg px-4 py-2 text-sm font-semibold">
            {t.auth.loginTitle}
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card animate-fade-up space-y-3 p-4">
          <input
            type="text"
            required
            minLength={3}
            maxLength={20}
            placeholder={t.auth.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            disabled={!isSupabaseConfigured}
          />
          <p className="text-xs opacity-50">{t.auth.usernameHint}</p>
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
            minLength={6}
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            disabled={!isSupabaseConfigured}
          />
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <button
            type="submit"
            disabled={!isSupabaseConfigured || loading}
            className="btn-accent w-full rounded-md py-2 text-sm font-semibold disabled:opacity-40"
          >
            {t.auth.submit}
          </button>
          <a href="/login" className="block text-center text-xs opacity-70 hover:opacity-100">
            {t.auth.haveAccount}
          </a>
        </form>
      )}
    </div>
  );
}
