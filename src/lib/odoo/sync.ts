import { pgQuery } from "@/lib/postgres/client";
import { OdooClient, type OdooCategory, type OdooProductTemplate } from "@/lib/odoo/client";
import { storeCategories } from "@/lib/categories";
import { analyzeOdooProducts } from "@/lib/odoo/analyze";
import {
  normalizeOdooCategories,
  normalizeOdooProducts,
  type NormalizedOdooProduct,
  slugify,
} from "@/lib/odoo/normalize";

function buildPreview(odooProducts: OdooProductTemplate[], odooCategories: OdooCategory[]) {
  const normalizedProducts = normalizeOdooProducts(odooProducts);
  const normalizedCategories = normalizeOdooCategories(odooCategories);
  const analysisByOdooId = new Map(
    analyzeOdooProducts(odooProducts).products.map((product) => [String(product.odoo_id), product]),
  );
  const products = normalizedProducts.products.map((product) => {
    const analysis = analysisByOdooId.get(product.odoo_id);

    if (!analysis) {
      return product;
    }

    return {
      ...product,
      brand_name: analysis.brand,
      brand_slug: slugify(analysis.brand),
      category_name: analysis.subcategory,
      category_slug: analysis.subcategory,
      specifications: {
        ...product.specifications,
        storefront_category: analysis.category,
        storefront_subcategory: analysis.subcategory,
        category_confidence: analysis.confidence,
        image_status: product.image_urls.length > 0 ? "ready" : "draft_missing_image",
      },
    };
  });
  const brands = Array.from(
    new Map(products.map((product) => [product.brand_slug, { name: product.brand_name, slug: product.brand_slug }])).values(),
  );

  return {
    counts: {
      products: products.length,
      brands: brands.length,
      categories: normalizedCategories.length,
    },
    brands,
    categories: normalizedCategories,
    products,
  };
}

export async function previewOdooCatalog(limit?: number | "all") {
  const odoo = OdooClient.fromEnv();
  const odooProducts = limit === "all"
    ? await odoo.getAllProductTemplates()
    : await odoo.getProductTemplates(limit);

  return buildPreview(odooProducts, []);
}

async function syncProductImages(product: NormalizedOdooProduct, productId: string) {
  await pgQuery("delete from product_images where product_id = $1::uuid", [productId]);
  await pgQuery("delete from product_videos where product_id = $1::uuid", [productId]);

  for (let index = 0; index < product.image_urls.length; index += 1) {
    await pgQuery(
      `insert into product_images (product_id, url, alt, sort_order)
       values ($1::uuid, $2, $3, $4)`,
      [productId, product.image_urls[index], product.name, index],
    );
  }

  for (let index = 0; index < product.video_urls.length; index += 1) {
    await pgQuery(
      `insert into product_videos (product_id, url, title, sort_order)
       values ($1::uuid, $2, $3, $4)`,
      [productId, product.video_urls[index], product.name, index],
    );
  }
}

async function syncStorefrontCategories() {
  for (const category of storeCategories) {
    await pgQuery(
      `insert into categories (name, slug, parent_id, is_active)
       values ($1, $2, null, true)
       on conflict (slug) do update set
         name = excluded.name,
         is_active = true,
         updated_at = now()`,
      [category.name.es, category.slug],
    );
  }

  const parentRows = await pgQuery<{ id: string; slug: string }>(
    "select id, slug from categories where slug = any($1::text[])",
    [storeCategories.map((category) => category.slug)],
  );
  const parentIdBySlug = new Map(parentRows.rows.map((row) => [row.slug, row.id]));

  for (const category of storeCategories) {
    const parentId = parentIdBySlug.get(category.slug);

    for (const subcategory of category.subcategories) {
      await pgQuery(
        `insert into categories (name, slug, parent_id, is_active)
         values ($1, $2, $3::uuid, true)
         on conflict (slug) do update set
           name = excluded.name,
           parent_id = excluded.parent_id,
           is_active = true,
           updated_at = now()`,
        [subcategory.name.es, subcategory.slug, parentId || null],
      );
    }
  }
}

async function syncPreviewToPostgres(preview: ReturnType<typeof buildPreview>) {
  await syncStorefrontCategories();

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

  for (const category of preview.categories) {
    await pgQuery(
      `insert into categories (odoo_id, name, slug, is_active)
       values ($1, $2, $3, true)
       on conflict (odoo_id) do update set
         name = excluded.name,
         slug = excluded.slug,
         is_active = true,
         updated_at = now()`,
      [category.odoo_id, category.name, category.slug],
    );
  }

  const brands = await pgQuery<{ id: string; slug: string }>("select id, slug from brands");
  const categories = await pgQuery<{ id: string; slug: string; odoo_id: string | null }>("select id, slug, odoo_id from categories");
  const brandIdBySlug = new Map(brands.rows.map((brand) => [brand.slug, brand.id]));
  const categoryIdBySlug = new Map(categories.rows.map((category) => [category.slug, category.id]));
  const categoryIdByOdooId = new Map(categories.rows.filter((category) => category.odoo_id).map((category) => [String(category.odoo_id), category.id]));

  for (const category of preview.categories) {
    if (!category.parent_odoo_id) {
      continue;
    }

    const id = categoryIdByOdooId.get(category.odoo_id);
    const parentId = categoryIdByOdooId.get(category.parent_odoo_id);

    if (id && parentId) {
      await pgQuery(
        "update categories set parent_id = $1::uuid, updated_at = now() where id = $2::uuid",
        [parentId, id],
      );
    }
  }

  const productIdByOdooId = new Map<string, string>();

  for (const product of preview.products) {
    const result = await pgQuery<{ id: string }>(
      `insert into products (
         odoo_id,
         sku,
         name,
         slug,
         description,
         category_id,
         brand_id,
         price_cents,
         compare_at_price_cents,
         stock_quantity,
         is_active,
         specifications,
         updated_at
       ) values (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6::uuid,
         $7::uuid,
         $8,
         $9,
         $10,
         $11,
         $12::jsonb,
         now()
       )
       on conflict (odoo_id) do update set
         sku = excluded.sku,
         name = excluded.name,
         slug = excluded.slug,
         description = excluded.description,
         category_id = excluded.category_id,
         brand_id = excluded.brand_id,
         price_cents = excluded.price_cents,
         compare_at_price_cents = excluded.compare_at_price_cents,
         stock_quantity = excluded.stock_quantity,
         is_active = excluded.is_active,
         specifications = coalesce(products.specifications, '{}'::jsonb) || excluded.specifications,
         updated_at = now()
       returning id`,
      [
        product.odoo_id,
        product.sku,
        product.name,
        product.slug,
        product.description,
        categoryIdBySlug.get(product.category_slug) || (product.category_odoo_id
          ? categoryIdByOdooId.get(product.category_odoo_id) || null
          : null),
        brandIdBySlug.get(product.brand_slug) || null,
        product.price_cents,
        product.compare_at_price_cents || null,
        product.stock_quantity,
        product.is_active && product.image_urls.length > 0,
        JSON.stringify({
          ...product.specifications,
          sync_status: product.image_urls.length > 0 ? "published" : "draft_missing_image",
          has_image: product.image_urls.length > 0,
        }),
      ],
    );

    productIdByOdooId.set(product.odoo_id, result.rows[0].id);
  }

  for (const product of preview.products) {
    const productId = productIdByOdooId.get(product.odoo_id);

    if (!productId) {
      continue;
    }

    await syncProductImages(product, productId);
  }

  return preview.counts;
}

export async function syncOdooCatalog(limit?: number | "all") {
  if (limit !== "all") {
    return syncPreviewToPostgres(await previewOdooCatalog(limit));
  }

  const odoo = OdooClient.fromEnv();
  const total = await odoo.countProductTemplates();
  const batchSize = 50;
  const totals = { products: 0, brands: 0, categories: 0 };

  for (let offset = 0; offset < total; offset += batchSize) {
    const odooProducts = await odoo.getProductTemplates(batchSize, offset, "id asc");
    const counts = await syncPreviewToPostgres(buildPreview(odooProducts, []));
    totals.products += counts.products;
    totals.brands = Math.max(totals.brands, counts.brands);
    totals.categories = Math.max(totals.categories, counts.categories);
  }

  return totals;
}
