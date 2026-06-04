import Image from "next/image";
import Link from "next/link";
import { businessContact, googleMapsUrl, instagramUrl } from "@/lib/business";
import { copy, localizedPath, type Locale } from "@/lib/content";

function InstagramIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.8" cy="7.2" r="1" fill="currentColor" />
    </svg>
  );
}

function GoogleMapsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <footer id="soporte" className="border-t border-[var(--brand-blue)] bg-[var(--brand-ink)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_0.8fr_1fr_1fr] lg:px-8">
        <div>
          <Link
            href={localizedPath(locale, "home")}
            className="relative block h-20 w-56"
          >
            <Image
              src="/logos/iroslogo.png"
              alt="iroselectronics"
              fill
              sizes="224px"
              className="object-contain object-left"
            />
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            {t.footer.tagline}
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-400">
            {t.domain}
          </p>
        </div>
        <div>
          <h3 className="font-bold">{t.nav.products}</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            {t.categories.slice(0, 4).map((category) => (
              <Link key={category} href={localizedPath(locale, "products")}>
                {category}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold">{locale === "es" ? "Visítanos" : "Visit us"}</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 font-bold text-white transition hover:text-[var(--brand-cyan-light)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f97316] via-[#db2777] to-[#7c3aed] text-white">
                <InstagramIcon />
              </span>
              <span>Instagram {businessContact.instagramHandle}</span>
            </a>
            <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 leading-6 transition hover:text-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1a73e8]">
                <GoogleMapsIcon />
              </span>
              <span>{businessContact.locationLabel[locale]}</span>
            </a>
            <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-black text-white transition hover:border-[var(--brand-cyan)] hover:bg-white/10">
              <GoogleMapsIcon />
              {businessContact.visitStore[locale]}
            </a>
          </div>
        </div>
        <div>
          <h3 className="font-bold">{t.footer.newsletter}</h3>
          <div className="mt-4 flex rounded-full bg-white p-1">
            <input
              placeholder="email@domain.com"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-slate-950 outline-none"
            />
            <button className="rounded-full bg-[var(--brand-cyan)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--brand-cyan-light)]">
              OK
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400">
        © 2026 iroselectronics. {t.footer.rights}
      </div>
    </footer>
  );
}
