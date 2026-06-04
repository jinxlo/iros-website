"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, localizedPath, type Locale, type Product } from "@/lib/content";
import { useCart } from "@/stores/cart-context";

type ProductMedia =
  | { type: "visual"; id: string; imageClass: string }
  | { type: "image"; id: string; url: string }
  | { type: "video"; id: string; url: string };

type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};

type ReviewPayload = {
  reviews: Review[];
  summary: { count: number; average: number };
  viewer: { authenticated: boolean; canReview: boolean; alreadyReviewed: boolean };
};

function productSignal(product: Product) {
  return product.sku.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-amber-400" aria-label={`${rating.toFixed(1)} estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{rating >= star - 0.25 ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function specificationRows(product: Product, locale: Locale) {
  const labels = locale === "es"
    ? {
        sku: "SKU",
        brand: "Marca",
        category: "Categoría",
        condition: "Condición",
        warranty: "Garantía",
        support: "Soporte",
        availability: "Disponibilidad",
        new: "Producto nuevo",
        localWarranty: "Garantía local incluida",
        expertSupport: "Asesoría especializada IROS",
        ready: "Disponible para compra",
      }
    : {
        sku: "SKU",
        brand: "Brand",
        category: "Category",
        condition: "Condition",
        warranty: "Warranty",
        support: "Support",
        availability: "Availability",
        new: "New product",
        localWarranty: "Local warranty included",
        expertSupport: "IROS expert support",
        ready: "Available to purchase",
      };
  const rows = [
    { label: labels.sku, value: product.sku },
    { label: labels.brand, value: product.brand },
    { label: labels.category, value: product.category[locale] },
    { label: labels.condition, value: labels.new },
    { label: labels.warranty, value: labels.localWarranty },
    { label: labels.support, value: labels.expertSupport },
    { label: labels.availability, value: labels.ready },
  ];
  const existing = new Set(rows.map((row) => row.value.toLowerCase()));
  const extraRows = product.specs[locale]
    .filter((spec) => !/^stock\b/i.test(spec))
    .filter((spec) => !existing.has(spec.toLowerCase()))
    .map((spec) => ({ label: locale === "es" ? "Detalle" : "Detail", value: spec }));

  return [...rows, ...extraRows].slice(0, 10);
}

async function fetchProductReviews(productId: string) {
  const response = await fetch(`/api/products/${productId}/reviews`);

  return response.ok ? ((await response.json()) as ReviewPayload) : undefined;
}

function ProductReviews({ product, locale }: { product: Product; locale: Locale }) {
  const [payload, setPayload] = useState<ReviewPayload>();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const labels = locale === "es"
    ? {
        title: "Reseñas de compradores verificados",
        subtitle: "Solo clientes registrados que compraron este producto pueden dejar una reseña.",
        empty: "Este producto aún no tiene reseñas verificadas.",
        login: "Inicia sesión para revisar elegibilidad.",
        notEligible: "Podrás reseñar este producto después de completar una compra verificada.",
        reviewed: "Ya dejaste una reseña para este producto.",
        formTitle: "Cuenta tu experiencia",
        rating: "Calificación",
        headline: "Título de la reseña",
        body: "Reseña",
        submit: "Publicar reseña",
        verified: "Compra verificada",
      }
    : {
        title: "Verified buyer reviews",
        subtitle: "Only registered customers who purchased this product can leave a review.",
        empty: "This product does not have verified reviews yet.",
        login: "Sign in to check eligibility.",
        notEligible: "You can review this product after completing a verified purchase.",
        reviewed: "You already reviewed this product.",
        formTitle: "Share your experience",
        rating: "Rating",
        headline: "Review title",
        body: "Review",
        submit: "Publish review",
        verified: "Verified purchase",
      };

  useEffect(() => {
    let active = true;

    fetchProductReviews(product.id).then((nextPayload) => {
      if (active && nextPayload) {
        setPayload(nextPayload);
      }
    });

    return () => {
      active = false;
    };
  }, [product.id]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/products/${product.id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating, title, body }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      setMessage(error.error || "No se pudo publicar la reseña.");
      return;
    }

    setTitle("");
    setBody("");
    setMessage(locale === "es" ? "Reseña publicada." : "Review published.");
    const nextPayload = await fetchProductReviews(product.id);

    if (nextPayload) {
      setPayload(nextPayload);
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--brand-blue)]">iroselectronics</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{labels.title}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">{labels.subtitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-5 py-4 text-right">
          <div className="text-2xl font-black text-slate-950">{payload?.summary.average ? payload.summary.average.toFixed(1) : "0.0"}</div>
          <Stars rating={payload?.summary.average || 0} />
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{payload?.summary.count || 0} reviews</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {payload?.reviews.length ? payload.reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Stars rating={review.rating} />
                  <h3 className="mt-2 font-black text-slate-950">{review.title || product.name[locale]}</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{labels.verified}</span>
              </div>
              <p className="mt-3 leading-7 text-slate-600">{review.body}</p>
              <p className="mt-4 text-sm font-bold text-slate-500">{review.author}</p>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              {labels.empty}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5">
          {payload?.viewer.canReview ? (
            <form onSubmit={submitReview} className="space-y-4">
              <h3 className="text-xl font-black text-slate-950">{labels.formTitle}</h3>
              <label className="block text-sm font-black text-slate-700">
                {labels.rating}
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="block text-sm font-black text-slate-700">
                {labels.headline}
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" />
              </label>
              <label className="block text-sm font-black text-slate-700">
                {labels.body}
                <textarea required minLength={10} value={body} onChange={(event) => setBody(event.target.value)} className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" />
              </label>
              <button disabled={submitting} className="w-full rounded-full bg-[var(--brand-blue)] px-5 py-4 font-black text-white transition hover:bg-[var(--brand-blue-dark)] disabled:opacity-60">
                {labels.submit}
              </button>
              {message ? <p className="text-sm font-bold text-slate-600">{message}</p> : null}
            </form>
          ) : (
            <div>
              <h3 className="text-xl font-black text-slate-950">{labels.formTitle}</h3>
              <p className="mt-3 leading-7 text-slate-600">
                {!payload?.viewer.authenticated ? labels.login : payload.viewer.alreadyReviewed ? labels.reviewed : labels.notEligible}
              </p>
              {!payload?.viewer.authenticated ? (
                <Link href={localizedPath(locale, "login")} className="mt-5 inline-flex rounded-full bg-[var(--brand-blue)] px-5 py-3 font-black text-white">
                  {locale === "es" ? "Iniciar sesión" : "Sign in"}
                </Link>
              ) : null}
              {message ? <p className="mt-4 text-sm font-bold text-slate-600">{message}</p> : null}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

type DetailIconName = "eye" | "bag" | "shield" | "truck" | "lock" | "spark" | "check";

function DetailIcon({ name }: { name: DetailIconName }) {
  const common = { className: "h-5 w-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

  if (name === "eye") {
    return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>;
  }

  if (name === "bag") {
    return <svg {...common}><path d="M6 7h12l-1 14H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
  }

  if (name === "shield") {
    return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>;
  }

  if (name === "truck") {
    return <svg {...common}><path d="M3 7h11v10H3z" /><path d="M14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
  }

  if (name === "lock") {
    return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
  }

  if (name === "spark") {
    return <svg {...common}><path d="M12 2v6" /><path d="M12 16v6" /><path d="M4.93 4.93 9.17 9.17" /><path d="m14.83 14.83 4.24 4.24" /><path d="M2 12h6" /><path d="M16 12h6" /><path d="m4.93 19.07 4.24-4.24" /><path d="m14.83 9.17 4.24-4.24" /></svg>;
  }

  return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
}

function SignalCard({ icon, kicker, value, detail, className }: { icon: DetailIconName; kicker: string; value: string; detail: string; className: string }) {
  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white/75 p-3 shadow-sm ring-1 ring-white/70">
          <DetailIcon name={icon} />
        </div>
        <p className="text-right text-xs font-black uppercase tracking-[0.16em] opacity-75">{kicker}</p>
      </div>
      <p className="mt-4 text-2xl font-black leading-none">{value}</p>
      <p className="mt-2 text-sm font-bold leading-5 opacity-85">{detail}</p>
    </div>
  );
}

export function ProductDetailPage({ product, locale }: { product: Product; locale: Locale }) {
  const { addItem } = useCart();
  const realMedia: ProductMedia[] = [
    ...(product.imageUrls || []).map((url, index) => ({ type: "image" as const, id: `image-${index}`, url })),
    ...(product.videoUrls || []).map((url, index) => ({ type: "video" as const, id: `video-${index}`, url })),
  ];
  const media: ProductMedia[] = realMedia.length ? realMedia : [{ type: "visual", id: "visual", imageClass: product.imageClass }];
  const [activeMedia, setActiveMedia] = useState<ProductMedia>(media[0]);
  const specs = specificationRows(product, locale);
  const specGroups = product.specGroups?.[locale] || [];
  const highlightSpecs = product.specs[locale].filter((spec) => !/^sku\b/i.test(spec)).slice(0, 4);
  const signal = productSignal(product);
  const shopperCount = 9 + (signal % 17);
  const recentlyBought = 3 + (signal % 8);
  const labels =
    locale === "es"
      ? {
          back: "Volver al catálogo",
          available: "Disponible para compra",
          add: "Agregar al carrito",
          buy: "Comprar ahora",
          buyBox: "Resumen de compra",
          specs: "Especificaciones",
          overview: "Descripción",
          overviewSubtitle: "Información del producto",
          specSubtitle: "Ficha técnica",
          serviceTitle: "Envío, garantía y seguridad",
          media: "Galería",
          video: "Video",
          highlights: "Puntos clave",
          warranty: "Garantía local y soporte especializado incluidos.",
          fomo: "Alta demanda esta semana",
          liveInterest: "Interés en vivo",
          recentActivity: "Compras recientes",
          viewing: "personas están viendo este producto",
          bought: "compras recientes en esta categoría",
          ships: "Despacho coordinado por iroselectronics",
          secure: "Compra segura con atención local",
          inStock: "Inventario confirmado",
          verified: "Producto verificado",
          compareAt: "Precio anterior",
          whyIros: "¿Por qué comprar en IROS?",
          quickShip: "Despacho rápido",
          authWarranty: "Garantía local",
          securePay: "Pago protegido",
          category: "Categoría",
          sku: "SKU",
          brand: "Marca",
        }
      : {
          back: "Back to catalog",
          available: "Available to purchase",
          add: "Add to cart",
          buy: "Buy now",
          buyBox: "Purchase summary",
          specs: "Specifications",
          overview: "Overview",
          overviewSubtitle: "Product information",
          specSubtitle: "Technical sheet",
          serviceTitle: "Shipping, warranty, and security",
          media: "Gallery",
          video: "Video",
          highlights: "Key highlights",
          warranty: "Local warranty and expert support included.",
          fomo: "High demand this week",
          liveInterest: "Live interest",
          recentActivity: "Recent purchases",
          viewing: "people are viewing this product",
          bought: "recent purchases in this category",
          ships: "Fulfillment coordinated by iroselectronics",
          secure: "Secure purchase with local support",
          inStock: "Inventory confirmed",
          verified: "Verified product",
          compareAt: "Previous price",
          whyIros: "Why buy from IROS?",
          quickShip: "Fast fulfillment",
          authWarranty: "Local warranty",
          securePay: "Protected payment",
          category: "Category",
          sku: "SKU",
          brand: "Brand",
        };

  function addCurrentProduct() {
    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name[locale],
      brand: product.brand,
      price: product.price,
      imageClass: product.imageClass,
    });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef5fb_45%,#f8fafc_100%)]">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href={localizedPath(locale, "products")} className="text-[var(--brand-blue)] hover:text-[var(--brand-cyan)]">{labels.back}</Link>
          <span>/</span>
          <span>{product.category[locale]}</span>
          <span>/</span>
          <span className="truncate text-slate-700">{product.name[locale]}</span>
        </nav>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
          <div className="space-y-5">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 ring-1 ring-slate-200/80">
                <div className="absolute left-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--brand-blue)] shadow-sm">
                  {labels.media}
                </div>
                {activeMedia.type === "video" ? (
                  <video key={activeMedia.url} controls className="aspect-square w-full bg-black object-contain" poster={product.imageUrls?.[0]}>
                    <source src={activeMedia.url} />
                  </video>
                ) : activeMedia.type === "image" ? (
                  <ProductImage src={activeMedia.url} alt={product.name[locale]} className="product-image-contrast aspect-square w-full object-contain p-6 sm:p-8" loading="eager" />
                ) : (
                  <div className={`relative aspect-square bg-gradient-to-br ${activeMedia.imageClass}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.68),transparent_20rem)]" />
                    <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-white/60 shadow-2xl ring-1 ring-white/70 backdrop-blur-md" />
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {media.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMedia(item)}
                    className={`overflow-hidden rounded-xl border bg-white p-1 text-[11px] font-black shadow-sm transition ${
                      activeMedia.id === item.id
                        ? "border-[var(--brand-blue)] ring-2 ring-[rgba(10,154,211,0.18)]"
                        : "border-slate-200 hover:border-[var(--brand-cyan)]"
                    }`}
                  >
                    {item.type === "video" ? (
                      <span className="flex aspect-square items-center justify-center bg-slate-950 text-white">{labels.video}</span>
                    ) : item.type === "image" ? (
                      <ProductImage src={item.url} alt={product.name[locale]} className="product-image-contrast aspect-square w-full object-contain" />
                    ) : (
                      <span className={`block aspect-square bg-gradient-to-br ${item.imageClass}`} />
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="product-overview-heading">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">{labels.overviewSubtitle}</p>
              <h2 id="product-overview-heading" className="mt-2 text-xl font-black text-slate-950">{labels.overview}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                {product.description[locale].split(/\n\s*\n/).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><span className="mr-1 text-slate-500">{labels.brand}:</span>{product.brand}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><span className="mr-1 text-slate-500">{labels.category}:</span>{product.category[locale]}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><span className="mr-1 text-slate-500">{labels.sku}:</span>{product.sku}</div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="product-specs-heading">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">{labels.specSubtitle}</p>
                  <h2 id="product-specs-heading" className="mt-1 text-xl font-black text-slate-950">{labels.specs}</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(10,154,211,0.10)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--brand-blue)]">
                  <DetailIcon name="check" />
                  {labels.verified}
                </span>
              </div>
              {specGroups.length > 0 ? (
                <div className="mt-5 space-y-5">
                  {specGroups.map((group) => (
                    <section key={group.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">{group.title}</h3>
                      <div className="mt-3 grid gap-2">
                        {group.specs.map((spec) => (
                          <div key={`${group.title}-${spec.label}-${spec.value}`} className="grid gap-1 rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-slate-200 sm:grid-cols-[190px_1fr] sm:gap-3">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{spec.label}</p>
                            <p className="font-semibold text-slate-800">{spec.value}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid gap-2">
                  {specs.map((spec) => (
                    <div key={`${spec.label}-${spec.value}`} className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm sm:grid-cols-[170px_1fr] sm:gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{spec.label}</p>
                      <p className="font-semibold text-slate-800">{spec.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="product-service-heading">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">iroselectronics</p>
              <h2 id="product-service-heading" className="mt-2 text-xl font-black text-slate-950">{labels.serviceTitle}</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-blue)] ring-1 ring-slate-200"><DetailIcon name="truck" /></span>
                  {labels.ships}
                </div>
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-blue)] ring-1 ring-slate-200"><DetailIcon name="lock" /></span>
                  {labels.secure}
                </div>
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-blue)] ring-1 ring-slate-200"><DetailIcon name="shield" /></span>
                  {labels.authWarranty}
                </div>
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-blue)] ring-1 ring-slate-200"><DetailIcon name="spark" /></span>
                  {labels.quickShip}
                </div>
              </div>
            </section>
          </div>

          <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24" aria-labelledby="product-buy-heading">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--brand-blue)]">{labels.buyBox}</p>
            <h1 id="product-buy-heading" className="mt-2 text-2xl font-black leading-tight text-slate-950">{product.name[locale]}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{product.brand}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{labels.available}</span>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">iroselectronics</p>
              <p className="mt-2 text-3xl font-black tracking-tight">{formatPrice(product.price)}</p>
              {product.compareAt ? <p className="mt-1 text-sm font-bold text-slate-400 line-through">{labels.compareAt}: {formatPrice(product.compareAt)}</p> : null}
              <p className="mt-2 text-xs font-semibold text-slate-300">{labels.inStock}</p>
            </div>

            <div className="mt-4 grid gap-2">
              <button type="button" onClick={addCurrentProduct} className="rounded-full bg-[var(--brand-blue)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--brand-blue-dark)]">
                {labels.add}
              </button>
              <Link href={localizedPath(locale, "checkout")} onClick={addCurrentProduct} className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-black text-slate-900 transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]">
                {labels.buy}
              </Link>
            </div>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="product-live-heading">
              <div className="flex items-center justify-between gap-3">
                <p id="product-live-heading" className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--brand-blue)]">{labels.fomo}</p>
                <DetailIcon name="spark" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <SignalCard icon="eye" kicker={labels.liveInterest} value={`${shopperCount}`} detail={labels.viewing} className="border-amber-100 bg-amber-50 text-amber-950" />
                <SignalCard icon="bag" kicker={labels.recentActivity} value={`${recentlyBought}`} detail={labels.bought} className="border-cyan-100 bg-cyan-50 text-[var(--brand-blue)]" />
              </div>
            </section>

            <section className="mt-5" aria-labelledby="product-highlight-heading">
              <h2 id="product-highlight-heading" className="text-sm font-black text-slate-950">{labels.highlights}</h2>
              <div className="mt-3 grid gap-2">
                {highlightSpecs.map((spec) => (
                  <div key={spec} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <span className="mt-0.5 text-[var(--brand-blue)]"><DetailIcon name="check" /></span>
                    <span className="font-semibold leading-6">{spec}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="product-why-heading">
              <h2 id="product-why-heading" className="text-sm font-black text-slate-950">{labels.whyIros}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2 font-semibold"><DetailIcon name="truck" />{labels.quickShip}</li>
                <li className="flex items-center gap-2 font-semibold"><DetailIcon name="shield" />{labels.authWarranty}</li>
                <li className="flex items-center gap-2 font-semibold"><DetailIcon name="lock" />{labels.securePay}</li>
              </ul>
            </section>
          </aside>
        </section>
        <ProductReviews product={product} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

export function ProductNotFoundPage({ locale }: { locale: Locale }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-slate-950">{locale === "es" ? "Producto no encontrado" : "Product not found"}</h1>
        <Link href={localizedPath(locale, "products")} className="mt-6 inline-flex rounded-full bg-[var(--brand-blue)] px-6 py-3 font-black text-white">
          {locale === "es" ? "Volver al catálogo" : "Back to catalog"}
        </Link>
      </main>
    </div>
  );
}
