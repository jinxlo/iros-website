"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy, localizedPath, type Locale } from "@/lib/content";

export function AccountPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const response = await fetch("/api/auth/session");
      const payload = (await response.json().catch(() => ({}))) as { user?: { id: string; email: string } };
      setUser(response.ok ? payload.user || null : null);
      setLoading(false);
    }

    void loadUser();
  }, []);

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setUser(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--brand-blue)]">
            iroselectronics
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            {t.account.title}
          </h1>
          <p className="mt-4 text-slate-600">
            {loading
              ? locale === "es" ? "Cargando sesión..." : "Loading session..."
              : user
                ? `${locale === "es" ? "Sesión activa" : "Signed in"}: ${user.email}`
                : t.account.subtitle}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <button type="button" onClick={signOut} className="rounded-full bg-[var(--brand-blue)] px-6 py-3 font-black text-white transition hover:bg-[var(--brand-blue-dark)]">
                {locale === "es" ? "Cerrar sesión" : "Sign out"}
              </button>
            ) : (
              <Link href={localizedPath(locale, "login")} className="rounded-full bg-[var(--brand-blue)] px-6 py-3 text-center font-black text-white transition hover:bg-[var(--brand-blue-dark)]">
                {t.auth.signIn}
              </Link>
            )}
            <Link href={localizedPath(locale, "products")} className="rounded-full border border-slate-300 px-6 py-3 text-center font-black text-slate-950 transition hover:bg-slate-50">
              {locale === "es" ? "Comprar productos" : "Shop products"}
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[t.account.orders, t.account.addresses, t.account.profile].map((item) => (
            <section key={item} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">{item}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {user
                  ? locale === "es"
                    ? "Conectado con autenticación local. Los datos de órdenes y direcciones quedan en PostgreSQL local."
                    : "Connected with local auth. Order and address data lives in local PostgreSQL."
                  : locale === "es"
                    ? "Inicia sesión para ver esta información."
                    : "Sign in to view this information."}
              </p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
