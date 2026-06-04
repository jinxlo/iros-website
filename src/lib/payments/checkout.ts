import { pgQuery } from "@/lib/postgres/client";

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CheckoutItem = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
};

type ProductPriceRow = {
  id: string;
  sku: string;
  name: string;
  price_cents: number;
  stock_quantity: number;
  is_active: boolean;
  brands?: { name: string } | Array<{ name: string }> | null;
};

type CheckoutPayload = {
  customer?: Partial<CheckoutCustomer>;
  items?: Partial<CheckoutItem>[];
  locale?: string;
};

type CreateOrderInput = {
  customer: CheckoutCustomer;
  items: CheckoutItem[];
  paymentMethod: "stripe" | "zelle_request";
  paymentStatus: string;
  status?: string;
  userId?: string;
  paymentReference?: string;
  zelleRequestStatus?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

export function normalizeCheckoutPayload(payload: CheckoutPayload) {
  const customer: CheckoutCustomer = {
    firstName: cleanText(payload.customer?.firstName),
    lastName: cleanText(payload.customer?.lastName),
    email: cleanEmail(payload.customer?.email),
    phone: cleanText(payload.customer?.phone),
    address: cleanText(payload.customer?.address),
    city: cleanText(payload.customer?.city),
    state: cleanText(payload.customer?.state),
    postalCode: cleanText(payload.customer?.postalCode),
    country: cleanText(payload.customer?.country) || "US",
  };
  const items = (payload.items || [])
    .map((item) => ({
      id: cleanText(item.id),
      sku: cleanText(item.sku),
      name: cleanText(item.name),
      brand: cleanText(item.brand),
      price: Number(item.price),
      quantity: Math.floor(Number(item.quantity)),
    }))
    .filter((item) => item.id && item.sku && item.name && item.price > 0 && item.quantity > 0)
    .slice(0, 50);
  const locale = payload.locale === "en" ? "en" : "es";

  return { customer, items, locale };
}

export function validateCheckout(customer: CheckoutCustomer, items: CheckoutItem[]) {
  if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
    throw new Error("Customer name, email, and phone are required.");
  }

  if (!customer.address || !customer.city || !customer.state || !customer.postalCode) {
    throw new Error("Complete shipping address is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw new Error("A valid email address is required.");
  }

  if (items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  for (const item of items) {
    if (!Number.isInteger(item.price) || item.price < 50) {
      throw new Error("Invalid cart item price.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error("Invalid cart item quantity.");
    }
  }
}

export function calculateCheckoutTotals(items: CheckoutItem[]) {
  const subtotalCents = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingCents = 0;
  const taxCents = 0;

  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
  };
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function verifyCheckoutItems(items: CheckoutItem[]) {
  const skus = Array.from(new Set(items.map((item) => item.sku)));
  const { rows } = await pgQuery<ProductPriceRow & { brand_name: string | null }>(
    `select p.id, p.sku, p.name, p.price_cents, p.stock_quantity, p.is_active, b.name as brand_name
     from products p
     left join brands b on b.id = p.brand_id
     where p.sku = any($1::text[])`,
    [skus],
  );
  const productsBySku = new Map<string, ProductPriceRow>(
    rows.map((product: ProductPriceRow & { brand_name: string | null }) => [
      product.sku,
      {
        ...product,
        brands: product.brand_name ? { name: product.brand_name } : null,
      } as ProductPriceRow,
    ]),
  );

  return items.map((item) => {
    const product = productsBySku.get(item.sku);

    if (!product || !product.is_active) {
      throw new Error(`Product ${item.sku} is not available.`);
    }

    if (product.stock_quantity < item.quantity) {
      throw new Error(`Product ${item.sku} does not have enough stock.`);
    }

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: firstRelation(product.brands)?.name || item.brand || "iroselectronics",
      price: product.price_cents,
      quantity: item.quantity,
    };
  });
}

export function generateOrderNumber() {
  return `IROS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function uuidOrNull(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export async function createCheckoutOrder({
  customer,
  items,
  paymentMethod,
  paymentStatus,
  status = "pending",
  userId,
  paymentReference,
  zelleRequestStatus,
}: CreateOrderInput) {
  const totals = calculateCheckoutTotals(items);
  const orderNumber = generateOrderNumber();
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();
  const shippingAddress = {
    name: customerName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    postalCode: customer.postalCode,
    country: customer.country,
  };

  const orderInsert = await pgQuery<{ id: string; order_number: string; total_cents: number }>(
    `insert into orders (
       user_id,
       order_number,
       status,
       payment_status,
       payment_method,
       payment_reference,
       zelle_request_status,
       zelle_requested_at,
       customer_email,
       customer_first_name,
       customer_last_name,
       customer_phone,
       subtotal_cents,
       shipping_cents,
       tax_cents,
       total_cents,
       currency,
       shipping_address,
       billing_address
     ) values (
       $1::uuid,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8,
       $9,
       $10,
       $11,
       $12,
       $13,
       $14,
       $15,
       $16,
       $17,
       $18::jsonb,
       $19::jsonb
     ) returning id, order_number, total_cents`,
    [
      userId || null,
      orderNumber,
      status,
      paymentStatus,
      paymentMethod,
      paymentReference || null,
      zelleRequestStatus || null,
      paymentMethod === "zelle_request" ? new Date().toISOString() : null,
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.phone,
      totals.subtotalCents,
      totals.shippingCents,
      totals.taxCents,
      totals.totalCents,
      "USD",
      JSON.stringify(shippingAddress),
      JSON.stringify({
        ...shippingAddress,
        paymentMethod,
      }),
    ],
  );

  const order = orderInsert.rows[0];

  for (const item of items) {
    await pgQuery(
      `insert into order_items (
         order_id,
         product_id,
         sku,
         name,
         unit_price_cents,
         quantity,
         total_cents,
         product_snapshot
       ) values ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        order.id,
        uuidOrNull(item.id),
        item.sku,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        JSON.stringify({
          id: item.id,
          sku: item.sku,
          name: item.name,
          brand: item.brand,
        }),
      ],
    );
  }

  return { order, totals };
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  return authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
}
