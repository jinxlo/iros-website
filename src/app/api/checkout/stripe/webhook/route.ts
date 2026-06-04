import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequiredEnv } from "@/lib/env";
import { pgQuery } from "@/lib/postgres/client";

async function markCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;

  if (!orderId) {
    return;
  }

  await pgQuery(
    `update orders
     set status = 'confirmed',
         payment_status = 'paid',
         payment_reference = $1,
         updated_at = now()
     where id = $2::uuid`,
    [session.id, orderId],
  );
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      getRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    await markCheckoutSessionPaid(event.data.object);
  }

  return NextResponse.json({ received: true });
}
