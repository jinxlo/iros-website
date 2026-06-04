import type { OdooProductTemplate } from "@/lib/odoo/client";
import { OdooClient } from "@/lib/odoo/client";

export type AnalyzedOdooProduct = {
  index: number;
  odoo_id: number;
  sku: string;
  name: string;
  brand: string;
  odoo_category: string;
  category: string;
  subcategory: string;
  has_image: boolean;
  image_count: number;
  confidence: "high" | "manual-review";
  matched: string;
};

const brandNames = [
  "Black+Decker", "Black & Decker", "Hamilton Beach", "General Electric", "Omega Electronics",
  "KitchenAid", "Westinghouse", "Westing House", "Swiss Home", "Termotronic", "Thermotronic",
  "Frigidaire", "Electrolux", "Tecnolam", "Cuisinart", "Panasonic", "Whirlpool", "Samsung",
  "Breville", "DeLonghi", "Delonghi", "Honeywell", "Brentwood", "Nostalgia", "Calphalon",
  "Gtronic", "Gtronics", "Newkool", "Clear Water", "Dyson", "Drija", "Mabe", "Shark",
  "Teka", "Ninja", "Oster", "Sony", "Aiwa", "Daewoo", "DaeWo", "Hisense", "Bosch", "RCA",
  "TCL", "Mystic", "Bose", "Sonos", "Yamaha", "JBL", "Cata", "Falmec", "Brema", "Conair",
  "Exceline", "GlossBoss", "Royal", "Frigilux", "Igloo", "Viotto", "Corona", "Vertux",
  "iRobot", "Elitec", "Bissell", "Stihl", "Intex", "Amalfi", "Bolonia", "Lucca", "Murano",
  "Toledo", "Italia", "LG", "GE",
];

const skuBrandRules: Array<[RegExp, string]> = [
  [/^(KSM|KFC|KCM|KEK|KSB|KCGC|KSGG|KUBR|KSMP|KP25|KCF|KES|BCG)/i, "KitchenAid"],
  [/^(WRFF|WUI|WK|WET|WOEC|WCE|WCI|WED|WHT|WAD|7MW|8MW|LAWTW|IWCE|SWA)/i, "Whirlpool"],
  [/^(AR|RF|QN|UN|UA|VS80|DW80|WH22|ME21|NX|WD11|DV|WW)/i, "Samsung"],
  [/^(VR|VS25|MAY|A3UQ|LCF|S40|S70|OLED|QNED|WD20)/i, "LG"],
  [/^(BL|BN|TB|CFN|CE250|DZ|SF|CI|NJ|GR101|ES601|NC|FS301|KSSS)/i, "Ninja"],
  [/^(PVW|XPIO|GUD|CHM|JAS|JD|PDT|C7CE|CA69|CA67)/i, "GE"],
  [/^(HD|UV|BU|CH901|SD201)/i, "Shark"],
  [/^(DA)/i, "Daewoo"],
  [/^(BVST|TSST|OST|FPST)/i, "Oster"],
  [/^(TEKA|EW)/i, "Teka"],
  [/^(TOSCANA|SICILIA|ACQUA|SYRAH|MALBEC|MILAN|NAPOLI|PACIFIC|INVISIBLE|PRISMATOUCH|TOUCH|BERL|BERE|MURANO|ROMA)/i, "Drija"],
  [/^(0220\.|0210\.)/i, "Tecnolam"],
  [/^(F2401|BS0115|SH)/i, "Swiss Home"],
  [/^(MYASR)/i, "Mystic"],
  [/^(TCAA)/i, "TCL"],
  [/^(CE-)/i, "Termotronic"],
  [/^(WKSMX)/i, "Westinghouse"],
  [/^(MCL|INGENIOUS)/i, "Mabe"],
  [/^(BES|BGR)/i, "Breville"],
  [/^(EC260)/i, "DeLonghi"],
  [/^(CB416)/i, "Brema"],
];

const placementRules: Array<[string, string, string[]]> = [
  ["lavado", "combo-lavadora-secadora", ["morocha", "morogha", "lavaseca", "lava seca", "combo pareja", "torre de lavado", "lavado secado", "centro de lavado", "unitized", "spacemaker"]],
  ["lavado", "lavadoras", ["lavadora", "washer", "washing machine", "carga superior", "carga frontal xpert"]],
  ["lavado", "secadoras", ["secadora", "dryer"]],
  ["televisores-video", "oled-qled", ["oled", "qled", "qned", "neo qled"]],
  ["televisores-video", "smart-tv", [" tv ", "smart tv", "televisor", "uhd", " 4k ", "crystal led", "led hd smart"]],
  ["televisores-video", "proyectores", ["projector", "proyector"]],
  ["televisores-video", "streaming", ["roku", "fire tv", "chromecast", "streaming"]],
  ["televisores-video", "soportes-tv", ["mount", "soporte", "bracket", "wall mount", "base para tv"]],
  ["televisores-video", "cables-video", ["hdmi", "video cable", "cable hdmi"]],
  ["refrigeracion", "cavas-vino", ["vinera", "wine cooler", "cava", "centro de bebidas", "bere", "syrah", "malbec"]],
  ["refrigeracion", "maquinas-hielo", ["fabricador de hielo", "ice maker", "maquina de hielo"]],
  ["refrigeracion", "freezers", ["congelador", "freezer"]],
  ["refrigeracion", "french-door", ["french door"]],
  ["refrigeracion", "side-by-side", ["side by side", "side-by-side", "side by siede"]],
  ["refrigeracion", "neveras", ["nevera", "refrigerator", "refrigerador", "fridge", "enfriador de bebidas"]],
  ["cocina", "lavaplatos", ["lavaplatos", "lavavajillas", "dishwasher"]],
  ["cocina", "microondas", ["microondas", "microwave"]],
  ["cocina", "campanas", ["campana", "camana", "range hood", "hood", "extractora", "down draft", "downdraft", "ventilacion retractil"]],
  ["cocina", "cooktops", ["tope", "cooktop", "anafe", "induccion", "vitroceramica", "hornillas", "quemadores a gas"]],
  ["cocina", "estufas", ["cocina a gas", "cocina ge", "cocina mabe", "cocina samsung", "range", "estufa", "stove"]],
  ["cocina", "hornos", ["horno", "oven", "estacion de desayuno"]],
  ["pequenos-electrodomesticos", "batidoras", ["batidora", "mixer"]],
  ["pequenos-electrodomesticos", "licuadoras", ["licuadora", "blender"]],
  ["pequenos-electrodomesticos", "cafeteras", ["cafetera", "coffee", "espresso", "expresso", "cafe expresso", "percolador", "pastillas para cafetera"]],
  ["pequenos-electrodomesticos", "procesadores", ["procesador de alimentos", "mini procesador", "food processor"]],
  ["pequenos-electrodomesticos", "air-fryers", ["air fryer", "freidora de aire", "freidora"]],
  ["pequenos-electrodomesticos", "tostadoras", ["tostadora", "toaster"]],
  ["pequenos-electrodomesticos", "planchas-grills", ["parrillera", "panini", "grill", "plancha", "plancha secador"]],
  ["pequenos-electrodomesticos", "dispensadores-agua", ["dispensador de agua"]],
  ["pequenos-electrodomesticos", "ollas-multifuncion", ["olla multifuncion", "multicooker", "foodi"]],
  ["pequenos-electrodomesticos", "aspiradoras", ["aspiradora", "vacuum", "roomba", "pulidora", "glossboss", "hidrolavado", "hidrolavadora"]],
  ["pequenos-electrodomesticos", "cuidado-personal", ["secador de cabello", "multiestilizador", "airwrap", "airstrait", "flexstyle", "cepillo secador"]],
  ["climatizacion", "aires-acondicionados", ["aire split", "aire acondicionado", "aire de ventana", "aire portatil", "aire industrial", "air conditioner", "mini split", " btu ", "condensador"]],
  ["climatizacion", "deshumidificadores", ["deshumidificador", "deshumificador"]],
  ["climatizacion", "purificadores", ["purificador de aire"]],
  ["climatizacion", "ventiladores", ["ventilador", "enfriador de aire"]],
  ["climatizacion", "calefactores", ["calentador de agua", "calentador", "heater"]],
  ["audio", "barras-sonido", ["barra de sonido", "soundbar"]],
  ["audio", "audifonos", ["audifonos", "headphones", "earbuds"]],
  ["audio", "microfonos", ["microfono", "microfonos", "wireless mic"]],
  ["audio", "bocinas", ["corneta", "speaker", "bocina", "parlante", "xboom", "s1 pro"]],
  ["audio", "audio-profesional", ["teclado yamaha", "piano yamaha", "61 teclas", "37 teclas"]],
  ["smart-home", "cajas-fuertes", ["caja fuerte", "safe box"]],
  ["smart-home", "routers", ["router", "wifi", "wi fi"]],
  ["gaming", "consolas", ["console", "ps5", "playstation", "xbox", "nintendo switch"]],
  ["piezas-accesorios", "cables", ["cable", "cord", "adaptador"]],
  ["piezas-accesorios", "filtros", ["filtro", "filter", "osmosis inversa", "purificador de agua"]],
  ["piezas-accesorios", "baterias", ["bateria", "battery"]],
];

function normalizedText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_/]+/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBrand(brand: string) {
  if (/daewo/i.test(brand)) {
    return "Daewoo";
  }

  if (/delonghi/i.test(brand)) {
    return "DeLonghi";
  }

  if (/gtronics/i.test(brand)) {
    return "Gtronic";
  }

  if (/thermotronic/i.test(brand)) {
    return "Termotronic";
  }

  if (/whirpool/i.test(brand)) {
    return "Whirlpool";
  }

  if (/westing house/i.test(brand)) {
    return "Westinghouse";
  }

  if (/black & decker/i.test(brand)) {
    return "Black+Decker";
  }

  return brand;
}

function inferBrand(product: OdooProductTemplate) {
  const name = ` ${product.name || ""} `;

  for (const brand of brandNames) {
    const pattern = brand.length <= 2
      ? new RegExp(`(^|[^a-z0-9])${escapeRegExp(brand)}([^a-z0-9]|$)`, "i")
      : new RegExp(escapeRegExp(brand), "i");

    if (pattern.test(name)) {
      return normalizeBrand(brand);
    }
  }

  const sku = typeof product.default_code === "string" ? product.default_code : "";
  const skuRule = skuBrandRules.find(([pattern]) => pattern.test(sku));

  return skuRule?.[1] || "Unidentified";
}

function inferPlacement(product: OdooProductTemplate) {
  const text = normalizedText(
    `${product.name || ""} ${product.default_code || ""} ${product.description_sale || ""} ${product.description || ""}`,
  );

  for (const [category, subcategory, keywords] of placementRules) {
    const matched = keywords.find((keyword) => text.includes(normalizedText(keyword)));

    if (matched) {
      return { category, subcategory, confidence: "high" as const, matched };
    }
  }

  return {
    category: "ofertas",
    subcategory: "nuevos",
    confidence: "manual-review" as const,
    matched: "none",
  };
}

export function analyzeOdooProducts(products: OdooProductTemplate[]) {
  const analyzedProducts: AnalyzedOdooProduct[] = products.map((product, index) => {
    const placement = inferPlacement(product);

    return {
      index: index + 1,
      odoo_id: product.id,
      sku: typeof product.default_code === "string" && product.default_code
        ? product.default_code
        : `ODOO-${product.id}`,
      name: product.name,
      brand: inferBrand(product),
      odoo_category: product.categ_id ? product.categ_id[1] : "General",
      has_image: Boolean(product.image_1920 || product.image_1024),
      image_count: product.image_1920 || product.image_1024 ? 1 : 0,
      ...placement,
    };
  });
  const brandCounts = Array.from(
    analyzedProducts.reduce((counts, product) => {
      counts.set(product.brand, (counts.get(product.brand) || 0) + 1);
      return counts;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({ brand, count }));
  const placementCounts = Array.from(
    analyzedProducts.reduce((counts, product) => {
      const placement = `${product.category}/${product.subcategory}`;
      counts.set(placement, (counts.get(placement) || 0) + 1);
      return counts;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([placement, count]) => ({ placement, count }));
  const manualReview = analyzedProducts.filter(
    (product) => product.confidence === "manual-review" || product.brand === "Unidentified",
  );

  return {
    total: analyzedProducts.length,
    brands: brandCounts,
    placements: placementCounts,
    manualReview,
    products: analyzedProducts,
  };
}

export async function analyzeOdooCatalog(limit: number | "all" = 100) {
  const odoo = OdooClient.fromEnv();
  const products = limit === "all"
    ? await odoo.getAllProductTemplates()
    : await odoo.getProductTemplates(limit);

  return analyzeOdooProducts(products);
}
