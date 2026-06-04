import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { upsertLocalProfile } from "@/lib/auth/users";
import { pgQuery } from "@/lib/postgres/client";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

async function productBySlug(slug: string) {
  const { rows } = await pgQuery<{ id: string; slug: string }>(
    "select id, slug from products where slug = $1 and is_active = true limit 1",
    [slug],
  );

  return rows[0] || null;
}

async function qualifyingOrder(userId: string, productId: string) {
  const { rows } = await pgQuery<{ order_id: string }>(
    `select oi.order_id
     from orders o
     join order_items oi on oi.order_id = o.id
     where o.user_id = $1::uuid
       and oi.product_id = $2::uuid
       and (o.payment_status = 'paid' or o.status in ('completed', 'delivered', 'fulfilled'))
     limit 1`,
    [userId, productId],
  );

  return rows[0]?.order_id;
}

async function currentUser(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return { token: undefined, user: undefined };
  }

  return {
    token: undefined,
    user: {
      id: session.sub,
      email: session.email,
      role: session.role,
      user_metadata: {
        full_name: session.name,
      },
      app_metadata: {
        role: session.role,
      },
    },
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await productBySlug(slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { rows: reviewRows } = await pgQuery<{
      id: string;
      rating: number;
      title: string | null;
      body: string;
      created_at: string;
      full_name: string | null;
      email: string | null;
    }>(
      `select pr.id, pr.rating, pr.title, pr.body, pr.created_at, p.full_name, p.email
       from product_reviews pr
       left join profiles p on p.id = pr.user_id
       where pr.product_id = $1::uuid and pr.status = 'published'
       order by pr.created_at desc`,
      [product.id],
    );

    const reviews: Array<{ id: string; rating: number; title: string; body: string; author: string; createdAt: string }> = reviewRows.map((review: {
      id: string;
      rating: number;
      title: string | null;
      body: string;
      created_at: string;
      full_name: string | null;
      email: string | null;
    }) => {
      return {
        id: review.id,
        rating: review.rating,
        title: review.title || "",
        body: review.body,
        author: review.full_name || review.email?.split("@")[0] || "Cliente verificado",
        createdAt: review.created_at,
      };
    });
    const average = reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0;
    const { user } = await currentUser(request);
    let canReview = false;
    let alreadyReviewed = false;

    if (user) {
      const [orderId, existingReview] = await Promise.all([
        qualifyingOrder(user.id, product.id),
        pgQuery<{ id: string }>(
          "select id from product_reviews where product_id = $1::uuid and user_id = $2::uuid limit 1",
          [product.id, user.id],
        ),
      ]);

      canReview = Boolean(orderId && existingReview.rows.length === 0);
      alreadyReviewed = Boolean(existingReview.rows.length > 0);
    }

    return NextResponse.json({
      reviews,
      summary: { count: reviews.length, average },
      viewer: { authenticated: Boolean(user), canReview, alreadyReviewed },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await productBySlug(slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { user } = await currentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const payload = await request.json();
    const rating = Number(payload.rating);
    const title = typeof payload.title === "string" ? payload.title.trim().slice(0, 120) : "";
    const body = typeof payload.body === "string" ? payload.body.trim().slice(0, 2_000) : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || body.length < 10) {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }

    const existingReview = await pgQuery<{ id: string }>(
      "select id from product_reviews where product_id = $1::uuid and user_id = $2::uuid limit 1",
      [product.id, user.id],
    );

    if (existingReview.rows.length > 0) {
      return NextResponse.json({ error: "You already reviewed this product" }, { status: 409 });
    }

    const orderId = await qualifyingOrder(user.id, product.id);

    if (!orderId) {
      return NextResponse.json({ error: "Only verified buyers can review this product" }, { status: 403 });
    }

    const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

    await upsertLocalProfile({
      id: user.id,
      email: user.email || "",
      full_name: fullName,
      role: typeof user.app_metadata?.role === "string" ? user.app_metadata.role : "customer",
    });

    await pgQuery(
      `insert into product_reviews (product_id, user_id, order_id, rating, title, body, status)
       values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, 'published')`,
      [product.id, user.id, orderId, rating, title || null, body],
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit review" },
      { status: 500 },
    );
  }
}
