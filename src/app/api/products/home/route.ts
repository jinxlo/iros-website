import { NextRequest, NextResponse } from "next/server";
import { getHomepageProducts } from "@/lib/data/home-products";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit") || "all";
    const limit = limitParam === "all" ? 2000 : Math.min(2000, Math.max(1, Number(limitParam)));
    const requestLimit = Math.min(limit, 64);
    const products = await getHomepageProducts(requestLimit);
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load homepage products" },
      { status: 500 },
    );
  }
}
