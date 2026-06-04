import { NextRequest, NextResponse } from "next/server";
import { getCatalogFilterOptionsFromPostgres } from "@/lib/postgres/catalog";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const filterOptions = await getCatalogFilterOptionsFromPostgres(params.get("q") || "", {
      category: params.get("category") || undefined,
    });

    return NextResponse.json(filterOptions);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load product filters" },
      { status: 500 },
    );
  }
}
