import { NextRequest, NextResponse } from "next/server";
import { searchProductsFromPostgres } from "@/lib/postgres/catalog";

const SEARCH_CACHE_TTL = 30_000;
const searchCache = new Map<string, { expiresAt: number; products: Awaited<ReturnType<typeof searchProductsFromPostgres>> }>();

function normalized(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get("q")?.trim() || "";
    const query = normalized(rawQuery);
    const limit = Math.min(12, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 6)));

    if (query.length < 1) {
      return NextResponse.json({ products: [] });
    }

    const cacheKey = `${query}:${limit}`;
    const cached = searchCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ products: cached.products });
    }

    const products = await searchProductsFromPostgres(rawQuery, limit);

    searchCache.set(cacheKey, {
      expiresAt: Date.now() + SEARCH_CACHE_TTL,
      products,
    });

    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search products" },
      { status: 500 },
    );
  }
}
