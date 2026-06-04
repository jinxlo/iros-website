import type { Locale } from "@/lib/content";

export type CategoryIconName =
  | "tv"
  | "kitchen"
  | "laundry"
  | "computer"
  | "climate"
  | "audio"
  | "refrigeration"
  | "small-appliance"
  | "smart-home"
  | "gaming"
  | "parts"
  | "deals";

export type StoreCategory = {
  slug: string;
  icon: CategoryIconName;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  subcategories: Array<{
    slug: string;
    name: Record<Locale, string>;
  }>;
};

export const storeCategories: StoreCategory[] = [
  {
    slug: "televisores-video",
    icon: "tv",
    name: { es: "Televisores y video", en: "TVs & video" },
    description: {
      es: "Pantallas, proyectores y accesorios de entretenimiento.",
      en: "Displays, projectors, and entertainment accessories.",
    },
    subcategories: [
      { slug: "smart-tv", name: { es: "Smart TVs", en: "Smart TVs" } },
      { slug: "oled-qled", name: { es: "OLED / QLED", en: "OLED / QLED" } },
      { slug: "proyectores", name: { es: "Proyectores", en: "Projectors" } },
      { slug: "streaming", name: { es: "Streaming devices", en: "Streaming devices" } },
      { slug: "soportes-tv", name: { es: "Soportes y monturas", en: "Mounts & stands" } },
      { slug: "cables-video", name: { es: "Cables HDMI y video", en: "HDMI & video cables" } },
    ],
  },
  {
    slug: "cocina",
    icon: "kitchen",
    name: { es: "Cocina", en: "Kitchen" },
    description: {
      es: "Equipos grandes y soluciones para una cocina moderna.",
      en: "Major appliances and solutions for a modern kitchen.",
    },
    subcategories: [
      { slug: "estufas", name: { es: "Estufas", en: "Ranges" } },
      { slug: "hornos", name: { es: "Hornos", en: "Ovens" } },
      { slug: "microondas", name: { es: "Microondas", en: "Microwaves" } },
      { slug: "lavaplatos", name: { es: "Lavaplatos", en: "Dishwashers" } },
      { slug: "campanas", name: { es: "Campanas extractoras", en: "Range hoods" } },
      { slug: "cooktops", name: { es: "Cooktops", en: "Cooktops" } },
    ],
  },
  {
    slug: "refrigeracion",
    icon: "refrigeration",
    name: { es: "Refrigeración", en: "Refrigeration" },
    description: {
      es: "Neveras, freezers y almacenamiento frío.",
      en: "Refrigerators, freezers, and cold storage.",
    },
    subcategories: [
      { slug: "neveras", name: { es: "Neveras", en: "Refrigerators" } },
      { slug: "french-door", name: { es: "French door", en: "French door" } },
      { slug: "side-by-side", name: { es: "Side-by-side", en: "Side-by-side" } },
      { slug: "freezers", name: { es: "Freezers", en: "Freezers" } },
      { slug: "cavas-vino", name: { es: "Cavas de vino", en: "Wine coolers" } },
      { slug: "maquinas-hielo", name: { es: "Máquinas de hielo", en: "Ice makers" } },
    ],
  },
  {
    slug: "lavado",
    icon: "laundry",
    name: { es: "Lavado", en: "Laundry" },
    description: {
      es: "Lavadoras, secadoras y cuidado de ropa.",
      en: "Washers, dryers, and fabric care.",
    },
    subcategories: [
      { slug: "lavadoras", name: { es: "Lavadoras", en: "Washers" } },
      { slug: "secadoras", name: { es: "Secadoras", en: "Dryers" } },
      { slug: "combo-lavadora-secadora", name: { es: "Combos", en: "Washer dryer combos" } },
      { slug: "pedestales", name: { es: "Pedestales", en: "Pedestals" } },
      { slug: "planchado", name: { es: "Planchado", en: "Ironing" } },
      { slug: "accesorios-lavado", name: { es: "Accesorios", en: "Laundry accessories" } },
    ],
  },
  {
    slug: "pequenos-electrodomesticos",
    icon: "small-appliance",
    name: { es: "Pequeños electrodomésticos", en: "Small appliances" },
    description: {
      es: "Equipos compactos para cocina y hogar.",
      en: "Compact equipment for kitchen and home.",
    },
    subcategories: [
      { slug: "air-fryers", name: { es: "Air fryers", en: "Air fryers" } },
      { slug: "licuadoras", name: { es: "Licuadoras", en: "Blenders" } },
      { slug: "cafeteras", name: { es: "Cafeteras", en: "Coffee makers" } },
      { slug: "procesadores", name: { es: "Procesadores", en: "Food processors" } },
      { slug: "tostadoras", name: { es: "Tostadoras", en: "Toasters" } },
      { slug: "batidoras", name: { es: "Batidoras", en: "Mixers" } },
      { slug: "aspiradoras", name: { es: "Aspiradoras", en: "Vacuums" } },
      { slug: "planchas-grills", name: { es: "Planchas y grills", en: "Griddles & grills" } },
      { slug: "dispensadores-agua", name: { es: "Dispensadores de agua", en: "Water dispensers" } },
      { slug: "ollas-multifuncion", name: { es: "Ollas multifunción", en: "Multicookers" } },
      { slug: "cuidado-personal", name: { es: "Cuidado personal", en: "Personal care" } },
    ],
  },
  {
    slug: "climatizacion",
    icon: "climate",
    name: { es: "Climatización", en: "Climate" },
    description: {
      es: "Aires, purificadores, ventiladores y calefacción.",
      en: "AC, purifiers, fans, and heating.",
    },
    subcategories: [
      { slug: "aires-acondicionados", name: { es: "Aires acondicionados", en: "Air conditioners" } },
      { slug: "purificadores", name: { es: "Purificadores", en: "Air purifiers" } },
      { slug: "ventiladores", name: { es: "Ventiladores", en: "Fans" } },
      { slug: "calefactores", name: { es: "Calefactores", en: "Heaters" } },
      { slug: "deshumidificadores", name: { es: "Deshumidificadores", en: "Dehumidifiers" } },
      { slug: "termostatos", name: { es: "Termostatos", en: "Thermostats" } },
    ],
  },
  {
    slug: "computadoras-tablets",
    icon: "computer",
    name: { es: "Computadoras y tablets", en: "Computers & tablets" },
    description: {
      es: "Laptops, desktops, tablets y periféricos.",
      en: "Laptops, desktops, tablets, and peripherals.",
    },
    subcategories: [
      { slug: "laptops", name: { es: "Laptops", en: "Laptops" } },
      { slug: "desktops", name: { es: "Desktops", en: "Desktops" } },
      { slug: "tablets", name: { es: "Tablets", en: "Tablets" } },
      { slug: "monitores", name: { es: "Monitores", en: "Monitors" } },
      { slug: "impresoras", name: { es: "Impresoras", en: "Printers" } },
      { slug: "perifericos", name: { es: "Periféricos", en: "Peripherals" } },
    ],
  },
  {
    slug: "audio",
    icon: "audio",
    name: { es: "Audio", en: "Audio" },
    description: {
      es: "Sonido para entretenimiento, trabajo y hogar.",
      en: "Sound for entertainment, work, and home.",
    },
    subcategories: [
      { slug: "barras-sonido", name: { es: "Barras de sonido", en: "Soundbars" } },
      { slug: "bocinas", name: { es: "Bocinas", en: "Speakers" } },
      { slug: "audifonos", name: { es: "Audífonos", en: "Headphones" } },
      { slug: "home-theater", name: { es: "Home theater", en: "Home theater" } },
      { slug: "microfonos", name: { es: "Micrófonos", en: "Microphones" } },
      { slug: "audio-profesional", name: { es: "Audio profesional", en: "Professional audio" } },
    ],
  },
  {
    slug: "smart-home",
    icon: "smart-home",
    name: { es: "Smart home", en: "Smart home" },
    description: {
      es: "Seguridad, automatización e iluminación inteligente.",
      en: "Security, automation, and smart lighting.",
    },
    subcategories: [
      { slug: "camaras", name: { es: "Cámaras", en: "Cameras" } },
      { slug: "cerraduras", name: { es: "Cerraduras", en: "Smart locks" } },
      { slug: "iluminacion", name: { es: "Iluminación", en: "Lighting" } },
      { slug: "asistentes", name: { es: "Asistentes de voz", en: "Voice assistants" } },
      { slug: "sensores", name: { es: "Sensores", en: "Sensors" } },
      { slug: "routers", name: { es: "Routers y Wi-Fi", en: "Routers & Wi-Fi" } },
      { slug: "cajas-fuertes", name: { es: "Cajas fuertes", en: "Safes" } },
    ],
  },
  {
    slug: "gaming",
    icon: "gaming",
    name: { es: "Gaming", en: "Gaming" },
    description: {
      es: "Consolas, accesorios y setup gamer.",
      en: "Consoles, accessories, and gaming setups.",
    },
    subcategories: [
      { slug: "consolas", name: { es: "Consolas", en: "Consoles" } },
      { slug: "controles", name: { es: "Controles", en: "Controllers" } },
      { slug: "sillas-gamer", name: { es: "Sillas gamer", en: "Gaming chairs" } },
      { slug: "headsets-gamer", name: { es: "Headsets gamer", en: "Gaming headsets" } },
      { slug: "teclados-mouse", name: { es: "Teclados y mouse", en: "Keyboards & mice" } },
      { slug: "streaming-gaming", name: { es: "Streaming", en: "Streaming gear" } },
    ],
  },
  {
    slug: "piezas-accesorios",
    icon: "parts",
    name: { es: "Piezas y accesorios", en: "Parts & accessories" },
    description: {
      es: "Repuestos, filtros, cables y consumibles.",
      en: "Replacement parts, filters, cables, and consumables.",
    },
    subcategories: [
      { slug: "filtros", name: { es: "Filtros", en: "Filters" } },
      { slug: "cables", name: { es: "Cables", en: "Cables" } },
      { slug: "baterias", name: { es: "Baterías", en: "Batteries" } },
      { slug: "controles-remotos", name: { es: "Controles remotos", en: "Remote controls" } },
      { slug: "kits-instalacion", name: { es: "Kits de instalación", en: "Installation kits" } },
      { slug: "garantia-servicio", name: { es: "Garantía y servicio", en: "Warranty & service" } },
    ],
  },
  {
    slug: "ofertas",
    icon: "deals",
    name: { es: "Ofertas", en: "Deals" },
    description: {
      es: "Promociones, bundles y liquidaciones.",
      en: "Promotions, bundles, and clearance.",
    },
    subcategories: [
      { slug: "especiales-semana", name: { es: "Especiales de la semana", en: "Weekly specials" } },
      { slug: "bundles", name: { es: "Bundles", en: "Bundles" } },
      { slug: "open-box", name: { es: "Open box", en: "Open box" } },
      { slug: "liquidacion", name: { es: "Liquidación", en: "Clearance" } },
      { slug: "financiamiento", name: { es: "Financiamiento", en: "Financing" } },
      { slug: "nuevos", name: { es: "Nuevos lanzamientos", en: "New arrivals" } },
    ],
  },
];

export function categoryHref(locale: Locale, slug: string) {
  return `${locale === "es" ? "/productos" : "/en/products"}?category=${slug}`;
}

export function categoryLabel(locale: Locale, slug: string) {
  for (const category of storeCategories) {
    if (category.slug === slug) {
      return category.name[locale];
    }

    const subcategory = category.subcategories.find((item) => item.slug === slug);

    if (subcategory) {
      return subcategory.name[locale];
    }
  }

  return slug;
}
