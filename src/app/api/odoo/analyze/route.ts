import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { analyzeOdooCatalog } from "@/lib/odoo/analyze";

export async function GET(request: NextRequest) {
  try {
    requireApiKey(request);
    const limitParam = request.nextUrl.searchParams.get("limit") || "100";
    const limit = limitParam === "all"
      ? "all"
      : Math.min(500, Math.max(1, Number(limitParam)));
    const analysis = await analyzeOdooCatalog(limit);

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze Odoo catalog" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
