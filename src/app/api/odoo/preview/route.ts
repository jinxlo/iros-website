import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { previewOdooCatalog } from "@/lib/odoo/sync";

export async function GET(request: NextRequest) {
  try {
    requireApiKey(request);
    const limitParam = request.nextUrl.searchParams.get("limit") || "50";
    const limit = limitParam === "all" ? "all" : Number(limitParam);
    const preview = await previewOdooCatalog(limit);

    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to preview Odoo catalog" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
