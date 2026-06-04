"use client";

import Link from "next/link";
import { useState } from "react";
import { copy, formatPrice, localizedPath, type Locale } from "@/lib/content";
import { useCart } from "@/stores/cart-context";

export function CartDrawer({ locale, variant = "header" }: { locale: Locale; variant?: "header" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const { items, count, subtotal, removeItem, updateQuantity } = useCart();
  const labels = copy[locale].cart;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={variant === "mobile"
          ? "relative flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-black text-slate-500 transition hover:text-[var(--brand-blue)]"
          : "relative rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:border-white hover:bg-white/20"}
      >
        {variant === "mobile" ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-slate-100 text-[var(--brand-blue)]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6h15l-1.5 9h-12z" />
              <path d="M6 6 5 3H2" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
          </span>
        ) : null}
        {copy[locale].header.cart}
        <span className={variant === "mobile" ? "absolute right-2 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-cyan)] px-1 text-[10px] text-white" : "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-cyan)] px-1.5 text-xs text-white"}>
          {count}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close cart overlay"
            className="absolute inset-0 bg-[rgba(3,28,54,0.52)] backdrop-blur-sm"
            type="button"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                  iroselectronics
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {labels.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {locale === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  {labels.empty}
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[88px_1fr] gap-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div
                      className={`h-24 rounded-2xl bg-gradient-to-br ${item.imageClass}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        {item.brand}
                      </p>
                      <h3 className="mt-1 truncate font-semibold text-slate-950">
                        {item.name}
                      </h3>
                      <p className="mt-1 font-bold text-[var(--brand-blue)]">
                        {formatPrice(item.price)}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          {labels.quantity}
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(item.id, Number(event.target.value))
                            }
                            className="h-9 w-16 rounded-xl border border-slate-200 px-2 text-slate-950 outline-none focus:border-blue-600"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-sm font-semibold text-red-600 hover:text-red-700"
                        >
                          {labels.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex items-center justify-between text-lg font-bold text-slate-950">
                <span>{labels.subtotal}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link
                href={localizedPath(locale, "checkout")}
                onClick={() => setOpen(false)}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-[var(--brand-blue)] px-5 py-3 font-bold text-white shadow-lg shadow-[rgba(6,71,131,0.24)] transition hover:bg-[var(--brand-blue-dark)]"
              >
                {labels.checkout}
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 w-full rounded-full border border-slate-300 px-5 py-3 font-bold text-slate-900 hover:bg-white"
              >
                {labels.continue}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
