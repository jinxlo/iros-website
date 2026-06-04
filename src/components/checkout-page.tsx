"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy, formatPrice, localizedPath, type Locale } from "@/lib/content";
import { useCart } from "@/stores/cart-context";

type PaymentMethod = "stripe" | "zelle";
type Message = { tone: "info" | "success" | "error"; text: string };

function messageClass(tone: Message["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-blue-200 bg-blue-50 text-[var(--brand-blue)]";
}

export function CheckoutPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { items, subtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>({
    tone: "info",
    text: locale === "es"
      ? "Paga con Stripe o solicita un pago Zelle verificado. No publicamos nuestra cuenta Zelle."
      : "Pay with Stripe or request a verified Zelle payment. We do not publish our Zelle account.",
  });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const labels = locale === "es"
    ? {
        firstName: "Nombre",
        lastName: "Apellido",
        email: "Correo electrónico",
        phone: "Teléfono",
        address: "Dirección",
        city: "Ciudad",
        state: "Estado",
        postalCode: "Código postal",
        country: "País",
        subtotal: "Subtotal",
        shipping: "Envío",
        tax: "Impuestos",
        total: "Total",
        stripe: "Tarjeta con Stripe",
        stripeHelp: "Serás enviado al checkout seguro de Stripe para completar el pago.",
        zelle: "Solicitud Zelle",
        zelleHelp: "Debes iniciar sesión y usar el mismo email de tu cuenta. Nosotros enviaremos la solicitud de pago Zelle al cliente verificado.",
        empty: "Tu carrito está vacío. Agrega productos antes de pagar.",
        processing: "Procesando checkout...",
        zelleSuccess: "Solicitud Zelle creada. Te enviaremos la solicitud de pago al email verificado de tu cuenta.",
        signInRequired: "Inicia sesión antes de solicitar pago por Zelle.",
        payStripe: "Pagar con Stripe",
        requestZelle: "Solicitar pago Zelle",
        orderItems: "Productos",
        continueShopping: "Seguir comprando",
        login: "Iniciar sesión",
      }
    : {
        firstName: "First name",
        lastName: "Last name",
        email: "Email address",
        phone: "Phone",
        address: "Address",
        city: "City",
        state: "State",
        postalCode: "ZIP code",
        country: "Country",
        subtotal: "Subtotal",
        shipping: "Shipping",
        tax: "Tax",
        total: "Total",
        stripe: "Card with Stripe",
        stripeHelp: "You will be sent to Stripe's secure checkout to complete payment.",
        zelle: "Zelle request",
        zelleHelp: "You must be signed in and use the same email as your account. We will send the Zelle payment request to the verified client.",
        empty: "Your cart is empty. Add products before checkout.",
        processing: "Processing checkout...",
        zelleSuccess: "Zelle request created. We will send the payment request to your verified account email.",
        signInRequired: "Sign in before requesting Zelle payment.",
        payStripe: "Pay with Stripe",
        requestZelle: "Request Zelle payment",
        orderItems: "Items",
        continueShopping: "Continue shopping",
        login: "Sign in",
      };

  const cartItems = useMemo(() => items.map((item) => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    brand: item.brand,
    price: item.price,
    quantity: item.quantity,
  })), [items]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function postCheckout(url: string, accessToken?: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ locale, customer: form, items: cartItems }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string; orderNumber?: string };

    if (!response.ok) {
      throw new Error(payload.error || "Checkout failed.");
    }

    return payload;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setMessage({ tone: "error", text: labels.empty });
      return;
    }

    setLoading(true);
    setMessage({ tone: "info", text: labels.processing });

    try {
      if (paymentMethod === "stripe") {
        const payload = await postCheckout("/api/checkout/stripe");

        if (!payload.url) {
          throw new Error("Stripe did not return a checkout URL.");
        }

        window.location.assign(payload.url);
        return;
      }

      await postCheckout("/api/checkout/zelle-request");
      clearCart();
      setMessage({ tone: "success", text: labels.zelleSuccess });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Checkout failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--brand-blue)]">
            iroselectronics
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            {t.checkout.title}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">{t.checkout.subtitle}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <p className={`rounded-2xl border px-4 py-3 text-sm font-bold ${messageClass(message.tone)}`}>
              {message.text}
            </p>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{t.checkout.contact}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input required value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.firstName} />
                <input required value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.lastName} />
                <input required type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.email} />
                <input required type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.phone} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{t.checkout.shipping}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input required value={form.address} onChange={(event) => updateField("address", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 sm:col-span-2" placeholder={labels.address} />
                <input required value={form.city} onChange={(event) => updateField("city", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.city} />
                <input required value={form.state} onChange={(event) => updateField("state", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.state} />
                <input required value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.postalCode} />
                <input required value={form.country} onChange={(event) => updateField("country", event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600" placeholder={labels.country} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">{t.checkout.payment}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <button type="button" onClick={() => setPaymentMethod("stripe")} className={`rounded-2xl border p-5 text-left transition ${paymentMethod === "stripe" ? "border-[var(--brand-blue)] bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-[var(--brand-cyan)]"}`}>
                  <span className="block font-black text-slate-950">{labels.stripe}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">{labels.stripeHelp}</span>
                </button>
                <button type="button" onClick={() => setPaymentMethod("zelle")} className={`rounded-2xl border p-5 text-left transition ${paymentMethod === "zelle" ? "border-[var(--brand-blue)] bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-[var(--brand-cyan)]"}`}>
                  <span className="block font-black text-slate-950">{labels.zelle}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">{labels.zelleHelp}</span>
                </button>
              </div>
              {paymentMethod === "zelle" ? (
                <Link href={`${localizedPath(locale, "login")}?redirect=${encodeURIComponent(localizedPath(locale, "checkout"))}`} className="mt-4 inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-900 transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]">
                  {labels.login}
                </Link>
              ) : null}
            </section>
          </form>

          <aside className="h-fit rounded-[2rem] bg-[var(--brand-blue)] p-6 text-white shadow-2xl shadow-[rgba(6,71,131,0.20)] lg:sticky lg:top-24">
            <h2 className="text-2xl font-black">{t.checkout.summary}</h2>
            <div className="mt-6 rounded-3xl bg-white/10 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">{labels.orderItems}</h3>
              <div className="mt-4 space-y-3">
                {items.length > 0 ? items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{item.name}</p>
                      <p className="text-xs text-blue-100">{item.quantity} x {formatPrice(item.price)}</p>
                    </div>
                    <p className="shrink-0 font-black">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-blue-100">{labels.empty}</p>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="flex justify-between"><span>{labels.subtotal}</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>{labels.shipping}</span><span>{formatPrice(0)}</span></div>
              <div className="flex justify-between"><span>{labels.tax}</span><span>{formatPrice(0)}</span></div>
            </div>
            <div className="mt-6 flex justify-between border-t border-white/10 pt-6 text-xl font-black">
              <span>{labels.total}</span><span>{formatPrice(subtotal)}</span>
            </div>
            <button type="submit" form="checkout-form" disabled={loading || items.length === 0} className="mt-6 w-full rounded-full bg-[var(--brand-cyan)] px-5 py-4 font-black text-white transition hover:bg-[var(--brand-cyan-light)] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? labels.processing : paymentMethod === "stripe" ? labels.payStripe : labels.requestZelle}
            </button>
            <Link href={localizedPath(locale, "products")} className="mt-3 flex w-full justify-center rounded-full border border-white/25 px-5 py-4 font-black text-white transition hover:bg-white/10">
              {labels.continueShopping}
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
