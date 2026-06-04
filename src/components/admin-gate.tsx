"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPanel } from "@/components/admin-panel";
import { localizedPath, type Locale } from "@/lib/content";

type GateStatus = "checking" | "allowed" | "denied" | "signed-out";

export function AdminGate({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAccess() {
      const response = await fetch("/api/auth/admin-status");
      const payload = (await response.json().catch(() => ({}))) as {
        isAdmin?: boolean;
        error?: string;
        warning?: string;
      };

      if (response.status === 401) {
        setStatus("signed-out");
        return;
      }

      if (response.ok && payload.isAdmin) {
        setStatus("allowed");
        return;
      }

      setMessage(payload.error || payload.warning || (locale === "es" ? "Esta cuenta no tiene acceso administrativo." : "This account does not have admin access."));
      setStatus("denied");
    }

    void checkAccess();
  }, [locale]);

  if (status === "allowed") {
    return <AdminPanel locale={locale} />;
  }

  const loginHref = `${localizedPath(locale, "login")}?redirect=${encodeURIComponent(localizedPath(locale, "admin"))}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--brand-blue)]">Admin</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          {locale === "es" ? "Acceso administrativo" : "Admin access"}
        </h1>
        <p className="mt-4 text-slate-600">
          {status === "checking"
            ? locale === "es" ? "Verificando sesión..." : "Checking session..."
            : status === "signed-out"
              ? locale === "es" ? "Inicia sesión con una cuenta administradora para continuar." : "Sign in with an admin account to continue."
              : message}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={loginHref} className="rounded-full bg-[var(--brand-blue)] px-6 py-3 font-black text-white transition hover:bg-[var(--brand-blue-dark)]">
            {locale === "es" ? "Iniciar sesión" : "Sign in"}
          </Link>
          <Link href={localizedPath(locale, "home")} className="rounded-full border border-slate-300 px-6 py-3 font-black text-slate-950 transition hover:bg-slate-50">
            {locale === "es" ? "Volver a la tienda" : "Back to store"}
          </Link>
        </div>
      </section>
    </main>
  );
}
