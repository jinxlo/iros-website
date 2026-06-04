import type { OdooCategory, OdooProductTemplate } from "@/lib/odoo/client";

export type NormalizedOdooProduct = {
  odoo_id: string;
  sku: string;
  barcode?: string;
  name: string;
  slug: string;
  description: string;
  category_odoo_id?: string;
  category_slug: string;
  category_name: string;
  brand_slug: string;
  brand_name: string;
  price_cents: number;
  compare_at_price_cents?: number;
  stock_quantity: number;
  is_active: boolean;
  image_urls: string[];
  video_urls: string[];
  specifications: Record<string, string | number | boolean>;
};

export type NormalizedOdooCategory = {
  odoo_id: string;
  name: string;
  slug: string;
  parent_odoo_id?: string;
  full_path: string;
};

export type NormalizedOdooBrand = {
  name: string;
  slug: string;
};

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "item";
}

function cleanText(value: string | false | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function inferBrandName(productName: string, sku?: string | false) {
  const knownBrands = [
    "Samsung",
    "LG",
    "Sony",
    "Whirlpool",
    "Frigidaire",
    "GE",
    "General Electric",
    "Bosch",
    "KitchenAid",
    "Electrolux",
    "Toshiba",
    "Aiwa",
    "Black+Decker",
    "Black & Decker",
    "Ninja",
  ];
  const match = knownBrands.find((brand) =>
    productName.toLowerCase().includes(brand.toLowerCase()),
  );

  if (match) {
    return match === "Black & Decker" ? "Black+Decker" : match;
  }

  if (sku && typeof sku === "string") {
    const skuPrefix = sku.split(/[-_]/)[0];

    if (skuPrefix && skuPrefix.length >= 2 && skuPrefix.length <= 12) {
      return skuPrefix.toUpperCase();
    }
  }

  return "IROS Electronics";
}

function imageFromBase64(product: OdooProductTemplate) {
  const image = product.image_1920 || product.image_1024;

  if (!image || typeof image !== "string") {
    return [];
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return [image];
  }

  return [`data:image/webp;base64,${image}`];
}

export function normalizeOdooCategories(categories: OdooCategory[]): NormalizedOdooCategory[] {
  return categories.map((category) => {
    const fullPath = category.complete_name || category.name;

    return {
      odoo_id: String(category.id),
      name: category.name,
      slug: slugify(fullPath),
      parent_odoo_id: category.parent_id ? String(category.parent_id[0]) : undefined,
      full_path: fullPath,
    };
  });
}

export function normalizeOdooProducts(products: OdooProductTemplate[]) {
  const normalizedProducts = products.map<NormalizedOdooProduct>((product) => {
    const sku = typeof product.default_code === "string" && product.default_code
      ? product.default_code
      : `ODOO-${product.id}`;
    const categoryName = product.categ_id ? product.categ_id[1] : "General";
    const brandName = inferBrandName(product.name, product.default_code);
    const description = cleanText(product.description_sale) || cleanText(product.description);

    return {
      odoo_id: String(product.id),
      sku,
      barcode: typeof product.barcode === "string" ? product.barcode : undefined,
      name: product.name,
      slug: `${slugify(product.name)}-${product.id}`,
      category_odoo_id: product.categ_id ? String(product.categ_id[0]) : undefined,
      description,
      category_slug: slugify(categoryName),
      category_name: categoryName,
      brand_slug: slugify(brandName),
      brand_name: brandName,
      price_cents: Math.round(Number(product.list_price || 0) * 100),
      compare_at_price_cents: undefined,
      stock_quantity: Math.max(0, Math.round(Number(product.qty_available || product.virtual_available || 0))),
      is_active: product.active !== false && product.sale_ok !== false,
      image_urls: imageFromBase64(product),
      video_urls: [],
      specifications: {
        odoo_write_date: product.write_date || "",
        odoo_category: categoryName,
        variant_count: product.product_variant_ids?.length || 0,
      },
    };
  });
  const brands = Array.from(
    new Map(
      normalizedProducts.map((product) => [
        product.brand_slug,
        { name: product.brand_name, slug: product.brand_slug },
      ]),
    ).values(),
  );

  return { products: normalizedProducts, brands };
}
