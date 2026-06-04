"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProductImage } from "@/components/product-image";
import { copy, formatPrice, type Locale, type Product } from "@/lib/content";
import { productPath } from "@/lib/content";
import { useCart } from "@/stores/cart-context";

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const { addItem } = useCart();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const labels = copy[locale].catalog;
  const quickViewLabel = locale === "es" ? "Ver imagen" : "View image";
  const quickViewTitle = locale === "es" ? "Vista del producto" : "Product preview";
  const warrantyLabel = locale === "es" ? "Garantía local incluida" : "Local warranty included";
  const productImage = product.imageUrls?.[0];

  function closeQuickView() {
    setQuickViewOpen(false);
  }

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

  useEffect(() => {
    if (!quickViewOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeQuickView();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickViewOpen]);

  return (
    <article className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1.5 hover:border-[var(--brand-cyan)] hover:shadow-2xl hover:shadow-slate-300/70">
      <button type="button" onClick={() => setQuickViewOpen(true)} className={`relative block h-60 w-full overflow-hidden bg-gradient-to-br ${product.imageClass} p-5 text-left`} aria-label={`${quickViewLabel}: ${product.name[locale]}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(10,154,211,0.24),transparent_18rem)] opacity-90 transition duration-500 group-hover:scale-110" />
        {productImage ? (
          <ProductImage src={productImage} alt={product.name[locale]} className="product-image-contrast absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute left-1/2 top-1/2 h-28 w-44 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/25 shadow-2xl ring-1 ring-white/30 backdrop-blur-sm transition duration-700 group-hover:scale-110 group-hover:rotate-1" />
        )}
        <div className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-950 shadow-sm">
          {product.badge[locale]}
        </div>
        <div className="absolute right-5 top-5 rounded-full bg-[rgba(3,28,54,0.76)] px-3 py-1 text-xs font-black text-cyan-100 backdrop-blur-md">
          ★ {product.rating}
        </div>
        <div className="absolute bottom-5 right-5 rounded-2xl bg-white/95 px-4 py-3 text-right text-slate-700 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-md transition duration-500 group-hover:translate-y-16 group-hover:opacity-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {product.brand}
          </p>
          <p className="text-2xl font-black text-[var(--brand-blue)]">{formatPrice(product.price)}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition duration-500 group-hover:bg-slate-950/15 group-hover:opacity-100">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[var(--brand-blue)] shadow-2xl ring-1 ring-white/80 backdrop-blur-md transition duration-500 group-hover:scale-105">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
              <path d="M11 8v6" />
              <path d="M8 11h6" />
            </svg>
          </span>
        </div>
      </button>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-blue)]">
              {product.category[locale]}
            </p>
            <h3 className="mt-2 text-lg font-black leading-tight text-slate-950">
              <Link href={productPath(locale, product.id)} className="hover:text-[var(--brand-blue)]">
                {product.name[locale]}
              </Link>
            </h3>
          </div>
          <span className="rounded-full bg-[rgba(10,154,211,0.10)] px-2.5 py-1 text-xs font-bold text-[var(--brand-blue)]">
            {product.brand}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
          {product.description[locale]}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 transition duration-500 group-hover:translate-y-[-2px]">
          {product.specs[locale].slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition duration-300 group-hover:border-[rgba(10,154,211,0.28)] group-hover:bg-[rgba(10,154,211,0.08)] group-hover:text-[var(--brand-blue)]"
            >
              {spec}
            </span>
          ))}
        </div>
        <div className="grid max-h-0 gap-2 overflow-hidden transition-all duration-500 group-hover:mt-4 group-hover:max-h-28">
          {product.specs[locale].slice(3).map((spec) => (
            <div key={spec} className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-cyan)]" />
              {spec}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black text-slate-950">
              {formatPrice(product.price)}
            </p>
            {product.compareAt ? (
              <p className="text-sm font-semibold text-slate-400 line-through">
                {formatPrice(product.compareAt)}
              </p>
            ) : null}
          </div>
          <p className="text-xs font-bold text-emerald-600">
            {labels.stock}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={addCurrentProduct}
            className="rounded-full bg-[var(--brand-cyan)] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[rgba(10,154,211,0.22)] transition duration-300 hover:bg-[var(--brand-cyan-light)] hover:shadow-[rgba(10,154,211,0.32)]"
          >
            {labels.add}
          </button>
          <Link href={productPath(locale, product.id)} className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-700 transition duration-300 hover:border-[var(--brand-blue)] hover:bg-[var(--brand-blue)] hover:text-white">
            {locale === "es" ? "Ver" : "View"}
          </Link>
        </div>
      </div>
      {quickViewOpen && typeof document !== "undefined" ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6 lg:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={quickViewTitle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeQuickView();
            }
          }}
        >
          <div className="relative my-auto grid max-h-none w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-white/20 lg:max-h-[90vh] lg:grid-cols-[1.15fr_0.85fr]">
            <button type="button" onClick={closeQuickView} className="absolute right-4 top-4 z-10 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:text-[var(--brand-blue)]">
              {locale === "es" ? "Cerrar" : "Close"}
            </button>
            <div className={`relative flex min-h-[360px] items-center justify-center overflow-hidden bg-gradient-to-br ${product.imageClass} p-6 sm:p-10 lg:min-h-[640px]`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(10,154,211,0.28),transparent_24rem)]" />
              <div className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--brand-blue)] shadow-sm">
                {quickViewTitle}
              </div>
              <div className="relative flex h-full w-full items-center justify-center rounded-[1.75rem] border border-white/50 bg-sky-100/35 p-6 shadow-2xl backdrop-blur-sm">
                {productImage ? (
                  <ProductImage src={productImage} alt={product.name[locale]} className="product-image-contrast max-h-[68vh] w-full object-contain" loading="eager" />
                ) : (
                  <div className="h-52 w-72 rounded-[2rem] bg-white/30 shadow-2xl ring-1 ring-white/40" />
                )}
              </div>
            </div>
            <div className="flex max-h-[90vh] flex-col overflow-y-auto p-6 md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--brand-blue)]">{product.category[locale]}</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{product.name[locale]}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{product.brand}</span>
                <span>SKU {product.sku}</span>
              </div>
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">{locale === "es" ? "Precio" : "Price"}</p>
                <p className="mt-1 text-4xl font-black text-[var(--brand-blue)]">{formatPrice(product.price)}</p>
                {product.compareAt ? <p className="mt-1 text-sm font-bold text-slate-400 line-through">{formatPrice(product.compareAt)}</p> : null}
              </div>
              <p className="mt-5 leading-7 text-slate-600">{product.description[locale]}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {product.specs[locale].slice(0, 4).map((spec) => (
                  <span key={spec} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                    {spec}
                  </span>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[rgba(10,154,211,0.08)] p-4 text-sm font-bold text-[var(--brand-blue)]">
                  {labels.stock}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  {warrantyLabel}
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-auto lg:pt-6">
                <button type="button" onClick={addCurrentProduct} className="rounded-full bg-[var(--brand-blue)] px-5 py-4 text-sm font-black text-white transition hover:bg-[var(--brand-blue-dark)]">
                  {labels.add}
                </button>
                <Link href={productPath(locale, product.id)} onClick={closeQuickView} className="rounded-full border border-slate-200 px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]">
                  {locale === "es" ? "Ver detalles" : "View details"}
                </Link>
              </div>
              <p className="mt-4 text-center text-xs font-bold text-slate-400">
                {locale === "es" ? "Haz clic fuera de esta ventana o presiona Esc para volver al catálogo." : "Click outside this window or press Esc to return to the catalog."}
              </p>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </article>
  );
}
