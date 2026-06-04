"use client";

import { useState } from "react";
import type { Locale } from "@/lib/content";
import { useSiteContent } from "@/stores/site-content-context";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
};

function TextField({ label, value, onChange, textarea = false }: TextFieldProps) {
  const className =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[var(--brand-cyan)] focus:ring-4 focus:ring-[rgba(10,154,211,0.12)]";

  return (
    <label className="block text-sm font-black text-slate-700">
      {label}
      {textarea ? (
        <textarea
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </label>
  );
}

function AdminSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}

function CmsStatusCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--brand-blue)]">{detail}</p>
    </article>
  );
}

export function AdminContentEditor({ locale }: { locale: Locale }) {
  const [activeCmsSection, setActiveCmsSection] = useState("overview");
  const {
    content,
    updateLocalized,
    updateNestedLocalized,
    updateServiceTile,
    updateCollectionTile,
    updateShowcasePanel,
    updateInstagramVideo,
    updateInstagramVideoUrl,
    updateSeasonalBannerSetting,
    updateHeroImage,
    updateCollectionImage,
    updateShowcaseImage,
    resetContent,
  } = useSiteContent();
  const labels =
    locale === "es"
      ? {
          title: "Editor visual del storefront",
          subtitle:
            "Estos cambios actualizan la página principal en este navegador. La estructura está lista para guardarse en Supabase cuando conectemos la base de datos.",
          reset: "Restaurar contenido inicial",
          announcement: "Anuncio superior del header",
          hero: "Hero principal",
          services: "Beneficios con íconos",
          collections: "Colecciones visuales",
          showcases: "Vitrinas de producto",
          featured: "Sección de productos destacados",
          seasonal: "Banner promocional de temporada",
          instagram: "Videos de Instagram",
          promo: "Banner promocional final",
          eyebrow: "Etiqueta superior",
          headline: "Título",
          body: "Texto descriptivo",
          primaryCta: "Botón principal",
          secondaryCta: "Botón secundario",
          productTitle: "Título del producto destacado",
          productMeta: "Detalle del producto destacado",
          productPrice: "Precio del producto destacado",
          cta: "CTA",
          kicker: "Etiqueta",
          priceLabel: "Precio / mensaje comercial",
          stat: "Dato destacado",
          imageUrl: "URL de imagen del producto/sección",
          theme: "Tema visual: default, valentines, mothers, holiday",
          ctaHref: "URL del botón",
          videoUrl: "URL del reel o post de Instagram",
          thumbnailUrl: "URL de miniatura opcional",
        }
      : {
          title: "Storefront visual editor",
          subtitle:
            "These changes update the homepage in this browser. The structure is ready to be saved in Supabase once we connect the database.",
          reset: "Restore initial content",
          announcement: "Header announcement",
          hero: "Main hero",
          services: "Icon benefits",
          collections: "Visual collections",
          showcases: "Product showcases",
          featured: "Featured products section",
          seasonal: "Seasonal promo banner",
          instagram: "Instagram videos",
          promo: "Final promo banner",
          eyebrow: "Eyebrow",
          headline: "Headline",
          body: "Body text",
          primaryCta: "Primary button",
          secondaryCta: "Secondary button",
          productTitle: "Featured product title",
          productMeta: "Featured product detail",
          productPrice: "Featured product price",
          cta: "CTA",
          kicker: "Kicker",
          priceLabel: "Price / sales message",
          stat: "Highlighted stat",
          imageUrl: "Product/section image URL",
          theme: "Visual theme: default, valentines, mothers, holiday",
          ctaHref: "Button URL",
          videoUrl: "Instagram reel or post URL",
          thumbnailUrl: "Optional thumbnail URL",
        };
  const cmsMenu = locale === "es"
    ? [
        ["overview", "Resumen CMS"],
        ["homepage", "Página principal"],
        ["promotions", "Promociones"],
        ["social", "Instagram y redes"],
        ["media", "Biblioteca media"],
        ["pages", "Páginas"],
        ["seo", "SEO"],
        ["settings", "Ajustes CMS"],
      ]
    : [
        ["overview", "CMS overview"],
        ["homepage", "Homepage"],
        ["promotions", "Promotions"],
        ["social", "Instagram and social"],
        ["media", "Media library"],
        ["pages", "Pages"],
        ["seo", "SEO"],
        ["settings", "CMS settings"],
      ];

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--brand-blue)]">
            CMS
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            {labels.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {labels.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={resetContent}
          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[var(--brand-blue)] hover:bg-[var(--brand-blue)] hover:text-white"
        >
          {labels.reset}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-6">
          <p className="px-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">CMS menu</p>
          <nav className="mt-4 grid gap-2">
            {cmsMenu.map(([id, label]) => (
              <a
                key={id}
                href={`#cms-${id}`}
                onClick={() => setActiveCmsSection(id)}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                  activeCmsSection === id
                    ? "bg-[var(--brand-blue)] text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[var(--brand-blue)]"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {locale === "es"
              ? "Administra contenido, campañas, redes, media, páginas y SEO desde un solo módulo."
              : "Manage content, campaigns, social, media, pages, and SEO from one module."}
          </div>
        </aside>

        <div className="grid gap-6">
          <section id="cms-overview" className="scroll-mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-blue)]">CMS</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  {locale === "es" ? "Centro de contenido" : "Content hub"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {locale === "es"
                    ? "Estructura lista para mover de localStorage a Supabase CMS cuando la migración esté aplicada."
                    : "Structure ready to move from localStorage to Supabase CMS once the migration is applied."}
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">
                {locale === "es" ? "Borrador local" : "Local draft"}
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <CmsStatusCard title={locale === "es" ? "Secciones" : "Sections"} value="8" detail="Homepage + CMS" />
              <CmsStatusCard title={locale === "es" ? "Campañas" : "Campaigns"} value="2" detail="Seasonal + promo" />
              <CmsStatusCard title="Instagram" value={String(content.instagramVideos.length)} detail="Reels/cards" />
              <CmsStatusCard title="SEO" value="Ready" detail="Metadata module" />
            </div>
          </section>

          <div id="cms-homepage" className="scroll-mt-6 grid gap-6 lg:grid-cols-2">
            <AdminSection title={labels.announcement}>
              <TextField
                label={labels.announcement}
                value={content.announcement[locale]}
                onChange={(value) => updateLocalized("announcement", locale, value)}
              />
            </AdminSection>

        <AdminSection title={labels.featured}>
          <TextField
            label={labels.headline}
            value={content.featured.title[locale]}
            onChange={(value) => updateNestedLocalized("featured", "title", locale, value)}
          />
          <TextField
            label={labels.body}
            value={content.featured.subtitle[locale]}
            onChange={(value) => updateNestedLocalized("featured", "subtitle", locale, value)}
            textarea
          />
          <TextField
            label={labels.cta}
            value={content.featured.cta[locale]}
            onChange={(value) => updateNestedLocalized("featured", "cta", locale, value)}
          />
        </AdminSection>

        <AdminSection title={labels.hero}>
          <TextField
            label={labels.eyebrow}
            value={content.hero.eyebrow[locale]}
            onChange={(value) => updateNestedLocalized("hero", "eyebrow", locale, value)}
          />
          <TextField
            label={labels.headline}
            value={content.hero.title[locale]}
            onChange={(value) => updateNestedLocalized("hero", "title", locale, value)}
            textarea
          />
          <TextField
            label={labels.body}
            value={content.hero.subtitle[locale]}
            onChange={(value) => updateNestedLocalized("hero", "subtitle", locale, value)}
            textarea
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={labels.primaryCta}
              value={content.hero.primaryCta[locale]}
              onChange={(value) => updateNestedLocalized("hero", "primaryCta", locale, value)}
            />
            <TextField
              label={labels.secondaryCta}
              value={content.hero.secondaryCta[locale]}
              onChange={(value) => updateNestedLocalized("hero", "secondaryCta", locale, value)}
            />
          </div>
          <TextField
            label={labels.productTitle}
            value={content.hero.productTitle[locale]}
            onChange={(value) => updateNestedLocalized("hero", "productTitle", locale, value)}
          />
          <TextField
            label={labels.productMeta}
            value={content.hero.productMeta[locale]}
            onChange={(value) => updateNestedLocalized("hero", "productMeta", locale, value)}
          />
          <TextField
            label={labels.productPrice}
            value={content.hero.productPrice[locale]}
            onChange={(value) => updateNestedLocalized("hero", "productPrice", locale, value)}
          />
          <TextField
            label={labels.imageUrl}
            value={content.hero.imageUrl}
            onChange={updateHeroImage}
          />
        </AdminSection>

        <AdminSection id="cms-promotions" title={labels.promo}>
          <TextField
            label={labels.kicker}
            value={content.promo.kicker[locale]}
            onChange={(value) => updateNestedLocalized("promo", "kicker", locale, value)}
          />
          <TextField
            label={labels.headline}
            value={content.promo.title[locale]}
            onChange={(value) => updateNestedLocalized("promo", "title", locale, value)}
            textarea
          />
          <TextField
            label={labels.body}
            value={content.promo.body[locale]}
            onChange={(value) => updateNestedLocalized("promo", "body", locale, value)}
            textarea
          />
          <TextField
            label={labels.cta}
            value={content.promo.cta[locale]}
            onChange={(value) => updateNestedLocalized("promo", "cta", locale, value)}
          />
        </AdminSection>

        <AdminSection title={labels.seasonal}>
          <TextField
            label={labels.theme}
            value={content.seasonalBanner.theme}
            onChange={(value) => updateSeasonalBannerSetting("theme", value)}
          />
          <TextField
            label={labels.kicker}
            value={content.seasonalBanner.kicker[locale]}
            onChange={(value) => updateNestedLocalized("seasonalBanner", "kicker", locale, value)}
          />
          <TextField
            label={labels.headline}
            value={content.seasonalBanner.title[locale]}
            onChange={(value) => updateNestedLocalized("seasonalBanner", "title", locale, value)}
            textarea
          />
          <TextField
            label={labels.body}
            value={content.seasonalBanner.body[locale]}
            onChange={(value) => updateNestedLocalized("seasonalBanner", "body", locale, value)}
            textarea
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={labels.cta}
              value={content.seasonalBanner.cta[locale]}
              onChange={(value) => updateNestedLocalized("seasonalBanner", "cta", locale, value)}
            />
            <TextField
              label={labels.ctaHref}
              value={content.seasonalBanner.ctaHref}
              onChange={(value) => updateSeasonalBannerSetting("ctaHref", value)}
            />
          </div>
        </AdminSection>
          </div>

          <div id="cms-social" className="scroll-mt-6 grid gap-6">
        <AdminSection title={labels.instagram}>
          <div className="grid gap-4 lg:grid-cols-3">
            {content.instagramVideos.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">
                  {item.id}
                </p>
                <div className="mt-4 grid gap-4">
                  <TextField
                    label={labels.headline}
                    value={item.title[locale]}
                    onChange={(value) => updateInstagramVideo(item.id, "title", locale, value)}
                  />
                  <TextField
                    label={labels.body}
                    value={item.description[locale]}
                    onChange={(value) => updateInstagramVideo(item.id, "description", locale, value)}
                    textarea
                  />
                  <TextField
                    label={labels.videoUrl}
                    value={item.url}
                    onChange={(value) => updateInstagramVideoUrl(item.id, "url", value)}
                  />
                  <TextField
                    label={labels.thumbnailUrl}
                    value={item.imageUrl}
                    onChange={(value) => updateInstagramVideoUrl(item.id, "imageUrl", value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminSection>
          </div>

          <div id="cms-media" className="scroll-mt-6 grid gap-6">
            <AdminSection title={locale === "es" ? "Biblioteca media" : "Media library"}>
              <div className="grid gap-4 md:grid-cols-3">
                <CmsStatusCard title={locale === "es" ? "Imágenes" : "Images"} value="URLs" detail={locale === "es" ? "Hero, colecciones y vitrinas" : "Hero, collections, and showcases"} />
                <CmsStatusCard title={locale === "es" ? "Videos" : "Videos"} value="Instagram" detail={locale === "es" ? "Reels enlazados" : "Linked reels"} />
                <CmsStatusCard title={locale === "es" ? "Storage" : "Storage"} value="Supabase" detail={locale === "es" ? "Listo para buckets" : "Ready for buckets"} />
              </div>
            </AdminSection>
          </div>

          <div className="grid gap-6">
        <AdminSection title={labels.services}>
          <div className="grid gap-4 lg:grid-cols-2">
            {content.serviceTiles.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">
                  {item.id}
                </p>
                <div className="mt-4 grid gap-4">
                  <TextField
                    label={labels.headline}
                    value={item.title[locale]}
                    onChange={(value) => updateServiceTile(item.id, "title", locale, value)}
                  />
                  <TextField
                    label={labels.body}
                    value={item.description[locale]}
                    onChange={(value) => updateServiceTile(item.id, "description", locale, value)}
                    textarea
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminSection>

        <AdminSection title={labels.collections}>
          <div className="grid gap-4 lg:grid-cols-3">
            {content.collections.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">
                  {item.id}
                </p>
                <div className="mt-4 grid gap-4">
                  <TextField
                    label={labels.headline}
                    value={item.title[locale]}
                    onChange={(value) => updateCollectionTile(item.id, "title", locale, value)}
                  />
                  <TextField
                    label={labels.body}
                    value={item.subtitle[locale]}
                    onChange={(value) => updateCollectionTile(item.id, "subtitle", locale, value)}
                    textarea
                  />
                  <TextField
                    label={labels.cta}
                    value={item.cta[locale]}
                    onChange={(value) => updateCollectionTile(item.id, "cta", locale, value)}
                  />
                  <TextField
                    label={labels.imageUrl}
                    value={item.imageUrl}
                    onChange={(value) => updateCollectionImage(item.id, value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminSection>

        <AdminSection title={labels.showcases}>
          <div className="grid gap-4 lg:grid-cols-2">
            {content.showcases.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">
                  {item.id}
                </p>
                <div className="mt-4 grid gap-4">
                  <TextField
                    label={labels.kicker}
                    value={item.kicker[locale]}
                    onChange={(value) => updateShowcasePanel(item.id, "kicker", locale, value)}
                  />
                  <TextField
                    label={labels.headline}
                    value={item.title[locale]}
                    onChange={(value) => updateShowcasePanel(item.id, "title", locale, value)}
                  />
                  <TextField
                    label={labels.body}
                    value={item.description[locale]}
                    onChange={(value) => updateShowcasePanel(item.id, "description", locale, value)}
                    textarea
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label={labels.priceLabel}
                      value={item.priceLabel[locale]}
                      onChange={(value) => updateShowcasePanel(item.id, "priceLabel", locale, value)}
                    />
                    <TextField
                      label={labels.stat}
                      value={item.stat[locale]}
                      onChange={(value) => updateShowcasePanel(item.id, "stat", locale, value)}
                    />
                  </div>
                  <TextField
                    label={labels.imageUrl}
                    value={item.imageUrl}
                    onChange={(value) => updateShowcaseImage(item.id, value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminSection>
          </div>

          <div id="cms-pages" className="scroll-mt-6 grid gap-6 lg:grid-cols-2">
            <AdminSection title={locale === "es" ? "Páginas del sitio" : "Site pages"}>
              <div className="grid gap-3">
                {["Home", "Productos", "Checkout", "Cuenta", "Admin"].map((page) => (
                  <div key={page} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="font-black text-slate-950">{page}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">Live</span>
                  </div>
                ))}
              </div>
            </AdminSection>
            <AdminSection id="cms-seo" title={locale === "es" ? "SEO y metadatos" : "SEO and metadata"}>
              <TextField label="Meta title" value="iroselectronics | Electrónica y electrodomésticos" onChange={() => undefined} />
              <TextField label="Meta description" value="Tienda profesional de electrónica y electrodomésticos para hogares modernos." onChange={() => undefined} textarea />
              <p className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-[var(--brand-blue)]">
                {locale === "es"
                  ? "Estos campos están preparados para persistirse en Supabase CMS en la siguiente iteración."
                  : "These fields are prepared to persist in Supabase CMS in the next iteration."}
              </p>
            </AdminSection>
          </div>

          <div id="cms-settings" className="scroll-mt-6 grid gap-6">
            <AdminSection title={locale === "es" ? "Ajustes CMS" : "CMS settings"}>
              <div className="grid gap-4 md:grid-cols-3">
                <CmsStatusCard title="Drafts" value="Local" detail="localStorage" />
                <CmsStatusCard title="Publishing" value="Manual" detail={locale === "es" ? "Listo para workflow" : "Workflow ready"} />
                <CmsStatusCard title="Supabase" value="Pending" detail={locale === "es" ? "Requiere migración" : "Migration required"} />
              </div>
            </AdminSection>
          </div>
        </div>
      </div>
    </section>
  );
}
