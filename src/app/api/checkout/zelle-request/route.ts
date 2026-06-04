import { NextRequest, NextResponse } from "next/server";
import {
  createCheckoutOrder,
  normalizeCheckoutPayload,
  validateCheckout,
  verifyCheckoutItems,
} from "@/lib/payments/checkout";
import { getSessionFromRequest } from "@/lib/auth/session";
import { upsertLocalProfile } from "@/lib/auth/users";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Sign in is required before requesting Zelle payment." },
        { status: 401 },
      );
    }

    const payload = await request.json();
    const { customer, items } = normalizeCheckoutPayload(payload);
    const accountEmail = session.email.toLowerCase();

    validateCheckout(customer, items);
    const verifiedItems = await verifyCheckoutItems(items);
    validateCheckout(customer, verifiedItems);

    if (customer.email !== accountEmail) {
      return NextResponse.json(
        { error: "The Zelle request email must match the signed-in account email." },
        { status: 403 },
      );
    }

    await upsertLocalProfile({
      id: session.sub,
      email: session.email,
      full_name: `${customer.firstName} ${customer.lastName}`.trim(),
      role: session.role || "customer",
    });

    const { order } = await createCheckoutOrder({
      customer,
      items: verifiedItems,
      paymentMethod: "zelle_request",
      paymentStatus: "payment_request_pending",
      status: "pending_payment_request",
      userId: session.sub,
      zelleRequestStatus: "ready_to_send",
    });

    return NextResponse.json({
      orderNumber: order.order_number,
      message: "Zelle payment request queued for the verified account email.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to request Zelle payment." },
      { status: 400 },
    );
  }
}
