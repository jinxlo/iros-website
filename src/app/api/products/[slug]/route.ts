import { NextRequest, NextResponse } from "next/server";
import { getActiveProductBySlugFromPostgres } from "@/lib/postgres/catalog";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getActiveProductBySlugFromPostgres(slug);

    return NextResponse.json({ product: product || null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load product" },
      { status: 500 },
    );
  }
}
