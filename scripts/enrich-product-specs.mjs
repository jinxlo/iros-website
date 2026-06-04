#!/usr/bin/env node

import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CONNECTION = "postgresql://iros:irospass@127.0.0.1:5434/iroselectronics";
const execFileAsync = promisify(execFile);
const TRUSTED_HINTS = [
  "manufacturer",
  "manual",
  "support",
  "product",
  "spec",
  "specs",
  "specification",
  "specifications",
  "ficha",
  "tecnica",
  "técnica",
  "caracteristicas",
  "características",
  "manuales",
];
const BLOCKED_HOST_HINTS = [
  "facebook.com",
  "instagram.com",
  "pinterest.",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "x.com",
  "twitter.com",
  "whatsapp.com",
  "duckduckgo.com",
  "bing.com",
  "google.com",
  "yahoo.com",
];
const SPEC_KEY_HINTS = [
  "alto",
  "altura",
  "amperaje",
  "ancho",
  "bluetooth",
  "btu",
  "capacidad",
  "carga",
  "ciclos",
  "color",
  "compatibilidad",
  "conectividad",
  "consumo",
  "corriente",
  "depth",
  "dimension",
  "dimensiones",
  "eficiencia",
  "energy",
  "energia",
  "energía",
  "frecuencia",
  "funcion",
  "funciones",
  "garantia",
  "garantía",
  "height",
  "hdmi",
  "inverter",
  "litros",
  "material",
  "marca",
  "memoria",
  "modelo",
  "model",
  "peso",
  "pulgadas",
  "potencia",
  "producto",
  "programa",
  "profundidad",
  "refrigerante",
  "resolucion",
  "resolución",
  "rpm",
  "sku",
  "tamaño",
  "tipo",
  "type",
  "usb",
  "velocidad",
  "contenido",
  "caja",
  "voltaje",
  "voltage",
  "warranty",
  "watts",
  "weight",
  "wifi",
  "wi-fi",
  "width",
];
const KEY_LABELS = new Map([
  ["brand", "Marca"],
  ["marca", "Marca"],
  ["model", "Modelo"],
  ["modelo", "Modelo"],
  ["sku", "SKU"],
  ["capacity", "Capacidad"],
  ["capacidad", "Capacidad"],
  ["color", "Color"],
  ["dimensions", "Dimensiones"],
  ["dimensiones", "Dimensiones"],
  ["height", "Alto"],
  ["alto", "Alto"],
  ["width", "Ancho"],
  ["ancho", "Ancho"],
  ["depth", "Profundidad"],
  ["profundidad", "Profundidad"],
  ["weight", "Peso"],
  ["peso", "Peso"],
  ["voltage", "Voltaje"],
  ["voltaje", "Voltaje"],
  ["power", "Potencia"],
  ["potencia", "Potencia"],
  ["warranty", "Garantía"],
  ["garantia", "Garantía"],
  ["garantía", "Garantía"],
  ["type", "Tipo"],
  ["tipo", "Tipo"],
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    force: false,
    watch: false,
    limit: 10,
    intervalSeconds: 300,
    searchResults: 25,
    sourcePages: 15,
    timeoutMs: 25_000,
    productId: "",
    sku: "",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const nextValue = () => args[++index] || "";

    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--watch") options.watch = true;
    else if (arg === "--limit") options.limit = Math.max(1, Number(nextValue()) || options.limit);
    else if (arg === "--interval") options.intervalSeconds = Math.max(30, Number(nextValue()) || options.intervalSeconds);
    else if (arg === "--search-results") options.searchResults = Math.max(1, Number(nextValue()) || options.searchResults);
    else if (arg === "--source-pages") options.sourcePages = Math.max(1, Number(nextValue()) || options.sourcePages);
    else if (arg === "--timeout-ms") options.timeoutMs = Math.max(5_000, Number(nextValue()) || options.timeoutMs);
    else if (arg === "--product-id") options.productId = nextValue();
    else if (arg === "--sku") options.sku = nextValue();
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/enrich-product-specs.mjs [options]

Options:
  --limit <n>           Products to enrich per pass. Default: 10
  --watch               Keep running and enrich new products automatically
  --interval <seconds>  Watch polling interval. Default: 300
  --force               Re-enrich products that already have spec_enrichment
  --dry-run             Search and print results without updating PostgreSQL
  --product-id <uuid>   Enrich one product by database id
  --sku <sku>           Enrich one product by SKU
  --search-results <n>  Search results to inspect. Default: 25
  --source-pages <n>    Source pages to visit per product. Default: 15
  --timeout-ms <n>      Page timeout in milliseconds. Default: 25000
`);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...parts] = trimmed.split("=");
    const value = parts.join("=").trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function removeDiacritics(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeToken(value) {
  return removeDiacritics(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function productFingerprint(product) {
  return crypto
    .createHash("sha256")
    .update([product.sku, product.name, product.brand_name, product.category_name].map(normalizeSpace).join("|"))
    .digest("hex")
    .slice(0, 24);
}

function isLikelyBlockedUrl(url) {
  const lower = url.toLowerCase();

  return BLOCKED_HOST_HINTS.some((hint) => lower.includes(hint));
}

function directUrl(url) {
  if (url.startsWith("//")) {
    url = `https:${url}`;
  }

  try {
    const parsed = new URL(url);
    const uddg = parsed.searchParams.get("uddg");

    if (uddg) {
      return decodeURIComponent(uddg);
    }

    const yahooRedirect = parsed.href.match(/\/RU=([^/]+)/);

    if (yahooRedirect?.[1]) {
      return decodeURIComponent(yahooRedirect[1]);
    }
  } catch {
    return url;
  }

  return url;
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, " ");
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function productTerms(product) {
  return [product.sku, product.name, product.brand_name, product.category_name]
    .flatMap((value) => normalizeToken(value).split(" "))
    .filter((term) => term.length >= 3);
}

function modelCandidates(product) {
  const values = [product.name, product.sku].filter(Boolean).join(" ");
  const candidates = new Set();
  const explicitModel = values.match(/\b(?:mod(?:elo)?\.?|model)\s*[:.]?\s*([a-z0-9][a-z0-9._-]{3,})/i);

  if (explicitModel?.[1]) {
    candidates.add(explicitModel[1].replace(/[^a-z0-9._-]/gi, ""));
  }

  for (const match of values.matchAll(/\b[a-z]{1,8}[a-z0-9]*\d[a-z0-9._-]{2,}\b/gi)) {
    const value = match[0].replace(/[^a-z0-9._-]/gi, "");

    if (value.length >= 5) {
      candidates.add(value);
    }
  }

  const sku = normalizeSpace(product.sku).replace(/[^a-z0-9._-]/gi, "");

  if (sku.length >= 5) {
    candidates.add(sku);
  }

  return Array.from(candidates).slice(0, 4);
}

function compactToken(value) {
  return normalizeToken(value).replace(/ /g, "");
}

function sourceMatchesProduct(product, pageData) {
  const text = compactToken(`${pageData.title} ${pageData.text}`);
  const models = modelCandidates(product).map(compactToken).filter((model) => model.length >= 5);

  if (models.length > 0) {
    return models.some((model) => text.includes(model));
  }

  const brand = compactToken(product.brand_name);
  const terms = productTerms(product).filter((term) => term.length >= 4);

  return Boolean(brand && text.includes(brand) && terms.filter((term) => text.includes(compactToken(term))).length >= 3);
}

function searchQueries(product) {
  const pieces = [product.brand_name, product.name, product.sku].filter(Boolean).join(" ");
  const brand = product.brand_name || "";
  const models = modelCandidates(product);
  const modelQueries = models.flatMap((model) => [
    `${brand} ${model} especificaciones`,
    `${brand} ${model} specifications`,
  ]);

  return [
    ...modelQueries,
    `${pieces} especificaciones ficha tecnica`,
    `${pieces} specifications manual`,
  ].map(normalizeSpace).filter((query, index, queries) => queries.indexOf(query) === index).slice(0, 6);
}

function scoreSearchResult(product, result) {
  const text = normalizeToken(`${result.title} ${result.snippet} ${hostOf(result.url)}`);
  const sku = normalizeToken(product.sku).replace(/ /g, "");
  const brand = normalizeToken(product.brand_name);
  let score = 0;

  if (sku && text.replace(/ /g, "").includes(sku)) score += 10;
  if (brand && text.includes(brand)) score += 4;

  for (const hint of TRUSTED_HINTS) {
    if (text.includes(normalizeToken(hint))) score += 2;
  }

  for (const term of productTerms(product).slice(0, 14)) {
    if (text.includes(term)) score += 1;
  }

  const host = hostOf(result.url);

  if (brand && host.includes(brand.replace(/ /g, ""))) score += 6;
  if (/\.(pdf)$/i.test(result.url)) score += 4;
  if (/mercadolibre|amazon|ebay|facebook|instagram|youtube/i.test(host)) score -= 5;

  return score;
}

function cleanSpecKey(key) {
  const cleaned = normalizeSpace(key)
    .replace(/[•*]+/g, "")
    .replace(/[:：]+$/g, "")
    .replace(/^(specifications?|especificaciones|caracter[ií]sticas)\s+/i, "")
    .trim();
  const normalized = normalizeToken(cleaned);

  if (KEY_LABELS.has(normalized)) {
    return KEY_LABELS.get(normalized);
  }

  for (const [keyHint, label] of KEY_LABELS.entries()) {
    if (normalized === keyHint || normalized.endsWith(` ${keyHint}`)) {
      return label;
    }
  }

  return cleaned
    .toLocaleLowerCase("es")
    .replace(/(^|[\s/(-])(\p{L})/gu, (_, prefix, character) => `${prefix}${character.toLocaleUpperCase("es")}`)
    .replace(/\b(sku|hdmi|usb|wifi|wi-fi|btu|rpm)\b/gi, (value) => value.toUpperCase());
}

function cleanSpecValue(value) {
  return normalizeSpace(value)
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/^[\-–—:|]+\s*/, "")
    .trim();
}

function productTypeFromName(product) {
  const text = normalizeToken(`${product.name} ${product.category_name}`);
  const types = [
    [/freidora|air fryer/, "Freidora de aire"],
    [/licuadora|blender/, "Licuadora"],
    [/nevera|refrigerador|refrigeradora/, "Nevera"],
    [/lavadora/, "Lavadora"],
    [/secadora/, "Secadora"],
    [/microondas/, "Microondas"],
    [/horno/, "Horno"],
    [/cocina/, "Cocina"],
    [/aire acondicionado|split/, "Aire acondicionado"],
    [/cafetera|cafe expreso|espresso/, "Cafetera"],
    [/aspiradora/, "Aspiradora"],
    [/televisor|tv|smart tv/, "Televisor"],
  ];

  return types.find(([pattern]) => pattern.test(text))?.[1] || product.category_name || "Producto";
}

function extractKnownFunctions(value) {
  const text = normalizeToken(value);
  const functions = [
    [/freir al aire|freir|air fry/, "Freír al aire"],
    [/asar|roast/, "Asar"],
    [/recalentar|reheat/, "Recalentar"],
    [/deshidratar|dehydrate/, "Deshidratar"],
    [/hornear|bake/, "Hornear"],
    [/rostizar/, "Rostizar"],
    [/licuar|blend/, "Licuar"],
    [/triturar|crush/, "Triturar"],
    [/batir|mix/, "Batir"],
    [/moler|grind/, "Moler"],
  ]
    .filter(([pattern]) => pattern.test(text))
    .map(([, label]) => label);

  return Array.from(new Set(functions));
}

function specialPair(rawKey, rawValue) {
  const key = normalizeToken(rawKey);
  const value = cleanSpecValue(rawValue);
  const functions = extractKnownFunctions(value);

  if (/nombre tipo articulo|item type name|nombre del articulo|nombre del artículo/.test(key)) {
    return functions.length > 0 ? { key: "Funciones", value: functions.join(", ") } : undefined;
  }

  if (/voltaje|voltage/.test(key) && /watt|\bw\b|vatio/i.test(value) && !/\b\d+\s*(?:v|volt)/i.test(value)) {
    return { key: "Potencia", value };
  }

  if (/alto|height/.test(key) && /prof|an\.|ancho|al\.|alto|x/i.test(value)) {
    return { key: "Dimensiones", value };
  }

  return undefined;
}

function isUsefulPair(key, value) {
  const normalizedKey = normalizeToken(key);
  const normalizedValue = normalizeToken(value);

  if (!key || !value) return false;
  if (key.length < 2 || key.length > 80) return false;
  if (value.length < 1 || value.length > 260) return false;
  if (/^(home|inicio|menu|menú|search|buscar|cart|carrito|login|price|precio|subtotal|total|filetype)$/i.test(key)) return false;
  if (/tipo de archivo|manual de usuario|datasheet|ficha de datos|archivo|descargar|download/i.test(key)) return false;
  if (/cookies?|privacy|privacidad|shipping|env[ií]o|wishlist|compare|copyright/i.test(`${key} ${value}`)) return false;
  if (!SPEC_KEY_HINTS.some((hint) => normalizedKey.includes(normalizeToken(hint)))) {
    const hasSpecValue = /\b(kg|cm|mm|w|kw|v|hz|btu|mah|gb|tb|mp|pulg|inch|inches|litros?|rpm|psi|bluetooth|wifi|wi-fi|hdmi|usb)\b/i.test(normalizedValue);

    if (!hasSpecValue) {
      return false;
    }
  }

  return true;
}

function addPair(fields, rawKey, rawValue) {
  const special = specialPair(rawKey, rawValue);
  const key = special?.key || cleanSpecKey(rawKey);
  const value = special?.value || cleanSpecValue(rawValue);

  if (!key || !value || !isUsefulPair(key, value)) {
    return;
  }

  const normalizedKey = normalizeToken(key);

  if (!fields.has(normalizedKey)) {
    fields.set(normalizedKey, { key, value });
  }
}

function addInventoryPair(fields, key, value) {
  const normalizedKey = normalizeToken(key);

  if (!fields.has(normalizedKey) && value) {
    fields.set(normalizedKey, { key, value, source: "inventory" });
  }
}

function seedProductFields(product) {
  const fields = new Map();
  const name = product.name || "";
  const model = modelCandidates(product)[0];
  const capacityMatches = Array.from(name.matchAll(/\b\d+(?:[.,]\d+)?\s*(?:litros?|lts?|l\b|qt|kg|pies|btu)\b/gi)).map((match) => normalizeSpace(match[0]));
  const power = name.match(/\b\d{3,5}\s*w\b/i)?.[0];
  const voltage = name.match(/\b(?:110|120|127|220|240)\s*v\b/i)?.[0];
  const technology = /air\s*crisp/i.test(name)
    ? "Air Crisp"
    : name.match(/tecnolog[ií]a\s+([a-záéíóúñ ]{2,40})/i)?.[1];
  const functions = extractKnownFunctions(name);
  const color = name.match(/\b(negro|gris|blanco|plateado|acero|inox|rojo|azul|crema|beige)\b/i)?.[0];

  addInventoryPair(fields, "Marca", product.brand_name || "Iroselectronics");
  addInventoryPair(fields, "Modelo", model || product.sku);
  addInventoryPair(fields, "Tipo de Producto", productTypeFromName(product));
  addInventoryPair(fields, "Funciones", functions.join(", "));
  addInventoryPair(fields, capacityMatches.some((item) => /btu/i.test(item)) ? "Capacidad de enfriamiento" : "Capacidad", capacityMatches.join(", "));
  addInventoryPair(fields, "Potencia", power ? power.toUpperCase() : "");
  addInventoryPair(fields, "Voltaje", voltage ? voltage.toUpperCase() : "");
  addInventoryPair(fields, "Tecnología", technology || "");
  addInventoryPair(fields, "Color", color || "");

  return fields;
}

function extractPairsFromText(text) {
  const fields = new Map();
  const lines = normalizeSpace(text)
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+:)/g, "$1\n$2")
    .split(/\n|\r| {3,}/)
    .map(normalizeSpace)
    .filter(Boolean);

  for (const line of lines.slice(0, 1600)) {
    const colonMatch = line.match(/^([^:：]{2,80})[:：]\s*(.{1,260})$/);

    if (colonMatch) {
      addPair(fields, colonMatch[1], colonMatch[2]);
      continue;
    }

    const dashMatch = line.match(/^([^–—-]{2,80})\s+[–—-]\s+(.{1,260})$/);

    if (dashMatch) {
      addPair(fields, dashMatch[1], dashMatch[2]);
    }
  }

  return fields;
}

function sourceConfidence(product, fields, pageData) {
  if (!sourceMatchesProduct(product, pageData)) {
    return 0;
  }

  const text = normalizeToken(`${pageData.title} ${pageData.text}`);
  const sku = compactToken(product.sku);
  const brand = normalizeToken(product.brand_name);
  let score = fields.size;

  if (sku && text.replace(/ /g, "").includes(sku)) score += 8;
  if (brand && text.includes(brand)) score += 4;
  if (/manual|specifications?|especificaciones|ficha tecnica|ficha técnica|caracteristicas|características/i.test(pageData.text)) score += 3;

  return Math.min(100, score * 8);
}

async function searchWeb(product, options) {
  const combined = new Map();

  for (const query of searchQueries(product)) {
    try {
      const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: {
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        },
      });
      const html = await response.text();

      for (const match of html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const url = directUrl(decodeHtml(match[1]));

        if (!/^https?:\/\//i.test(url) || isLikelyBlockedUrl(url)) {
          continue;
        }

        const item = {
          title: normalizeSpace(decodeHtml(match[2])),
          url,
          snippet: "",
        };
        const current = combined.get(url);

        if (!current || scoreSearchResult(product, item) > scoreSearchResult(product, current)) {
          combined.set(url, item);
        }
      }
    } catch (error) {
      console.warn(`Static search failed for ${query}: ${error.message}`);
    }

    try {
      const response = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}`, {
        headers: {
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        },
      });
      const html = await response.text();

      for (const match of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const url = directUrl(decodeHtml(match[1]));

        if (!/^https?:\/\//i.test(url) || isLikelyBlockedUrl(url)) {
          continue;
        }

        const item = {
          title: normalizeSpace(decodeHtml(match[2])),
          url,
          snippet: "",
        };

        if (scoreSearchResult(product, item) <= 0) {
          continue;
        }

        const current = combined.get(url);

        if (!current || scoreSearchResult(product, item) > scoreSearchResult(product, current)) {
          combined.set(url, item);
        }
      }
    } catch (error) {
      console.warn(`Yahoo search failed for ${query}: ${error.message}`);
    }

  }

  return Array.from(combined.values())
    .map((result) => ({ ...result, score: scoreSearchResult(product, result) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.searchResults);
}

async function inspectSource(page, product, result, options) {
  try {
    if (/\.pdf(?:$|[?#])/i.test(result.url)) {
      const response = await fetch(result.url, {
        headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36" },
      });

      if (!response.ok) {
        throw new Error(`PDF fetch failed with ${response.status}`);
      }

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "iros-specs-"));
      const pdfPath = path.join(tempDir, "source.pdf");
      const textPath = path.join(tempDir, "source.txt");

      try {
        fs.writeFileSync(pdfPath, Buffer.from(await response.arrayBuffer()));
        await execFileAsync("pdftotext", ["-layout", pdfPath, textPath], { timeout: options.timeoutMs });
        const text = fs.existsSync(textPath) ? fs.readFileSync(textPath, "utf8") : "";
        const fields = extractPairsFromText(text);
        const pageData = { title: result.title, text };

        if (!sourceMatchesProduct(product, pageData)) {
          return undefined;
        }

        return {
          url: result.url,
          title: normalizeSpace(result.title),
          confidence: sourceConfidence(product, fields, pageData),
          fields,
        };
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }

    await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: options.timeoutMs });
    await page.waitForTimeout(1000);
    const pageData = await page.evaluate(() => {
      const pairs = [];

      for (const row of Array.from(document.querySelectorAll("table tr")).slice(0, 500)) {
        const cells = Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent || "").filter(Boolean);

        if (cells.length >= 2) {
          pairs.push([cells[0], cells.slice(1).join(" ")]);
        }
      }

      for (const list of Array.from(document.querySelectorAll("dl")).slice(0, 80)) {
        const terms = Array.from(list.querySelectorAll("dt"));
        const values = Array.from(list.querySelectorAll("dd"));

        for (let index = 0; index < Math.min(terms.length, values.length); index += 1) {
          pairs.push([terms[index].textContent || "", values[index].textContent || ""]);
        }
      }

      return {
        title: document.title || "",
        text: document.body?.innerText?.slice(0, 160_000) || "",
        pairs,
      };
    });
    const fields = new Map();

    for (const [key, value] of pageData.pairs) {
      addPair(fields, key, value);
    }

    for (const [key, item] of extractPairsFromText(pageData.text)) {
      if (!fields.has(key)) {
        fields.set(key, item);
      }
    }

    if (!sourceMatchesProduct(product, pageData)) {
      return undefined;
    }

    return {
      url: result.url,
      title: normalizeSpace(pageData.title || result.title),
      confidence: sourceConfidence(product, fields, pageData),
      fields,
    };
  } catch (error) {
    console.warn(`Source failed for ${result.url}: ${error.message}`);
    return undefined;
  }
}

function mergeSources(sources) {
  const merged = new Map();

  for (const source of sources.sort((a, b) => b.confidence - a.confidence)) {
    for (const [normalizedKey, pair] of source.fields) {
      if (!merged.has(normalizedKey)) {
        merged.set(normalizedKey, { ...pair, source: source.url });
      }
    }
  }

  return merged;
}

function specCategory(label) {
  const normalized = normalizeToken(label);

  if (/funcion|programa|modo|velocidad|tecnolog|air crisp|inverter|control|caracter/i.test(normalized)) {
    return "Funciones y tecnología";
  }

  if (/capacidad|litro|qt|btu|rpm|temperatura|rango|potencia|watt|watts/i.test(normalized)) {
    return "Rendimiento";
  }

  if (/alto|altura|ancho|profundidad|dimension|dimensiones|peso|diametro|tama/i.test(normalized)) {
    return "Dimensiones y peso";
  }

  if (/voltaje|volt|frecuencia|hz|consumo|energia|energ/i.test(normalized)) {
    return "Energía";
  }

  if (/wifi|wi fi|bluetooth|usb|hdmi|conectividad|compatible|app/i.test(normalized)) {
    return "Conectividad";
  }

  if (/contenido|caja|inclu|accesorio|cable|manual|guia|guía/i.test(normalized)) {
    return "Contenido de la caja";
  }

  return "Generales";
}

function specPriority(label) {
  const normalized = normalizeToken(label);
  const priorities = [
    [/^marca$/, 1],
    [/^modelo$/, 2],
    [/^sku$/, 3],
    [/tipo/, 4],
    [/funcion|programa|modo/, 5],
    [/capacidad/, 6],
    [/potencia|watt|watts/, 7],
    [/temperatura|rango/, 8],
    [/tecnolog/, 9],
    [/velocidad|rpm/, 10],
    [/dimension|alto|altura|ancho|profundidad/, 11],
    [/peso/, 12],
    [/color/, 13],
    [/material/, 14],
    [/garantia|garantía|warranty/, 15],
    [/contenido|caja|inclu|accesorio/, 16],
  ];

  return priorities.find(([pattern]) => pattern.test(normalized))?.[1] || 100;
}

function specEntries(fields) {
  const entries = Array.from(fields.values())
    .map((field) => ({
      label: field.key,
      value: field.value,
      source: field.source,
      category: specCategory(field.key),
    }))
    .filter((entry, index, entries) => entries.findIndex((item) => normalizeToken(`${item.label}:${item.value}`) === normalizeToken(`${entry.label}:${entry.value}`)) === index)
    .sort((a, b) => specPriority(a.label) - specPriority(b.label) || a.label.localeCompare(b.label))
    .reduce((items, entry) => {
      const sameValue = items.some((item) => item.category === entry.category && normalizeToken(item.value) === normalizeToken(entry.value));
      const samePower = /potencia/i.test(entry.label) && items.some((item) => /potencia/i.test(item.label) && normalizeToken(item.value).replace(/vatios?/, "w") === normalizeToken(entry.value).replace(/vatios?/, "w"));

      return sameValue || samePower ? items : [...items, entry];
    }, []);

  return entries.slice(0, 36);
}

function groupedSpecs(entries) {
  const order = ["Generales", "Funciones y tecnología", "Rendimiento", "Dimensiones y peso", "Energía", "Conectividad", "Contenido de la caja"];

  return order
    .map((title) => ({
      title,
      specs: entries
        .filter((entry) => entry.category === title)
        .map((entry) => ({ label: entry.label, value: entry.value })),
    }))
    .filter((group) => group.specs.length > 0);
}

function publicSpecs(entries) {
  return entries
    .map((entry) => `${entry.label}: ${entry.value}`)
    .slice(0, 24);
}

function findEntry(entries, patterns) {
  return entries.find((entry) => patterns.some((pattern) => pattern.test(normalizeToken(entry.label))))?.value || "";
}

function joinHighlights(values) {
  const clean = values.filter(Boolean).slice(0, 4);

  if (clean.length <= 1) {
    return clean[0] || "";
  }

  return `${clean.slice(0, -1).join(", ")} y ${clean.at(-1)}`;
}

function buildDescription(product, entries) {
  const brand = product.brand_name || "Iroselectronics";
  const category = product.category_name || "producto";
  const model = findEntry(entries, [/^modelo$/, /^model$/]) || modelCandidates(product)[0] || product.sku;
  const type = findEntry(entries, [/^tipo de producto$/, /^tipo$/]) || productTypeFromName(product) || category;
  const functions = findEntry(entries, [/funcion/, /programa/, /modo/]);
  const capacity = findEntry(entries, [/capacidad/]);
  const power = findEntry(entries, [/potencia/, /watt/]);
  const temperature = findEntry(entries, [/temperatura/, /rango/]);
  const technology = findEntry(entries, [/tecnolog/]);
  const dimensions = findEntry(entries, [/dimension/]);
  const weight = findEntry(entries, [/peso/]);
  const material = findEntry(entries, [/material/]);
  const color = findEntry(entries, [/color/]);
  const box = findEntry(entries, [/contenido/, /caja/, /inclu/]);
  const intro = `${product.name} es un producto tipo ${type} de ${brand}${model ? `, modelo ${model}` : ""}, incorporado al catálogo de Iroselectronics para quienes buscan información clara antes de comprar.`;
  const performance = joinHighlights([
    capacity ? `capacidad de ${capacity}` : "",
    power ? `potencia de ${power}` : "",
    temperature ? `rango de temperatura de ${temperature}` : "",
    technology ? `tecnología ${technology}` : "",
  ]);
  const design = joinHighlights([
    dimensions ? `dimensiones de ${dimensions}` : "",
    weight ? `peso de ${weight}` : "",
    material ? `material ${material}` : "",
    color ? `color ${color}` : "",
  ]);
  const paragraphs = [intro];

  if (functions) {
    paragraphs.push(`Entre sus funciones principales se incluyen ${functions}. Esto permite comparar el equipo con más precisión según el uso esperado en casa, oficina o negocio.`);
  }

  if (performance) {
    paragraphs.push(`En rendimiento, destaca por su ${performance}. Estos datos provienen de las fuentes técnicas encontradas para el modelo y ayudan a validar si se ajusta a tus necesidades.`);
  }

  if (design) {
    paragraphs.push(`En diseño y construcción, el producto presenta ${design}, información útil para confirmar espacio disponible, instalación y compatibilidad.`);
  }

  if (box) {
    paragraphs.push(`Contenido de la caja: ${box}.`);
  }

  paragraphs.push("Recuerda que con Iroselectronics puedes comprar tecnología y electrodomésticos con atención local, inventario actualizado y soporte para escoger el producto correcto.");

  return paragraphs.join("\n\n");
}

async function enrichProduct(browser, product, options) {
  const context = await browser.newContext({
    locale: "es-VE",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  });

  try {
    const results = await searchWeb(product, options);
    const sources = [];

    for (const result of results.slice(0, options.sourcePages)) {
      const page = await context.newPage();
      const source = await inspectSource(page, product, result, options);

      await page.close().catch(() => undefined);

      if (source && source.fields.size > 0) {
        sources.push(source);
      }
    }

    const fields = mergeSources(sources);

    for (const [key, value] of seedProductFields(product)) {
      if (!fields.has(key)) {
        fields.set(key, value);
      }
    }
    const entries = specEntries(fields);
    const groups = groupedSpecs(entries);
    const specs = publicSpecs(entries);
    const status = specs.length > 0 ? "found" : "no_specs";

    return {
      status,
      product_fingerprint: productFingerprint(product),
      searched_at: new Date().toISOString(),
      query: searchQueries(product)[0],
      confidence: sources.length ? Math.max(...sources.map((source) => source.confidence)) : 0,
      fields: Object.fromEntries(Array.from(fields.values()).map((field) => [field.key, field.value])),
      enriched_description: status === "found" ? buildDescription(product, entries) : "",
      spec_groups: groups,
      public_specs: specs,
      sources: sources.slice(0, 5).map((source) => ({
        url: source.url,
        title: source.title,
        confidence: source.confidence,
      })),
    };
  } finally {
    await context.close();
  }
}

async function fetchProducts(client, options) {
  const params = [];
  let whereSql = "where p.is_active = true";

  if (options.productId) {
    params.push(options.productId);
    whereSql += ` and p.id = $${params.length}::uuid`;
  }

  if (options.sku) {
    params.push(options.sku);
    whereSql += ` and p.sku = $${params.length}`;
  }

  if (!options.force && !options.productId && !options.sku) {
    whereSql += " and coalesce(p.specifications #>> '{spec_enrichment,status}', '') <> 'found'";
  }

  params.push(options.limit);

  const result = await client.query(
    `select
       p.id,
       p.sku,
       p.name,
       p.slug,
       p.description,
       p.specifications,
       b.name as brand_name,
       c.name as category_name
     from products p
     left join brands b on b.id = p.brand_id
     left join categories c on c.id = p.category_id
     ${whereSql}
     order by p.updated_at desc
     limit $${params.length}`,
    params,
  );

  return result.rows;
}

async function saveEnrichment(client, product, enrichment, options) {
  const payload = {
    spec_enrichment: enrichment,
    enriched_description: enrichment.enriched_description,
    spec_groups: enrichment.spec_groups,
    public_specs: enrichment.public_specs,
  };

  if (options.dryRun) {
    console.log(JSON.stringify({ product: product.sku, payload }, null, 2));
    return;
  }

  await client.query(
    `update products
     set specifications = coalesce(specifications, '{}'::jsonb) || $2::jsonb
     where id = $1::uuid
       and ($3 = 'found' or coalesce(specifications #>> '{spec_enrichment,status}', '') <> 'found')`,
    [product.id, JSON.stringify(payload), enrichment.status],
  );
}

async function runOnce(client, browser, options) {
  const products = await fetchProducts(client, options);

  if (products.length === 0) {
    console.log("No products need specification enrichment.");
    return 0;
  }

  let enriched = 0;

  for (const product of products) {
    console.log(`Searching specs for ${product.sku} - ${product.name}`);
    let enrichment = await enrichProduct(browser, product, options);

    if (enrichment.status !== "found") {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      enrichment = await enrichProduct(browser, product, { ...options, searchResults: Math.max(options.searchResults, 30), sourcePages: Math.max(options.sourcePages, 18) });
    }

    await saveEnrichment(client, product, enrichment, options);
    enriched += enrichment.status === "found" ? 1 : 0;
    console.log(`${product.sku}: ${enrichment.status} (${enrichment.public_specs.length} specs, confidence ${enrichment.confidence})`);
  }

  return enriched;
}

async function main() {
  const options = parseArgs();
  loadEnvFile(path.join(ROOT, ".env"));
  loadEnvFile(path.join(ROOT, ".env.local"));

  const client = new pg.Client({
    connectionString: process.env.LOCAL_DATABASE_URL || process.env.POSTGRES_URL || DEFAULT_CONNECTION,
  });

  await client.connect();

  const browser = await chromium.launch({ headless: true });

  try {
    do {
      await runOnce(client, browser, options);

      if (options.watch) {
        console.log(`Waiting ${options.intervalSeconds}s for newly added products...`);
        await new Promise((resolve) => setTimeout(resolve, options.intervalSeconds * 1000));
      }
    } while (options.watch);
  } finally {
    await browser.close();
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
