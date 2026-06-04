import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequiredEnv } from "@/lib/env";
import {
  createCheckoutOrder,
  normalizeCheckoutPayload,
  validateCheckout,
  verifyCheckoutItems,
} from "@/lib/payments/checkout";
import { pgQuery } from "@/lib/postgres/client";

function checkoutPath(locale: string) {
  return locale === "en" ? "/en/checkout" : "/checkout";
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { customer, items, locale } = normalizeCheckoutPayload(payload);

    validateCheckout(customer, items);
    const verifiedItems = await verifyCheckoutItems(items);
    validateCheckout(customer, verifiedItems);

    const { order } = await createCheckoutOrder({
      customer,
      items: verifiedItems,
      paymentMethod: "stripe",
      paymentStatus: "unpaid",
    });
    const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
    const origin = request.nextUrl.origin;
    const checkoutUrl = new URL(checkoutPath(locale), origin);
    const successUrl = new URL(checkoutUrl);
    const cancelUrl = new URL(checkoutUrl);

    successUrl.searchParams.set("payment", "stripe-success");
    successUrl.searchParams.set("order", order.order_number);
    successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
    cancelUrl.searchParams.set("payment", "stripe-cancelled");
    cancelUrl.searchParams.set("order", order.order_number);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email,
      client_reference_id: order.id,
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: order.order_number,
        },
      },
      line_items: verifiedItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.price,
          product_data: {
            name: item.name,
            metadata: {
              productId: item.id,
              sku: item.sku,
              brand: item.brand,
            },
          },
        },
      })),
    });

    await pgQuery(
      "update orders set payment_reference = $1, updated_at = now() where id = $2::uuid",
      [session.id, order.id],
    );

    return NextResponse.json({ url: session.url, orderNumber: order.order_number });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start Stripe checkout." },
      { status: 400 },
    );
  }
}
