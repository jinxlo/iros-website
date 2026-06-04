import { AuthForm } from "@/components/auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy, type Locale } from "@/lib/content";

export function AuthPage({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader locale={locale} />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
        <section className="flex min-h-[520px] flex-col justify-between rounded-[2.5rem] bg-[var(--brand-blue)] p-8 text-white shadow-xl shadow-[rgba(6,71,131,0.18)] sm:p-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-300">
              iroselectronics account
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-black tracking-tight sm:text-6xl">
              {t.auth.title}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
              {t.auth.subtitle}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[t.account.orders, t.account.addresses, t.account.profile].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold">
                {item}
              </div>
            ))}
          </div>
        </section>
        <AuthForm locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
