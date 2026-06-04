import type { Locale, Product, ProductSpecGroup } from "@/lib/content";
import { removeProductImageBackground } from "@/lib/server/product-image-background";
import { isStorefrontImageUsable } from "@/lib/server/product-image-quality";
import { pgQuery } from "@/lib/postgres/client";

export type ProductsCatalogResult = {
  products: Product[];
  hasNextPage: boolean;
};

export type ProductCatalogFilterOptions = {
  brands: string[];
  specs: string[];
  prices: string[];
};

export type CatalogFilters = {
  category?: string;
  brand?: string;
  price?: string;
};

export type HomepageProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  brand: string;
  category: string;
  categorySlug: string;
  imageUrl: string;
  imageAlt: string;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock_quantity: number;
  specifications: Record<string, unknown> | null;
  brand_name: string | null;
  category_name: string | null;
  category_slug: string | null;
  product_images: Array<{ url: string; alt: string | null; sort_order: number }>;
  product_videos: Array<{ url: string; title: string | null; sort_order: number }>;
};

function localized(value: string): Record<Locale, string> {
  return { es: value, en: value };
}

function productDescription(product: ProductRow) {
  const enrichedDescription = product.specifications?.enriched_description;

  if (typeof enrichedDescription === "string" && enrichedDescription.trim()) {
    return enrichedDescription.trim();
  }

  if (product.description?.trim()) {
    return product.description.trim();
  }

  const brand = product.brand_name || "iroselectronics";
  const category = product.category_name || "tecnologia";

  return `${product.name} de ${brand}, disponible en ${category} con inventario actualizado.`;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function stringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0),
  );
}

function enrichedSpecs(specifications: Record<string, unknown> | null) {
  const publicSpecs = stringArray(specifications?.public_specs);

  if (publicSpecs.length > 0) {
    return publicSpecs;
  }

  const enrichment = specifications?.spec_enrichment;
  const fields = stringRecord(enrichment && typeof enrichment === "object" && !Array.isArray(enrichment)
    ? (enrichment as Record<string, unknown>).fields
    : undefined);

  return Object.entries(fields).map(([key, value]) => `${key}: ${value}`);
}

function validSpecGroups(value: unknown): ProductSpecGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((group) => {
      if (!group || typeof group !== "object" || Array.isArray(group)) {
        return undefined;
      }

      const record = group as Record<string, unknown>;
      const title = typeof record.title === "string" && record.title.trim() ? record.title.trim() : "Generales";
      const specs = Array.isArray(record.specs)
        ? record.specs
            .map((spec) => {
              if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
                return undefined;
              }

              const specRecord = spec as Record<string, unknown>;
              const label = typeof specRecord.label === "string" ? specRecord.label.trim() : "";
              const value = typeof specRecord.value === "string" ? specRecord.value.trim() : "";

              return label && value ? { label, value } : undefined;
            })
            .filter((spec): spec is { label: string; value: string } => Boolean(spec))
        : [];

      return specs.length > 0 ? { title, specs } : undefined;
    })
    .filter((group): group is ProductSpecGroup => Boolean(group));
}

function productSpecGroups(product: ProductRow) {
  const groups = validSpecGroups(product.specifications?.spec_groups);

  if (groups.length > 0) {
    return { es: groups, en: groups };
  }

  const enrichment = product.specifications?.spec_enrichment;
  const nestedGroups = validSpecGroups(enrichment && typeof enrichment === "object" && !Array.isArray(enrichment)
    ? (enrichment as Record<string, unknown>).spec_groups
    : undefined);

  return nestedGroups.length > 0 ? { es: nestedGroups, en: nestedGroups } : undefined;
}

function productSpecs(product: ProductRow) {
  const category = product.category_name || "Catalogo";
  const brand = product.brand_name || "iroselectronics";
  const baseSpecs = [`SKU ${product.sku}`, `Marca ${brand}`, category];
  const specs = [...baseSpecs, ...enrichedSpecs(product.specifications)];
  const syncStatus = product.specifications?.sync_status;

  if (typeof syncStatus === "string") {
    specs.push(syncStatus === "published" ? "Publicado" : "Draft");
  }

  const uniqueSpecs = specs.filter((spec, index, items) => items.findIndex((item) => item.toLowerCase() === spec.toLowerCase()) === index);

  return { es: uniqueSpecs, en: uniqueSpecs };
}

function publicSpecOptionsFromRows(products: Array<{ category_name: string | null; specifications: Record<string, unknown> | null }>) {
  return Array.from(
    new Set(
      products
        .flatMap((product) => {
          const category = product.category_name || "Catalogo";
          const syncStatus = product.specifications?.sync_status;
          const specs = [category, ...enrichedSpecs(product.specifications).slice(0, 8)];

          if (typeof syncStatus === "string") {
            specs.push(syncStatus === "published" ? "Publicado" : "Draft");
          }

          return specs;
        })
        .filter((spec) => !/^(publicado|published|draft)$/i.test(spec)),
    ),
  ).sort((a, b) => a.localeCompare(b)).slice(0, 60);
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

async function mapProduct(product: ProductRow): Promise<Product | null> {
  const images = [...(product.product_images || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((image) => isStorefrontImageUsable(image.url));

  if (images.length === 0) {
    return null;
  }

  const videos = [...(product.product_videos || [])].sort((a, b) => a.sort_order - b.sort_order);
  const cleanedImageUrls = await Promise.all(images.map((image) => removeProductImageBackground(image.url)));

  return {
    id: product.slug,
    sku: product.sku,
    brand: product.brand_name || "iroselectronics",
    name: localized(product.name),
    description: localized(productDescription(product)),
    category: localized(product.category_name || "Productos"),
    categorySlug: product.category_slug || undefined,
    badge: localized("Disponible"),
    price: product.price_cents,
    compareAt: product.compare_at_price_cents || undefined,
    stock: product.stock_quantity,
    rating: 4.8,
    specs: productSpecs(product),
    specGroups: productSpecGroups(product),
    imageClass: "from-slate-50 via-cyan-50 to-blue-100",
    imageUrls: cleanedImageUrls,
    videoUrls: videos.map((video) => video.url),
  };
}

function priceRangeClause(price?: string) {
  if (!price || price === "all") {
    return { sql: "", params: [] as unknown[] };
  }

  if (price === "under-100") return { sql: " and p.price_cents >= $PRICE_START and p.price_cents < $PRICE_END", params: [0, 10_000] };
  if (price === "100-500") return { sql: " and p.price_cents >= $PRICE_START and p.price_cents < $PRICE_END", params: [10_000, 50_000] };
  if (price === "500-1000") return { sql: " and p.price_cents >= $PRICE_START and p.price_cents < $PRICE_END", params: [50_000, 100_000] };
  if (price === "1000-2500") return { sql: " and p.price_cents >= $PRICE_START and p.price_cents < $PRICE_END", params: [100_000, 250_000] };
  if (price === "over-2500") return { sql: " and p.price_cents >= $PRICE_START", params: [250_000] };

  return { sql: "", params: [] as unknown[] };
}

async function categoryIdsForFilter(category: string | undefined) {
  if (!category || category === "all") {
    return undefined;
  }

  const result = await pgQuery<{ id: string }>(
    `with recursive matching as (
       select id
       from categories
       where lower(slug) = lower($1) or lower(name) = lower($1)
     ), descendants as (
       select id from matching
       union all
       select c.id
       from categories c
       join descendants d on c.parent_id = d.id
     )
     select id from descendants`,
    [category],
  );

  return result.rows.map((row: { id: string }) => row.id);
}

async function baseProductRows(whereSql: string, params: unknown[], limit?: number, offset?: number): Promise<ProductRow[]> {
  const paginated = typeof limit === "number"
    ? ` limit ${limit} offset ${offset || 0}`
    : "";

  const result = await pgQuery<ProductRow>(
    `select
       p.id,
       p.sku,
       p.name,
       p.slug,
       p.description,
       p.price_cents,
       p.compare_at_price_cents,
       p.stock_quantity,
       p.specifications,
       b.name as brand_name,
       c.name as category_name,
       c.slug as category_slug,
       coalesce((
         select json_agg(json_build_object('url', pi.url, 'alt', pi.alt, 'sort_order', pi.sort_order) order by pi.sort_order)
         from product_images pi
         where pi.product_id = p.id
       ), '[]'::json) as product_images,
       coalesce((
         select json_agg(json_build_object('url', pv.url, 'title', pv.title, 'sort_order', pv.sort_order) order by pv.sort_order)
         from product_videos pv
         where pv.product_id = p.id
       ), '[]'::json) as product_videos
     from products p
     left join brands b on b.id = p.brand_id
     left join categories c on c.id = p.category_id
     where p.is_active = true and p.stock_quantity > 0 ${whereSql}
     order by p.updated_at desc${paginated}`,
    params,
  );

  return result.rows.map((row: ProductRow) => ({
    ...row,
    product_images: Array.isArray(row.product_images) ? row.product_images : [],
    product_videos: Array.isArray(row.product_videos) ? row.product_videos : [],
  }));
}

export async function getHomepageProductsFromPostgres(limit = 32): Promise<HomepageProduct[]> {
  const requestLimit = Math.min(Math.max(1, Math.floor(limit)), 64);
  const windowSize = Math.max(requestLimit * 3, 72);
  const rows = await baseProductRows("", [], windowSize, 0);
  const shuffled = shuffle(rows);
  const mapped = await Promise.all(
    shuffled.map(async (product: ProductRow) => {
      const image = [...(product.product_images || [])]
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .find((item: { url: string }) => isStorefrontImageUsable(item.url));

      if (!image) {
        return null;
      }

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: product.price_cents,
        stock: product.stock_quantity,
        brand: product.brand_name || "iroselectronics",
        category: product.category_name || "Electronica",
        categorySlug: product.category_slug || "productos",
        imageUrl: await removeProductImageBackground(image.url),
        imageAlt: image.alt || product.name,
      };
    }),
  );

  return shuffle(mapped.filter((item): item is HomepageProduct => item !== null)).slice(0, requestLimit);
}

export async function getActiveProductsFromPostgres(
  searchQuery = "",
  page = 1,
  pageSize = 48,
  filters: CatalogFilters = {},
): Promise<ProductsCatalogResult> {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 48;
  const offset = (safePage - 1) * safePageSize;
  const params: unknown[] = [];
  let whereSql = "";

  if (searchQuery) {
    params.push(`%${searchQuery}%`);
    whereSql += ` and (p.name ilike $${params.length} or p.sku ilike $${params.length})`;
  }

  if (filters.brand && filters.brand !== "all") {
    params.push(filters.brand);
    whereSql += ` and b.name = $${params.length}`;
  }

  const categoryIds = await categoryIdsForFilter(filters.category);

  if (categoryIds && categoryIds.length === 0) {
    return { products: [], hasNextPage: false };
  }

  if (categoryIds && categoryIds.length > 0) {
    params.push(categoryIds);
    whereSql += ` and p.category_id = any($${params.length}::uuid[])`;
  }

  const priceFilter = priceRangeClause(filters.price);

  if (priceFilter.params.length === 2) {
    params.push(priceFilter.params[0], priceFilter.params[1]);
    whereSql += ` and p.price_cents >= $${params.length - 1} and p.price_cents < $${params.length}`;
  } else if (priceFilter.params.length === 1) {
    params.push(priceFilter.params[0]);
    whereSql += ` and p.price_cents >= $${params.length}`;
  }

  const rows = await baseProductRows(whereSql, params, safePageSize + 1, offset);
  const mapped = await Promise.all(rows.slice(0, safePageSize).map(mapProduct));

  return {
    products: mapped.filter((item): item is Product => item !== null),
    hasNextPage: rows.length > safePageSize,
  };
}

export async function getCatalogFilterOptionsFromPostgres(
  searchQuery = "",
  filters: Pick<CatalogFilters, "category"> = {},
): Promise<ProductCatalogFilterOptions> {
  const params: unknown[] = [];
  let whereSql = "";

  if (searchQuery) {
    params.push(`%${searchQuery}%`);
    whereSql += ` and (p.name ilike $${params.length} or p.sku ilike $${params.length})`;
  }

  const categoryIds = await categoryIdsForFilter(filters.category);

  if (categoryIds && categoryIds.length === 0) {
    return { brands: [], specs: [], prices: [] };
  }

  if (categoryIds && categoryIds.length > 0) {
    params.push(categoryIds);
    whereSql += ` and p.category_id = any($${params.length}::uuid[])`;
  }

  const result = await pgQuery<{
    brand_name: string | null;
    category_name: string | null;
    price_cents: number;
    specifications: Record<string, unknown> | null;
  }>(
    `select b.name as brand_name, c.name as category_name, p.price_cents, p.specifications
     from products p
     left join brands b on b.id = p.brand_id
     left join categories c on c.id = p.category_id
     where p.is_active = true and p.stock_quantity > 0 ${whereSql}
     order by p.name asc
     limit 5000`,
    params,
  );

  const rows = result.rows;
  const brands = (Array.from(
    new Set(rows.map((row: { brand_name: string | null }) => row.brand_name).filter((brand: string | null): brand is string => Boolean(brand))),
  ) as string[]).sort((a, b) => a.localeCompare(b));
  const prices = ([
    ...new Set(
      rows.map((product: {
        brand_name: string | null;
        category_name: string | null;
        price_cents: number;
        specifications: Record<string, unknown> | null;
      }) => {
        if (product.price_cents < 10_000) return "under-100";
        if (product.price_cents < 50_000) return "100-500";
        if (product.price_cents < 100_000) return "500-1000";
        if (product.price_cents < 250_000) return "1000-2500";
        return "over-2500";
      }),
    ),
  ] as string[]);

  return {
    brands,
    specs: publicSpecOptionsFromRows(rows),
    prices,
  };
}

export async function getActiveProductBySlugFromPostgres(slug: string) {
  const rows = await baseProductRows(" and p.slug = $1", [slug]);

  if (rows.length === 0) {
    return undefined;
  }

  return mapProduct(rows[0]);
}

export type SearchProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  brand: string;
  category: string;
  imageUrl?: string;
  imageAlt?: string;
};

export async function searchProductsFromPostgres(rawQuery: string, limit = 6): Promise<SearchProduct[]> {
  const query = rawQuery.trim();

  if (!query) {
    return [];
  }

  const rows = await baseProductRows(" and (p.name ilike $1 or p.sku ilike $1)", [`%${query}%`], Math.max(limit * 12, 48), 0);
  const products: SearchProduct[] = [];

  for (const product of rows) {
    if (products.length >= limit) {
      break;
    }

    const image = [...(product.product_images || [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .find((item) => isStorefrontImageUsable(item.url));

    if (!image) {
      continue;
    }

    products.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price: product.price_cents,
      brand: product.brand_name || "iroselectronics",
      category: product.category_name || "Producto",
      imageUrl: await removeProductImageBackground(image.url),
      imageAlt: image.alt || product.name,
    });
  }

  return products;
}

export async function searchImagesByProductIds(productIds: string[]) {
  if (productIds.length === 0) {
    return {} as Record<string, { imageUrl: string; imageAlt: string }>;
  }

  const result = await pgQuery<{
    product_id: string;
    url: string;
    alt: string | null;
    sort_order: number;
  }>(
    `select product_id, url, alt, sort_order
     from product_images
     where product_id = any($1::uuid[])
     order by sort_order asc`,
    [productIds],
  );

  const images: Record<string, { imageUrl: string; imageAlt: string }> = {};

  for (const image of result.rows) {
    if (!images[image.product_id] && isStorefrontImageUsable(image.url)) {
      images[image.product_id] = {
        imageUrl: await removeProductImageBackground(image.url),
        imageAlt: image.alt || "Producto iroselectronics",
      };
    }
  }

  return images;
}
