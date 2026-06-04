import { NextRequest, NextResponse } from "next/server";
import { getActiveProductsFromPostgres } from "@/lib/postgres/catalog";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.min(96, Math.max(1, Number(params.get("pageSize") || 48)));
    const result = await getActiveProductsFromPostgres(params.get("q") || "", page, pageSize, {
      category: params.get("category") || undefined,
      brand: params.get("brand") || undefined,
      price: params.get("price") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load products" },
      { status: 500 },
    );
  }
}
