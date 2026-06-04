import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { syncOdooCatalog } from "@/lib/odoo/sync";

export async function POST(request: NextRequest) {
  try {
    requireApiKey(request);
    const body = (await request.json().catch(() => ({}))) as { limit?: number | "all" };
    const counts = await syncOdooCatalog(body.limit);

    return NextResponse.json({ ok: true, counts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync Odoo catalog" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
