"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { copy, localizedPath, type Locale } from "@/lib/content";

type AuthMode = "sign-in" | "sign-up";
type FormMessage = { tone: "info" | "success" | "error"; text: string };

function messageClass(tone: FormMessage["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-blue-200 bg-blue-50 text-[var(--brand-blue)]";
}

async function syncProfile() {
  await fetch("/api/auth/profile", {
    method: "POST",
  });
}

async function isAdminSession() {
  const response = await fetch("/api/auth/admin-status");
  const payload = (await response.json().catch(() => ({}))) as { isAdmin?: boolean };

  return response.ok && payload.isAdmin === true;
}

export function AuthForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const t = copy[locale];
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<FormMessage>({
    tone: "info",
    text: locale === "es"
      ? "Inicia sesión o crea una cuenta para ver órdenes, garantías y direcciones."
      : "Sign in or create an account to view orders, warranties, and addresses.",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage({ tone: "info", text: locale === "es" ? "Procesando..." : "Processing..." });

    try {
      if (mode === "sign-up") {
        const response = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, fullName }),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Sign up failed.");
        }

        await syncProfile();
        router.push(localizedPath(locale, "account"));
        router.refresh();
        return;
      }

      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Sign in failed.");
      }

      let redirectTo = new URLSearchParams(window.location.search).get("redirect");

      await syncProfile();

      if (!redirectTo && (await isAdminSession())) {
        redirectTo = localizedPath(locale, "admin");
      }

      redirectTo ||= localizedPath(locale, "account");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : locale === "es" ? "No se pudo autenticar." : "Authentication failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-black text-slate-950">
        {mode === "sign-in" ? t.auth.signIn : t.auth.create}
      </h2>
      <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${messageClass(message.tone)}`}>
        {message.text}
      </p>
      <div className="mt-8 space-y-4">
        {mode === "sign-up" ? (
          <label className="block text-sm font-bold text-slate-700">
            {locale === "es" ? "Nombre completo" : "Full name"}
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" />
          </label>
        ) : null}
        <label className="block text-sm font-bold text-slate-700">
          {t.auth.email}
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" />
        </label>
        <label className="block text-sm font-bold text-slate-700">
          {t.auth.password}
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={6} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" />
        </label>
      </div>
      <button disabled={loading} className="mt-6 w-full rounded-full bg-[var(--brand-blue)] px-5 py-4 font-black text-white transition hover:bg-[var(--brand-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? (locale === "es" ? "Procesando..." : "Processing...") : mode === "sign-in" ? t.auth.signIn : t.auth.create}
      </button>
      <button type="button" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} className="mt-3 w-full rounded-full border border-slate-300 px-5 py-4 font-black text-slate-950 hover:bg-slate-50">
        {mode === "sign-in" ? t.auth.create : t.auth.signIn}
      </button>
    </form>
  );
}
