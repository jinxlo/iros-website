import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { slugify } from "@/lib/odoo/normalize";
import { pgQuery } from "@/lib/postgres/client";

export async function GET(request: NextRequest) {
  try {
    requireApiKey(request);
    const { rows } = await pgQuery<{
      id: string;
      name: string;
      slug: string;
      parent_id: string | null;
      odoo_id: string | null;
      is_active: boolean;
    }>(
      "select id, name, slug, parent_id, odoo_id, is_active from categories order by name asc",
    );

    return NextResponse.json({ categories: rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read categories" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireApiKey(request);
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      parent_id?: string;
      parent_slug?: string;
      image_url?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    let parentId = body.parent_id || null;

    if (!parentId && body.parent_slug) {
      const { rows } = await pgQuery<{ id: string }>(
        "select id from categories where slug = $1 limit 1",
        [body.parent_slug],
      );

      parentId = rows[0]?.id || null;
    }

    const resolvedSlug = body.slug?.trim() || slugify(body.name);
    const result = await pgQuery<{ id: string; name: string; slug: string; parent_id: string | null }>(
      `insert into categories (name, slug, parent_id, image_url, is_active)
       values ($1, $2, $3::uuid, $4, true)
       on conflict (slug) do update set
         name = excluded.name,
         parent_id = excluded.parent_id,
         image_url = excluded.image_url,
         is_active = true,
         updated_at = now()
       returning id, name, slug, parent_id`,
      [body.name.trim(), resolvedSlug, parentId, body.image_url || null],
    );

    return NextResponse.json({ category: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save category" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
