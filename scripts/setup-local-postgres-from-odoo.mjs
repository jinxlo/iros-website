#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseArgs() {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const source = sourceArg ? sourceArg.split("=")[1] : "odoo";

  if (!["odoo", "manifest"].includes(source)) {
    throw new Error("Invalid --source. Use --source=odoo or --source=manifest");
  }

  return { source };
}

function walkFiles(directory, files = []) {
  if (!fs.existsSync(directory)) {
    return files;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walkFiles(absolutePath, files);
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function toPublicImageUrl(absolutePath) {
  const publicRoot = path.join(ROOT, "public");
  const relative = path.relative(publicRoot, absolutePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return undefined;
  }

  return `/${relative.split(path.sep).join("/")}`;
}

function resolveManifestImagePath(item, filesByBasename) {
  const candidates = [item.output_path, item.review_output_path].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = String(candidate).replace(/^public\//, "");
    const absolute = path.resolve(ROOT, normalized);

    if (fs.existsSync(absolute)) {
      return absolute;
    }

    const byBaseName = filesByBasename.get(path.basename(normalized));

    if (byBaseName && fs.existsSync(byBaseName)) {
      return byBaseName;
    }
  }

  return undefined;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);

    if (!match) {
      continue;
    }

    let value = match[2].trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[match[1]]) {
      process.env[match[1]] = value;
    }
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

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
  if (!value) {
    return "";
  }

  return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
  ];
  const lowerName = String(productName || "").toLowerCase();
  const match = knownBrands.find((brand) => lowerName.includes(brand.toLowerCase()));

  if (match) {
    return match === "Black & Decker" ? "Black+Decker" : match;
  }

  if (sku) {
    const skuPrefix = String(sku).split(/[-_]/)[0];

    if (skuPrefix && skuPrefix.length >= 2 && skuPrefix.length <= 12) {
      return skuPrefix.toUpperCase();
    }
  }

  return "IROS Electronics";
}

class OdooClient {
  constructor() {
    this.baseUrl = getRequiredEnv("ODOO_BASE_URL").replace(/\/$/, "");
    this.database = getRequiredEnv("ODOO_DATABASE");
    this.login = (process.env.ODOO_LOGIN || getRequiredEnv("ODOO_USERNAME")).trim();
    this.passwordOrKey = (process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD || "").trim();
    this.uid = undefined;

    if (!this.passwordOrKey) {
      throw new Error("Set ODOO_PASSWORD or ODOO_API_KEY for Odoo JSON-RPC access.");
    }
  }

  async jsonRpc(service, method, args) {
    let lastError;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const response = await fetch(`${this.baseUrl}/jsonrpc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "call",
            params: { service, method, args },
            id: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Odoo JSON-RPC HTTP error: ${response.status}`);
        }

        const payload = await response.json();

        if (payload.error) {
          throw new Error(payload.error.data?.message || payload.error.message || "Odoo JSON-RPC error");
        }

        return payload.result;
      } catch (error) {
        lastError = error;

        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        }
      }
    }

    throw lastError;
  }

  async authenticate() {
    if (this.uid) {
      return this.uid;
    }

    this.uid = await this.jsonRpc("common", "authenticate", [
      this.database,
      this.login,
      this.passwordOrKey,
      {},
    ]);

    if (!this.uid) {
      throw new Error("Odoo authentication failed.");
    }

    return this.uid;
  }

  async executeKw(model, method, args = [], kwargs = {}) {
    const uid = await this.authenticate();

    return this.jsonRpc("object", "execute_kw", [
      this.database,
      uid,
      this.passwordOrKey,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  async countProductTemplates() {
    return this.executeKw("product.template", "search_count", [[]]);
  }

  async getProductTemplates(limit = 200, offset = 0, order = "id asc") {
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
      limit: 2000,
      order: "complete_name asc",
    });
  }
}

function imageFromBase64(product) {
  const image = product.image_1024;

  if (!image || typeof image !== "string") {
    return [];
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return [image];
  }

  return [`data:image/webp;base64,${image}`];
}

function normalizeProduct(product, categoryName) {
  const sku = typeof product.default_code === "string" && product.default_code
    ? product.default_code
    : `ODOO-${product.id}`;
  const brandName = inferBrandName(product.name, product.default_code);
  const description = cleanText(product.description_sale) || cleanText(product.description);

  return {
    odoo_id: String(product.id),
    sku,
    name: product.name,
    slug: `${slugify(product.name)}-${product.id}`,
    description,
    category_odoo_id: product.categ_id ? String(product.categ_id[0]) : undefined,
    category_name: categoryName || "General",
    category_slug: slugify(categoryName || "General"),
    brand_name: brandName,
    brand_slug: slugify(brandName),
    price_cents: Math.round(Number(product.list_price || 0) * 100),
    stock_quantity: Math.max(0, Math.round(Number(product.qty_available || product.virtual_available || 0))),
    is_active: product.active !== false && product.sale_ok !== false,
    image_urls: imageFromBase64(product),
    video_urls: [],
    specifications: {
      odoo_write_date: product.write_date || "",
      odoo_category: categoryName || "General",
      variant_count: product.product_variant_ids?.length || 0,
      sync_status: imageFromBase64(product).length > 0 ? "published" : "draft_missing_image",
      has_image: imageFromBase64(product).length > 0,
    },
  };
}

async function ensureSchema(client) {
  const schemaPath = path.join(ROOT, "postgres", "local-schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  await client.query(sql);
}

async function upsertBrand(client, brand) {
  const result = await client.query(
    `insert into brands (name, slug)
     values ($1, $2)
     on conflict (slug) do update set
       name = excluded.name,
       updated_at = now()
     returning id`,
    [brand.name, brand.slug],
  );

  return result.rows[0].id;
}

async function upsertCategory(client, category) {
  const result = await client.query(
    `insert into categories (odoo_id, name, slug, is_active)
     values ($1, $2, $3, true)
     on conflict (odoo_id) do update set
       name = excluded.name,
       slug = excluded.slug,
       is_active = true,
       updated_at = now()
     returning id`,
    [category.odoo_id, category.name, category.slug],
  );

  return result.rows[0].id;
}

async function upsertProduct(client, product, brandId, categoryId) {
  const result = await client.query(
    `insert into products (
       odoo_id,
       sku,
       name,
       slug,
       description,
       category_id,
       brand_id,
       price_cents,
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
       $11::jsonb,
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
      product.is_active && product.image_urls.length > 0,
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

async function seedFromManifest(client) {
  const manifestPath = path.join(ROOT, "public", "azure-images", "manifest.jsonl");
  const filesByBasename = new Map(
    walkFiles(path.join(ROOT, "public", "azure-images")).map((absolutePath) => [path.basename(absolutePath), absolutePath]),
  );

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const latestByProductId = new Map();

  for (const line of fs.readFileSync(manifestPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    let item;

    try {
      item = JSON.parse(line);
    } catch {
      continue;
    }

    if (item.status !== "generated" || !item.product_id) {
      continue;
    }

    const current = latestByProductId.get(item.product_id);

    if (!current || Number(item.updated_at || 0) > Number(current.updated_at || 0)) {
      latestByProductId.set(item.product_id, item);
    }
  }

  const categoryId = await upsertCategory(client, {
    odoo_id: "local-generated",
    name: "Catalogo local",
    slug: "catalogo-local",
  });

  let index = 0;

  for (const item of latestByProductId.values()) {
    index += 1;
    const sku = item.sku || `LOCAL-${index}`;
    const name = item.name || `Producto ${sku}`;
    const brandName = inferBrandName(name, sku);
    const brandId = await upsertBrand(client, { name: brandName, slug: slugify(brandName) });
    const absoluteImagePath = resolveManifestImagePath(item, filesByBasename);

    if (!absoluteImagePath) {
      continue;
    }

    const imageUrl = toPublicImageUrl(absoluteImagePath);

    if (!imageUrl) {
      continue;
    }
    const product = {
      odoo_id: `manifest-${item.product_id}`,
      sku,
      name,
      slug: `${slugify(name)}-${slugify(sku)}-${slugify(item.product_id).slice(0, 8)}`,
      description: `Imagen generada localmente para ${name}.`,
      price_cents: 10_000,
      stock_quantity: 10,
      is_active: true,
      specifications: {
        source: "manifest",
        manifest_product_id: item.product_id,
        sync_status: "published",
        has_image: true,
      },
      image_urls: [imageUrl],
      video_urls: [],
    };
    const productId = await upsertProduct(client, product, brandId, categoryId);
    await syncProductMedia(client, productId, product);

    if (index % 100 === 0) {
      console.log(`Seeded ${index} products from manifest...`);
    }
  }

  console.log(`Manifest seed complete. Seeded ${index} products.`);
}

async function main() {
  const { source } = parseArgs();
  loadEnvFile(path.join(ROOT, ".env"));
  loadEnvFile(path.join(ROOT, ".env.local"));

  const connectionString = process.env.LOCAL_DATABASE_URL || "postgresql://iros:irospass@127.0.0.1:5434/iroselectronics";
  const client = new pg.Client({ connectionString });
  const odoo = source === "odoo" ? new OdooClient() : undefined;

  await client.connect();

  try {
    console.log("Applying local PostgreSQL schema...");
    await ensureSchema(client);

    if (source === "manifest") {
      console.log("Seeding local PostgreSQL from generated image manifest...");
      await seedFromManifest(client);
      return;
    }

    console.log("Fetching Odoo categories...");
    const odooCategories = await odoo.getCategories();
    const categoryById = new Map(odooCategories.map((item) => [String(item.id), item]));

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
      if (!category.parent_id) {
        continue;
      }

      const categoryId = categoryIdByOdooId.get(String(category.id));
      const parentId = categoryIdByOdooId.get(String(category.parent_id[0]));

      if (categoryId && parentId) {
        await client.query(
          "update categories set parent_id = $1::uuid, updated_at = now() where id = $2::uuid",
          [parentId, categoryId],
        );
      }
    }

    console.log("Fetching Odoo products...");
    const total = await odoo.countProductTemplates();
    const batchSize = 10;
    let syncedProducts = 0;

    for (let offset = 0; offset < total; offset += batchSize) {
      const products = await odoo.getProductTemplates(batchSize, offset, "id asc");

      for (const product of products) {
        const categoryId = product.categ_id ? String(product.categ_id[0]) : undefined;
        const categoryName = categoryId ? (categoryById.get(categoryId)?.name || "General") : "General";
        const normalized = normalizeProduct(product, categoryName);
        const brandId = await upsertBrand(client, { name: normalized.brand_name, slug: normalized.brand_slug });
        const mappedCategoryId = normalized.category_odoo_id
          ? categoryIdByOdooId.get(normalized.category_odoo_id) || null
          : null;
        const localProductId = await upsertProduct(client, normalized, brandId, mappedCategoryId);
        await syncProductMedia(client, localProductId, normalized);
        syncedProducts += 1;
      }

      console.log(`Synced ${Math.min(offset + batchSize, total)}/${total} products...`);
    }

    console.log(`Local PostgreSQL setup complete. Synced ${syncedProducts} products.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
