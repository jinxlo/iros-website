import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { previewOdooCatalog } from "@/lib/odoo/sync";
import { pgQuery } from "@/lib/postgres/client";

export async function GET(request: NextRequest) {
  try {
    requireApiKey(request);
    const { rows } = await pgQuery<{ id: string; name: string; slug: string; logo_url: string | null }>(
      "select id, name, slug, logo_url from brands order by name asc",
    );

    return NextResponse.json({ brands: rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read brands" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireApiKey(request);
    const body = (await request.json().catch(() => ({}))) as { limit?: number };
    const preview = await previewOdooCatalog(body.limit || 300);

    for (const brand of preview.brands) {
      await pgQuery(
        `insert into brands (name, slug)
         values ($1, $2)
         on conflict (slug) do update set
           name = excluded.name,
           updated_at = now()`,
        [brand.name, brand.slug],
      );
    }

    const { rows } = await pgQuery<{ id: string; name: string; slug: string }>(
      "select id, name, slug from brands order by name asc",
    );

    return NextResponse.json({ brands: rows, count: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync brands" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
