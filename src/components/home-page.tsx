"use client";

import Link from "next/link";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ApplianceIcon, ApplianceVisual } from "@/components/appliance-icon";
import { ProductImage } from "@/components/product-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { businessContact, googleMapsUrl, instagramUrl } from "@/lib/business";
import { categoryHref, categoryLabel } from "@/lib/categories";
import { formatPrice, localizedPath, type Locale } from "@/lib/content";
import type { HomepageProduct as HomepageProductRecord } from "@/lib/data/home-products";
import type { InstagramVideo, SeasonalBanner as SeasonalBannerContent } from "@/lib/site-content";
import { useSiteContent } from "@/stores/site-content-context";

type HomepageProduct = HomepageProductRecord;

function productHeroCopy(product: HomepageProduct | undefined, locale: Locale) {
  if (!product) {
    return locale === "es"
      ? {
          eyebrow: "Catálogo iroselectronics",
          title: "Electrodomésticos y tecnología para tu hogar.",
          subtitle: "Descubre productos publicados con imagen real, precio actualizado y disponibilidad confirmada.",
          primaryCta: "Ver catálogo",
          secondaryCta: "Ver colecciones",
          badge: "Catálogo real",
        }
      : {
          eyebrow: "iroselectronics catalog",
          title: "Appliances and technology for your home.",
          subtitle: "Discover published products with real images, current pricing, and confirmed availability.",
          primaryCta: "View catalog",
          secondaryCta: "View collections",
          badge: "Real catalog",
        };
  }

  return locale === "es"
    ? {
        eyebrow: `${product.brand} · ${product.category}`,
        title: product.name,
        subtitle: `Producto publicado, imagen real y compra confiable. SKU ${product.sku}.`,
        primaryCta: "Comprar este producto",
        secondaryCta: "Ver más productos",
        badge: "Disponible ahora",
      }
    : {
        eyebrow: `${product.brand} · ${product.category}`,
        title: product.name,
        subtitle: `Published product, real product image, and trusted shopping. SKU ${product.sku}.`,
        primaryCta: "Shop this product",
        secondaryCta: "View more products",
        badge: "Available now",
      };
}

function ProductShowcaseSlider({ locale, showcaseProducts, activeIndex, setActiveIndex }: { locale: Locale; showcaseProducts: HomepageProduct[]; activeIndex: number; setActiveIndex: Dispatch<SetStateAction<number>> }) {
  const activeProduct = showcaseProducts[activeIndex] || showcaseProducts[0];
  const activeCopy = productHeroCopy(activeProduct, locale);

  useEffect(() => {
    if (showcaseProducts.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % showcaseProducts.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [setActiveIndex, showcaseProducts.length]);

  return (
    <div className="group relative min-h-[340px] overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 lg:min-h-[460px]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#003a83] via-[#0a9ad3] to-[#d8f6ff] transition-all duration-700" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(216,246,255,0.5),transparent_26rem)]" />
      <div className="absolute inset-0 flex items-center justify-center px-8 pb-28 pt-10">
        <div
          key={activeProduct?.id || "loading"}
          className={`animate-showcase-pop relative h-72 w-72 sm:h-96 sm:w-96 ${
            activeProduct?.imageUrl
              ? "rounded-[2rem] bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 p-4 shadow-2xl shadow-blue-950/15 ring-1 ring-cyan-100/70"
              : "rounded-[2.25rem] bg-white/20 shadow-2xl ring-1 ring-white/40 backdrop-blur-md"
          }`}
        >
          {activeProduct?.imageUrl ? (
            <ProductImage src={activeProduct.imageUrl} alt={activeProduct.imageAlt} className="product-image-contrast h-full w-full object-contain transition-opacity duration-200" loading="eager" />
          ) : (
            <>
              <div className="absolute left-10 right-10 top-10 h-14 rounded-2xl bg-[var(--brand-blue)]" />
              <div className="absolute inset-x-9 bottom-11 h-56 rounded-[2rem] bg-gradient-to-br from-slate-100 to-cyan-100 shadow-inner" />
              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-[16px] border-[var(--brand-cyan)]" />
            </>
          )}
        </div>
      </div>
      <div className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-blue)] shadow-sm">
        {activeCopy.badge}
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md sm:left-6 sm:right-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-[var(--brand-blue)]">
              {activeProduct?.brand || "iroselectronics"}
            </p>
            <p className="truncate text-xs font-semibold text-slate-600">
              {activeProduct?.category || (locale === "es" ? "Producto destacado" : "Featured product")}
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-[rgba(10,154,211,0.1)] px-3 py-1 text-sm font-black text-[var(--brand-blue)]">
            {activeProduct ? formatPrice(activeProduct.price) : ""}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {showcaseProducts.slice(0, 12).map((product, index) => (
            <button
              key={product.id}
              type="button"
              aria-label={`${locale === "es" ? "Mostrar" : "Show"} ${product.name}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "w-8 bg-[var(--brand-blue)]"
                  : "w-2.5 bg-slate-300 hover:bg-[var(--brand-cyan)]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HomepageProductCard({ product, locale, onQuickView }: { product: HomepageProduct; locale: Locale; onQuickView: (product: HomepageProduct) => void }) {
  const copy = productHeroCopy(product, locale);
  const productHref = `${localizedPath(locale, "products")}/${product.slug}`;

  return (
    <article className="group min-w-[280px] overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/80 hover:ring-[var(--brand-cyan)] md:min-w-0">
      <div className="relative h-56 bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 sm:h-60">
        {product.imageUrl ? (
          <ProductImage src={product.imageUrl} alt={product.imageAlt} className="product-image-contrast h-full w-full object-contain p-5 transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute bottom-8 left-1/2 h-40 w-44 -translate-x-1/2 rounded-[2rem] bg-white/55 shadow-2xl ring-1 ring-white/70 backdrop-blur-md" />
        )}
        <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-blue)] shadow-sm">
          {copy.badge}
        </span>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition duration-300 group-hover:bg-slate-950/15 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="pointer-events-auto rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]"
          >
            {locale === "es" ? "Vista rápida" : "Quick view"}
          </button>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">
          {product.brand}
        </p>
        <h3 className="mt-2 line-clamp-2 min-h-12 text-base font-black leading-tight text-slate-950 sm:text-lg">
          <Link href={productHref} className="hover:text-[var(--brand-blue)]">
            {product.name}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
          {product.description || copy.subtitle}
        </p>
        <div className="mt-5 flex items-end justify-between gap-4">
          <p className="text-xl font-black text-slate-950">{formatPrice(product.price)}</p>
          <Link href={productHref} className="text-sm font-black text-[var(--brand-blue)] hover:text-[var(--brand-cyan)]">
            {locale === "es" ? "Comprar" : "Shop"} →
          </Link>
        </div>
      </div>
    </article>
  );
}

function HomepageQuickViewModal({ product, locale, onClose }: { product: HomepageProduct; locale: Locale; onClose: () => void }) {
  const productHref = `${localizedPath(locale, "products")}/${product.slug}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:p-6 lg:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={locale === "es" ? "Vista rápida de producto" : "Product quick view"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative my-auto grid w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-slate-200 lg:grid-cols-[1fr_0.95fr]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-black text-slate-700 shadow-sm"
        >
          {locale === "es" ? "Cerrar" : "Close"}
        </button>
        <div className="relative flex min-h-[320px] items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 p-6 sm:p-8">
          {product.imageUrl ? (
            <ProductImage src={product.imageUrl} alt={product.imageAlt} className="product-image-contrast h-full w-full object-contain" loading="eager" />
          ) : (
            <div className="h-52 w-52 rounded-[2rem] bg-white/55 shadow-xl ring-1 ring-white/70" />
          )}
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--brand-blue)]">{product.brand}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">{product.name}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">SKU {product.sku}</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">{product.description}</p>
          <p className="mt-5 text-2xl font-black text-[var(--brand-blue)]">{formatPrice(product.price)}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href={productHref} onClick={onClose} className="rounded-full bg-[var(--brand-blue)] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[var(--brand-blue-dark)]">
              {locale === "es" ? "Ver producto" : "View product"}
            </Link>
            <Link href={localizedPath(locale, "checkout")} onClick={onClose} className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-black text-slate-900 transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]">
              {locale === "es" ? "Comprar" : "Buy now"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const seasonalThemeStyles = {
  default: {
    shell: "from-[var(--brand-blue)] via-[#0a9ad3] to-[#d8f6ff]",
    badge: "bg-white text-[var(--brand-blue)]",
    accent: "bg-cyan-200/80",
  },
  valentines: {
    shell: "from-[#7f1d1d] via-[#db2777] to-[#ffe4e6]",
    badge: "bg-rose-50 text-rose-700",
    accent: "bg-pink-200/90",
  },
  mothers: {
    shell: "from-[#5b21b6] via-[#ec4899] to-[#fef3c7]",
    badge: "bg-fdf2f8 text-fuchsia-700",
    accent: "bg-amber-200/90",
  },
  holiday: {
    shell: "from-[#064e3b] via-[#dc2626] to-[#fef3c7]",
    badge: "bg-emerald-50 text-emerald-800",
    accent: "bg-red-200/90",
  },
};

const brandLogos = [
  { name: "Samsung", src: "/logos/Samsung_Logo.svg.png", logoClass: "max-h-14 max-w-[150px]" },
  { name: "LG", src: "/logos/LG-Logo.png", logoClass: "max-h-16 max-w-[130px]" },
  { name: "KitchenAid", src: "/logos/KitchenAid-Logo.png", logoClass: "max-h-[7rem] w-full max-w-full object-contain" },
  { name: "Ninja", src: "/logos/ninja-logo-1229B631F7-seeklogo.com.png", logoClass: "max-h-16 max-w-[150px]" },
  { name: "Black+Decker", src: "/logos/Black-Decker-Logo.png", logoClass: "max-h-16 max-w-[150px]" },
  { name: "Bosch", src: "/logos/Bosch_logo.png", logoClass: "max-h-14 max-w-[150px]" },
  { name: "Frigidaire", src: "/logos/Frigidaire-Logo.png", logoClass: "max-h-16 max-w-[155px]" },
  { name: "GE", src: "/logos/general-electric-logo-B7E7917A72-seeklogo.com.png", logoClass: "max-h-16 max-w-[130px]" },
  { name: "Electrolux", src: "/logos/logo-Electrolux.png", logoClass: "max-h-16 max-w-[150px]" },
  { name: "Toshiba", src: "/logos/TOSHIBA_Logo.png", logoClass: "max-h-14 max-w-[150px]" },
  { name: "Aiwa", src: "/logos/Aiwa-Logo.wine.png", logoClass: "max-h-20 max-w-[150px]" },
];

function BrandLogoCloud({ locale }: { locale: Locale }) {
  return (
    <section className="bg-[#f2f6f9] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--brand-blue)]">
                {locale === "es" ? "Marcas oficiales" : "Official brands"}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {locale === "es" ? "Trabajamos con marcas líderes" : "We work with leading brands"}
              </h2>
            </div>
            <p className="max-w-xl text-slate-600">
              {locale === "es"
                ? "Tecnología, cocina, lavado, refrigeración y pequeños electrodomésticos con respaldo local."
                : "Technology, kitchen, laundry, refrigeration, and small appliances with local support."}
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {brandLogos.map((brand) => (
              <div key={brand.name} className="flex h-28 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition duration-300 hover:-translate-y-1 hover:border-[var(--brand-cyan)] hover:bg-white hover:shadow-lg">
                <img src={brand.src} alt={brand.name} className={`h-auto w-auto object-contain mix-blend-multiply ${brand.logoClass}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function contentHref(locale: Locale, href: string) {
  if (!href || href === "/productos") {
    return localizedPath(locale, "products");
  }

  return href;
}

function SeasonalPromotionBanner({ banner, locale }: { banner: SeasonalBannerContent; locale: Locale }) {
  const styles = seasonalThemeStyles[banner.theme] || seasonalThemeStyles.default;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className={`relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br ${styles.shell} p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8 lg:p-10`}>
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/20 blur-2xl" />
        <div className={`absolute bottom-8 right-8 hidden h-28 w-28 rounded-[2rem] ${styles.accent} shadow-2xl rotate-12 lg:block`} />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${styles.badge}`}>
              {banner.kicker[locale]}
            </span>
            <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              {banner.title[locale]}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
              {banner.body[locale]}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a href={contentHref(locale, banner.ctaHref)} className="rounded-full bg-white px-7 py-4 text-center font-black text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50">
              {banner.cta[locale]}
            </a>
            <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-7 py-4 text-center font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/10">
              {businessContact.visitStore[locale]}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstagramShowcase({ videos, locale }: { videos: InstagramVideo[]; locale: Locale }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--brand-blue)]">Instagram</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {locale === "es" ? "Videos, ofertas y novedades en acción" : "Videos, deals, and updates in action"}
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            {locale === "es"
              ? "Conecta cada tarjeta con un reel publicado para mostrar demostraciones reales, llegadas nuevas y promociones desde Instagram."
              : "Connect each card to a published reel to showcase real demos, new arrivals, and Instagram promotions."}
          </p>
          <a href={instagramUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-full bg-[var(--brand-blue)] px-6 py-3 font-black text-white transition hover:bg-[var(--brand-blue-dark)]">
            {businessContact.followInstagram[locale]}
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {videos.map((video, index) => (
            <a key={video.id} href={video.url || instagramUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:ring-pink-300">
              <div className="relative h-72 overflow-hidden bg-gradient-to-br from-slate-950 via-fuchsia-700 to-amber-200">
                {video.imageUrl ? (
                  <div style={{ backgroundImage: `url(${video.imageUrl})` }} className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" />
                ) : null}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.32),transparent_16rem)]" />
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-pink-700">
                  Reel {index + 1}
                </div>
                <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-pink-700 shadow-xl transition duration-300 group-hover:scale-110">
                  <span className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-current" />
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-slate-950">{video.title[locale]}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{video.description[locale]}</p>
                <p className="mt-4 text-sm font-black text-pink-700">{businessContact.instagramHandle} →</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage({ locale, initialProducts = [] }: { locale: Locale; initialProducts?: HomepageProduct[] }) {
  const { content } = useSiteContent();
  const [showcaseProducts, setShowcaseProducts] = useState<HomepageProduct[]>(initialProducts);
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<HomepageProduct>();
  const activeShowcaseProduct = showcaseProducts[activeShowcaseIndex] || showcaseProducts[0];
  const heroCopy = productHeroCopy(activeShowcaseProduct, locale);

  useEffect(() => {
    let cancelled = false;

    async function loadHomepageProducts() {
      const response = await fetch("/api/products/home?limit=32");

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { products?: HomepageProduct[] };

      if (!cancelled && payload.products?.length) {
        setShowcaseProducts(payload.products);
        setActiveShowcaseIndex(0);
      }
    }

    void loadHomepageProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!quickViewProduct) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setQuickViewProduct(undefined);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickViewProduct]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader locale={locale} active="home" />
      <main>
        <section className="bg-[#f2f6f9]">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-8">
            <div className="flex min-h-[420px] flex-col justify-center rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:min-h-[460px] sm:p-10 lg:min-h-[500px] lg:p-12">
              <p className="h-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">
                {heroCopy.eyebrow || content.hero.eyebrow[locale]}
              </p>
              <h1 className="mt-4 line-clamp-3 min-h-[84px] text-xl font-black leading-7 tracking-tight text-slate-950 sm:min-h-[96px] sm:text-2xl sm:leading-8 lg:min-h-[108px] lg:text-[1.9rem] lg:leading-9">
                {heroCopy.title || content.hero.title[locale]}
              </h1>
              <p className="mt-3 line-clamp-2 min-h-[44px] text-sm leading-6 text-slate-600 sm:min-h-[48px] sm:text-sm">
                {heroCopy.subtitle || content.hero.subtitle[locale]}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href={activeShowcaseProduct ? `${localizedPath(locale, "products")}/${activeShowcaseProduct.slug}` : localizedPath(locale, "products")}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--brand-blue-dark)]"
                >
                  {heroCopy.primaryCta || content.hero.primaryCta[locale]}
                </Link>
                <a
                  href="#latest"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-cyan)]"
                >
                  {heroCopy.secondaryCta || content.hero.secondaryCta[locale]}
                </a>
              </div>
            </div>

            <ProductShowcaseSlider locale={locale} showcaseProducts={showcaseProducts} activeIndex={activeShowcaseIndex} setActiveIndex={setActiveShowcaseIndex} />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {content.serviceTiles.map((item) => (
              <article key={item.id} className="flex items-center gap-4 rounded-2xl p-3 transition duration-300 hover:bg-slate-50">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(10,154,211,0.10)] text-[var(--brand-blue)]">
                  <ApplianceIcon icon={item.icon} />
                </div>
                <div>
                  <h2 className="font-black text-slate-950">{item.title[locale]}</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {item.description[locale]}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <SeasonalPromotionBanner banner={content.seasonalBanner} locale={locale} />

        <section id="latest" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--brand-blue)]">
              {locale === "es" ? "Descubre iroselectronics.com" : "Discover iroselectronics.com"}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {content.featured.title[locale]}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-slate-600">
              {content.featured.subtitle[locale]}
            </p>
          </div>
          <div className="mt-8 grid auto-cols-[280px] grid-flow-col gap-5 overflow-x-auto pb-4 md:grid-flow-row md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
            {showcaseProducts.length > 0 ? (
              showcaseProducts.slice(0, 8).map((product) => (
                <HomepageProductCard key={product.id} product={product} locale={locale} onQuickView={setQuickViewProduct} />
              ))
            ) : (
              <div className="col-span-full rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                {locale === "es" ? "Cargando productos reales del catálogo..." : "Loading real catalog products..."}
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#f2f6f9] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-slate-950">
                {locale === "es" ? "Ahorra con bundles seleccionados" : "Save with curated bundles"}
              </h2>
              <p className="mt-3 text-slate-600">
                {locale === "es" ? "Secciones editables para combos, temporadas y campañas." : "Editable sections for bundles, seasons, and campaigns."}
              </p>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {[
                {
                  slug: "pequenos-electrodomesticos",
                  imageUrl: "/productos/ninja2.png",
                  tone: "from-white via-[#d8f6ff] to-[#0a9ad3]",
                },
                {
                  slug: "aspiradoras",
                  imageUrl: "/productos/ninja slushie.avif",
                  tone: "from-[#031c36] via-[#064783] to-[#0a9ad3]",
                },
              ].map((spotlight) => {
                const href = categoryHref(locale, spotlight.slug);
                const label = categoryLabel(locale, spotlight.slug);

                return (
                  <Link
                    key={spotlight.slug}
                    href={href}
                    className="group block overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:ring-[var(--brand-cyan)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-cyan)]"
                  >
                    <div
                      className={`relative aspect-[4/3] max-h-[22rem] bg-gradient-to-br ${spotlight.tone} sm:aspect-[5/3] sm:max-h-none`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.55),transparent_65%)]" />
                      <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-10">
                        <img
                          src={encodeURI(spotlight.imageUrl)}
                          alt={label}
                          className="max-h-[min(14rem,46vw)] w-auto max-w-[88%] object-contain object-center drop-shadow-[0_20px_40px_rgba(3,28,54,0.35)] transition duration-500 group-hover:scale-[1.04] sm:max-h-[min(18rem,38vh)]"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent px-6 pb-5 pt-16 sm:px-8 sm:pb-6">
                        <p className="text-center text-xl font-black tracking-tight text-white sm:text-2xl">
                          {label}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="colecciones" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight text-slate-950">
              {locale === "es" ? "Construye tu hogar a tu manera" : "Build your home your way"}
            </h2>
            <p className="mt-3 text-slate-600">
              {locale === "es" ? "Colecciones editables para guiar la compra por estilo de vida." : "Editable collections to guide shopping by lifestyle."}
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {content.collections.map((collection) => (
              <Link
                key={collection.id}
                href={collection.categorySlug ? categoryHref(locale, collection.categorySlug) : localizedPath(locale, "products")}
                className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:ring-[var(--brand-cyan)]"
              >
                <ApplianceVisual tone={collection.tone} label={collection.cta[locale]} imageUrl={collection.imageUrl} />
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white">
                    <ApplianceIcon icon={collection.icon} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-slate-950">
                    {collection.title[locale]}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {collection.subtitle[locale]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <BrandLogoCloud locale={locale} />

        <InstagramShowcase videos={content.instagramVideos} locale={locale} />

        <section id="ofertas" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[2rem] bg-[var(--brand-blue)] text-white shadow-2xl shadow-[rgba(6,71,131,0.22)] lg:grid-cols-[1fr_0.85fr]">
            <div className="p-8 sm:p-10 lg:p-14">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-100">
                {content.promo.kicker[locale]}
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
                {content.promo.title[locale]}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50/80">
                {content.promo.body[locale]}
              </p>
              <Link
                href={localizedPath(locale, "login")}
                className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-black text-[var(--brand-blue)] transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                {content.promo.cta[locale]}
              </Link>
            </div>
            <div className="relative min-h-96 bg-gradient-to-br from-[#031c36] via-[#0a9ad3] to-white">
              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-white/70 shadow-2xl backdrop-blur-sm" />
              <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-[24px] border-[var(--brand-blue)]" />
            </div>
          </div>
        </section>
      </main>
      {quickViewProduct && typeof document !== "undefined"
        ? createPortal(
          <HomepageQuickViewModal product={quickViewProduct} locale={locale} onClose={() => setQuickViewProduct(undefined)} />,
          document.body,
        )
        : null}
      <SiteFooter locale={locale} />
    </div>
  );
}
