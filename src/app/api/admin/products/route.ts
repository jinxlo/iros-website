import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/api/admin-auth";
import { pgQuery } from "@/lib/postgres/client";

type ProductRow = {
  id: string;
  odoo_id: string | null;
  sku: string;
  name: string;
  slug: string;
  price_cents: number;
  stock_quantity: number;
  is_active: boolean;
  updated_at: string | null;
  specifications: Record<string, unknown> | null;
  brand_name: string | null;
  category_name: string | null;
  category_slug: string | null;
  product_images: Array<{ url: string; sort_order: number }>;
};

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const status = request.nextUrl.searchParams.get("status") || "all";
    const limit = Math.min(500, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 100)));
    let whereSql = "";

    if (status === "published") {
      whereSql = "where p.is_active = true";
    } else if (status === "draft") {
      whereSql = "where p.is_active = false";
    }

    const { rows } = await pgQuery<ProductRow>(
      `select
         p.id,
         p.odoo_id,
         p.sku,
         p.name,
         p.slug,
         p.price_cents,
         p.stock_quantity,
         p.is_active,
         p.updated_at,
         p.specifications,
         b.name as brand_name,
         c.name as category_name,
         c.slug as category_slug,
         coalesce((
           select json_agg(json_build_object('url', pi.url, 'sort_order', pi.sort_order) order by pi.sort_order)
           from product_images pi
           where pi.product_id = p.id
         ), '[]'::json) as product_images
       from products p
       left join brands b on b.id = p.brand_id
       left join categories c on c.id = p.category_id
       ${whereSql}
       order by p.updated_at desc
       limit $1`,
      [limit],
    );

    return NextResponse.json({
      products: rows.map((product) => {
        const images = product.product_images || [];

        return {
          id: product.id,
          odoo_id: product.odoo_id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          price_cents: product.price_cents,
          stock_quantity: product.stock_quantity,
          is_active: product.is_active,
          updated_at: product.updated_at,
          brand: product.brand_name || "Unassigned",
          category: product.category_name || "Unassigned",
          category_slug: product.category_slug || null,
          image_count: images.length,
          image_url: images.sort((a, b) => a.sort_order - b.sort_order)[0]?.url || null,
          sync_status: product.specifications?.sync_status || (product.is_active ? "published" : "draft"),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load admin products" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
