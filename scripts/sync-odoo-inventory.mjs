#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DATABASE_URL = "postgresql://iros:irospass@127.0.0.1:5434/iroselectronics";

function parseArgs() {
  const options = { startOffset: 0, endOffset: undefined, batchSize: 50 };

  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    const next = () => process.argv[++index] || "";

    if (arg === "--start-offset") options.startOffset = Math.max(0, Number(next()) || 0);
    else if (arg === "--end-offset") options.endOffset = Math.max(0, Number(next()) || 0);
    else if (arg === "--batch-size") options.batchSize = Math.max(1, Number(next()) || 50);
  }

  return options;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "item";
}

function cleanText(value) {
  return value ? String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

function inferBrandName(productName, sku) {
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
    "Mabe",
    "Drija",
    "Breville",
    "Oster",
    "Hisense",
    "Cuisinart",
  ];
  const lowerName = String(productName || "").toLowerCase();
  const match = knownBrands.find((brand) => lowerName.includes(brand.toLowerCase()));

  if (match) return match === "Black & Decker" ? "Black+Decker" : match;

  if (sku) {
    const skuPrefix = String(sku).split(/[-_]/)[0];
    if (skuPrefix && skuPrefix.length >= 2 && skuPrefix.length <= 12) return skuPrefix.toUpperCase();
  }

  return "IROS Electronics";
}

class OdooClient {
  constructor() {
    this.baseUrl = requiredEnv("ODOO_BASE_URL").replace(/\/$/, "");
    this.database = requiredEnv("ODOO_DATABASE");
    this.login = (process.env.ODOO_LOGIN || requiredEnv("ODOO_USERNAME")).trim();
    this.passwordOrKey = (process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD || "").trim();
    this.uid = undefined;

    if (!this.passwordOrKey) throw new Error("Set ODOO_PASSWORD or ODOO_API_KEY for Odoo JSON-RPC access.");
  }

  async jsonRpc(service, method, args) {
    let lastError;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const response = await fetch(`${this.baseUrl}/jsonrpc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { service, method, args }, id: Date.now() }),
        });

        if (!response.ok) throw new Error(`Odoo JSON-RPC HTTP error: ${response.status}`);
        const payload = await response.json();
        if (payload.error) throw new Error(payload.error.data?.message || payload.error.message || "Odoo JSON-RPC error");

        return payload.result;
      } catch (error) {
        lastError = error;
        if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }

    throw lastError;
  }

  async authenticate() {
    if (this.uid) return this.uid;

    this.uid = await this.jsonRpc("common", "authenticate", [this.database, this.login, this.passwordOrKey, {}]);
    if (!this.uid) throw new Error("Odoo authentication failed.");

    return this.uid;
  }

  async executeKw(model, method, args = [], kwargs = {}) {
    const uid = await this.authenticate();

    return this.jsonRpc("object", "execute_kw", [this.database, uid, this.passwordOrKey, model, method, args, kwargs]);
  }

  async countProductTemplates() {
    return this.executeKw("product.template", "search_count", [[]]);
  }

  async getProductTemplateIds() {
    return this.executeKw("product.template", "search", [[]], { order: "id asc" });
  }

  async getProductTemplates(limit = 100, offset = 0, order = "id asc") {
    return this.executeKw(
      "product.template",
      "search_read",
      [[]],
      {
        fields: [
          "id",
          "name",
          "default_code",
          "barcode",
          "list_price",
          "qty_available",
          "virtual_available",
          "active",
          "sale_ok",
          "description_sale",
          "description",
          "image_1920",
          "image_1024",
          "categ_id",
          "product_variant_ids",
          "write_date",
        ],
        limit,
        offset,
        order,
      },
    );
  }

  async getCategories() {
    return this.executeKw("product.category", "search_read", [[]], {
      fields: ["id", "name", "complete_name", "parent_id"],
      limit: 3000,
      order: "complete_name asc",
    });
  }
}

function imageUrls(product) {
  const image = product.image_1920 || product.image_1024;
  if (!image || typeof image !== "string") return [];
  if (image.startsWith("http://") || image.startsWith("https://")) return [image];
  return [`data:image/webp;base64,${image}`];
}

function normalizeProduct(product, categoryName) {
  const sku = typeof product.default_code === "string" && product.default_code ? product.default_code : `ODOO-${product.id}`;
  const brandName = inferBrandName(product.name, product.default_code);
  const images = imageUrls(product);
  const priceCents = Math.round(Number(product.list_price || 0) * 100);
  const hasImage = images.length > 0;
  const hasPrice = priceCents > 0;
  const publishable = product.active !== false && product.sale_ok !== false && hasImage && hasPrice;

  return {
    odoo_id: String(product.id),
    sku,
    barcode: typeof product.barcode === "string" ? product.barcode : undefined,
    name: product.name,
    slug: `${slugify(product.name)}-${product.id}`,
    description: cleanText(product.description_sale) || cleanText(product.description),
    category_odoo_id: product.categ_id ? String(product.categ_id[0]) : undefined,
    category_name: categoryName || "General",
    category_slug: slugify(categoryName || "General"),
    brand_name: brandName,
    brand_slug: slugify(brandName),
    price_cents: priceCents,
    stock_quantity: Math.max(0, Math.round(Number(product.qty_available || product.virtual_available || 0))),
    is_active: publishable,
    image_urls: images,
    video_urls: [],
    missing_image: !hasImage,
    missing_price: !hasPrice,
    specifications: {
      source: "odoo",
      odoo_write_date: product.write_date || "",
      odoo_category: categoryName || "General",
      variant_count: product.product_variant_ids?.length || 0,
      sync_status: publishable ? "published" : !hasImage ? "draft_missing_image" : "draft_missing_price",
      has_image: hasImage,
      has_price: hasPrice,
    },
  };
}

async function ensureSchema(client) {
  await client.query(fs.readFileSync(path.join(ROOT, "postgres", "local-schema.sql"), "utf8"));
}

async function upsertBrand(client, brand) {
  const result = await client.query(
    `insert into brands (name, slug)
     values ($1, $2)
     on conflict (slug) do update set name = excluded.name, updated_at = now()
     returning id`,
    [brand.name, brand.slug],
  );

  return result.rows[0].id;
}

async function upsertCategory(client, category) {
  const result = await client.query(
    `insert into categories (odoo_id, name, slug, is_active)
     values ($1, $2, $3, true)
     on conflict (odoo_id) do update set name = excluded.name, slug = excluded.slug, is_active = true, updated_at = now()
     returning id`,
    [category.odoo_id, category.name, category.slug],
  );

  return result.rows[0].id;
}

async function upsertProduct(client, product, brandId, categoryId) {
  const result = await client.query(
    `insert into products (
       odoo_id, sku, name, slug, description, category_id, brand_id, price_cents, stock_quantity, is_active, specifications, updated_at
     ) values (
       $1, $2, $3, $4, $5, $6::uuid, $7::uuid, $8, $9, $10, $11::jsonb, now()
     )
     on conflict (odoo_id) do update set
       sku = excluded.sku,
       name = excluded.name,
       slug = excluded.slug,
       description = excluded.description,
       category_id = excluded.category_id,
       brand_id = excluded.brand_id,
       price_cents = excluded.price_cents,
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
      categoryId,
      brandId,
      product.price_cents,
      product.stock_quantity,
      product.is_active,
      JSON.stringify(product.specifications),
    ],
  );

  return result.rows[0].id;
}

async function syncProductMedia(client, productId, product) {
  await client.query("delete from product_images where product_id = $1::uuid", [productId]);
  await client.query("delete from product_videos where product_id = $1::uuid", [productId]);

  for (let index = 0; index < product.image_urls.length; index += 1) {
    await client.query(
      `insert into product_images (product_id, url, alt, sort_order)
       values ($1::uuid, $2, $3, $4)`,
      [productId, product.image_urls[index], product.name, index],
    );
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeReportFiles(summary, missingImages, missingPrices) {
  const reportDir = path.join(ROOT, "reports", "odoo-inventory");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.mkdirSync(reportDir, { recursive: true });

  const summaryPath = path.join(reportDir, `summary-${stamp}.json`);
  const missingImagesPath = path.join(reportDir, `missing-images-${stamp}.csv`);
  const missingPricesPath = path.join(reportDir, `missing-prices-${stamp}.csv`);
  const csvHeaders = ["odoo_id", "sku", "name", "price", "stock", "category"];
  const toCsv = (items) => [
    csvHeaders.join(","),
    ...items.map((item) => csvHeaders.map((header) => csvEscape(item[header])).join(",")),
  ].join("\n");

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  fs.writeFileSync(missingImagesPath, toCsv(missingImages));
  fs.writeFileSync(missingPricesPath, toCsv(missingPrices));

  return { summaryPath, missingImagesPath, missingPricesPath };
}

async function reportRows(client, currentOdooIds, specificationKey) {
  const result = await client.query(
    `select
       p.odoo_id,
       p.sku,
       p.name,
       (p.price_cents::numeric / 100)::text as price,
       p.stock_quantity::text as stock,
       coalesce(c.name, '') as category
     from products p
     left join categories c on c.id = p.category_id
     where p.odoo_id = any($1::text[])
       and p.specifications->>$2 = 'false'
     order by p.name asc`,
    [currentOdooIds, specificationKey],
  );

  return result.rows;
}

async function main() {
  const options = parseArgs();
  loadEnvFile(path.join(ROOT, ".env"));
  loadEnvFile(path.join(ROOT, ".env.local"));

  const client = new pg.Client({ connectionString: process.env.LOCAL_DATABASE_URL || process.env.POSTGRES_URL || DEFAULT_DATABASE_URL });
  const odoo = new OdooClient();

  await client.connect();

  try {
    await ensureSchema(client);

    console.log("Fetching Odoo categories...");
    const odooCategories = await odoo.getCategories();
    const categoryById = new Map(odooCategories.map((category) => [String(category.id), category]));
    const categoryIdByOdooId = new Map();

    for (const category of odooCategories) {
      const id = await upsertCategory(client, {
        odoo_id: String(category.id),
        name: category.name,
        slug: slugify(category.complete_name || category.name),
      });
      categoryIdByOdooId.set(String(category.id), id);
    }

    for (const category of odooCategories) {
      if (!category.parent_id) continue;
      const categoryId = categoryIdByOdooId.get(String(category.id));
      const parentId = categoryIdByOdooId.get(String(category.parent_id[0]));
      if (categoryId && parentId) {
        await client.query("update categories set parent_id = $1::uuid, updated_at = now() where id = $2::uuid", [parentId, categoryId]);
      }
    }

    console.log("Fetching all Odoo products...");
    const total = await odoo.countProductTemplates();
    const currentOdooIds = (await odoo.getProductTemplateIds()).map((id) => String(id));
    const summary = { totalOdooProducts: total, synced: 0, published: 0, missingImages: 0, missingPrices: 0, deactivatedNonCurrent: 0 };

    const endOffset = typeof options.endOffset === "number" ? Math.min(options.endOffset, total) : total;

    for (let offset = options.startOffset; offset < endOffset; offset += options.batchSize) {
      const products = await odoo.getProductTemplates(options.batchSize, offset, "id asc");

      for (const product of products) {
        const categoryOdooId = product.categ_id ? String(product.categ_id[0]) : undefined;
        const categoryName = categoryOdooId ? (categoryById.get(categoryOdooId)?.name || "General") : "General";
        const normalized = normalizeProduct(product, categoryName);
        const brandId = await upsertBrand(client, { name: normalized.brand_name, slug: normalized.brand_slug });
        const categoryId = normalized.category_odoo_id ? categoryIdByOdooId.get(normalized.category_odoo_id) || null : null;
        const productId = await upsertProduct(client, normalized, brandId, categoryId);

        await syncProductMedia(client, productId, normalized);
        summary.synced += 1;
        if (normalized.is_active) summary.published += 1;
      }

      console.log(`Synced ${Math.min(offset + options.batchSize, endOffset)}/${total} Odoo products...`);
    }

    const deactivated = await client.query(
      `update products
       set is_active = false,
           specifications = coalesce(specifications, '{}'::jsonb) || '{"sync_status":"draft_not_current_odoo","source":"not_current_odoo"}'::jsonb,
           updated_at = now()
       where odoo_id is null or not (odoo_id = any($1::text[]))`,
      [currentOdooIds],
    );
    summary.deactivatedNonCurrent = deactivated.rowCount;
    const publishedResult = await client.query(
      `select count(*)::int as count
       from products
       where odoo_id = any($1::text[]) and is_active = true`,
      [currentOdooIds],
    );
    const missingImages = await reportRows(client, currentOdooIds, "has_image");
    const missingPrices = await reportRows(client, currentOdooIds, "has_price");
    summary.published = publishedResult.rows[0].count;
    summary.missingImages = missingImages.length;
    summary.missingPrices = missingPrices.length;

    const paths = writeReportFiles(summary, missingImages, missingPrices);

    console.log("Odoo inventory sync complete.");
    console.log(JSON.stringify({ ...summary, reports: paths }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
