import type { Locale } from "@/lib/content";

export type LocalizedText = Record<Locale, string>;

export type ServiceTile = {
  id: string;
  icon: "truck" | "shield" | "support" | "install";
  title: LocalizedText;
  description: LocalizedText;
};

export type CollectionTile = {
  id: string;
  icon: "blend" | "clean" | "cook" | "cool" | "laundry";
  title: LocalizedText;
  subtitle: LocalizedText;
  cta: LocalizedText;
  tone: string;
  imageUrl: string;
  categorySlug: string;
};

export type ShowcasePanel = {
  id: string;
  kicker: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  priceLabel: LocalizedText;
  stat: LocalizedText;
  tone: string;
  imageUrl: string;
};

export type SeasonalBanner = {
  theme: "default" | "valentines" | "mothers" | "holiday";
  kicker: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
  cta: LocalizedText;
  ctaHref: string;
};

export type InstagramVideo = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  url: string;
  imageUrl: string;
};

export type SiteContent = {
  announcement: LocalizedText;
  hero: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
    primaryCta: LocalizedText;
    secondaryCta: LocalizedText;
    productTitle: LocalizedText;
    productMeta: LocalizedText;
    productPrice: LocalizedText;
    imageUrl: string;
  };
  serviceTiles: ServiceTile[];
  collections: CollectionTile[];
  featured: {
    title: LocalizedText;
    subtitle: LocalizedText;
    cta: LocalizedText;
  };
  promo: {
    kicker: LocalizedText;
    title: LocalizedText;
    body: LocalizedText;
    cta: LocalizedText;
  };
  seasonalBanner: SeasonalBanner;
  instagramVideos: InstagramVideo[];
  showcases: ShowcasePanel[];
};

export const defaultSiteContent: SiteContent = {
  announcement: {
    es: "Envíos rápidos, garantía local y asesoría experta en electrodomésticos",
    en: "Fast shipping, local warranty, and expert appliance guidance",
  },
  hero: {
    eyebrow: {
      es: "Electrodomésticos inteligentes para cada rutina",
      en: "Smart appliances for every routine",
    },
    title: {
      es: "Tecnología para cocinar, limpiar y disfrutar mejor en casa.",
      en: "Technology to cook, clean, and enjoy home better.",
    },
    subtitle: {
      es: "Una experiencia premium para descubrir appliances, electrónica y soluciones del hogar con catálogo actualizado y compra confiable.",
      en: "A premium experience to discover appliances, electronics, and home solutions with an updated catalog and trusted shopping.",
    },
    primaryCta: { es: "Comprar ahora", en: "Shop now" },
    secondaryCta: { es: "Ver colecciones", en: "View collections" },
    productTitle: {
      es: "Colección cocina inteligente",
      en: "Smart kitchen collection",
    },
    productMeta: {
      es: "Air fryers, licuadoras, cafeteras y accesorios",
      en: "Air fryers, blenders, coffee makers, and accessories",
    },
    productPrice: { es: "Desde $89", en: "From $89" },
    imageUrl: "",
  },
  serviceTiles: [
    {
      id: "delivery",
      icon: "truck",
      title: { es: "Entrega coordinada", en: "Scheduled delivery" },
      description: {
        es: "Opciones de entrega para equipos grandes y pequeños.",
        en: "Delivery options for large and small appliances.",
      },
    },
    {
      id: "warranty",
      icon: "shield",
      title: { es: "Garantía local", en: "Local warranty" },
      description: {
        es: "Compra con soporte y cobertura clara desde el primer día.",
        en: "Shop with clear support and coverage from day one.",
      },
    },
    {
      id: "support",
      icon: "support",
      title: { es: "Asesoría experta", en: "Expert guidance" },
      description: {
        es: "Te ayudamos a elegir el equipo ideal para tu hogar.",
        en: "We help you choose the right equipment for your home.",
      },
    },
    {
      id: "install",
      icon: "install",
      title: { es: "Listo para instalar", en: "Install ready" },
      description: {
        es: "Secciones preparadas para servicios e instalación futura.",
        en: "Sections prepared for future services and installation.",
      },
    },
  ],
  collections: [
    {
      id: "refrigerators",
      icon: "cool",
      title: { es: "Neveras", en: "Refrigerators" },
      subtitle: {
        es: "Refrigeración moderna para conservar todo fresco.",
        en: "Modern refrigeration to keep everything fresh.",
      },
      cta: { es: "Ver neveras", en: "View refrigerators" },
      tone: "from-[#031c36] via-[#064783] to-[#d8f6ff]",
      imageUrl: "/productos/nevera_portada.jpeg",
      categorySlug: "neveras",
    },
    {
      id: "cooktops",
      icon: "cook",
      title: { es: "Topes y cooktops", en: "Cooktops" },
      subtitle: {
        es: "Superficies de cocción para una cocina equipada.",
        en: "Cooking surfaces for a fully equipped kitchen.",
      },
      cta: { es: "Comprar topes", en: "Shop cooktops" },
      tone: "from-[#064783] via-[#0a9ad3] to-[#d8f6ff]",
      imageUrl: "/productos/tope_portada.jpeg",
      categorySlug: "cooktops",
    },
    {
      id: "blenders",
      icon: "blend",
      title: { es: "Licuadoras", en: "Blenders" },
      subtitle: {
        es: "Potencia compacta para batidos, salsas y recetas.",
        en: "Compact power for smoothies, sauces, and recipes.",
      },
      cta: { es: "Ver licuadoras", en: "View blenders" },
      tone: "from-[#0a9ad3] via-[#064783] to-[#031c36]",
      imageUrl: "/productos/licuadora_portada.jpeg",
      categorySlug: "licuadoras",
    },
    {
      id: "washers",
      icon: "laundry",
      title: { es: "Lavadoras", en: "Washers" },
      subtitle: {
        es: "Soluciones de lavado eficientes para el día a día.",
        en: "Efficient laundry solutions for everyday care.",
      },
      cta: { es: "Comprar lavadoras", en: "Shop washers" },
      tone: "from-[#031c36] via-[#0a9ad3] to-[#93e7ff]",
      imageUrl: "/productos/lavadora_portada.jpeg",
      categorySlug: "lavadoras",
    },
  ],
  featured: {
    title: { es: "Más buscados para el hogar", en: "Most wanted for home" },
    subtitle: {
      es: "Productos presentados con transiciones suaves, vista rápida y detalles listos para conectarse al catálogo real.",
      en: "Products presented with smooth transitions, quick view, and details ready to connect to the real catalog.",
    },
    cta: { es: "Ver todo", en: "View all" },
  },
  seasonalBanner: {
    theme: "mothers",
    kicker: { es: "Especial del mes", en: "Monthly special" },
    title: {
      es: "Regalos útiles para mamá y para renovar el hogar.",
      en: "Useful gifts for mom and a refreshed home.",
    },
    body: {
      es: "Activa este banner para campañas de San Valentín, Día de las Madres, Navidad, Black Friday o promociones locales.",
      en: "Use this banner for Valentine's Day, Mother's Day, Christmas, Black Friday, or local promotions.",
    },
    cta: { es: "Ver promociones", en: "View promotions" },
    ctaHref: "/productos",
  },
  instagramVideos: [
    {
      id: "showroom",
      title: { es: "Novedades del showroom", en: "Showroom updates" },
      description: {
        es: "Publica aquí reels de productos, demostraciones y equipos recién llegados.",
        en: "Feature product reels, demos, and new arrivals here.",
      },
      url: "https://www.instagram.com/iroselectronics/",
      imageUrl: "",
    },
    {
      id: "deals",
      title: { es: "Ofertas en video", en: "Video deals" },
      description: {
        es: "Ideal para videos cortos de bundles, especiales semanales y promociones de temporada.",
        en: "Ideal for short videos about bundles, weekly specials, and seasonal promos.",
      },
      url: "https://www.instagram.com/iroselectronics/",
      imageUrl: "",
    },
    {
      id: "tips",
      title: { es: "Tips y demostraciones", en: "Tips and demos" },
      description: {
        es: "Agrega enlaces directos a reels publicados para llevar tráfico al perfil de Instagram.",
        en: "Add direct reel links to drive traffic to the Instagram profile.",
      },
      url: "https://www.instagram.com/iroselectronics/",
      imageUrl: "",
    },
  ],
  promo: {
    kicker: { es: "Experiencia IROS", en: "IROS experience" },
    title: {
      es: "Construye una casa más eficiente con equipos que trabajan juntos.",
      en: "Build a more efficient home with equipment that works together.",
    },
    body: {
      es: "Combina cocina, limpieza, entretenimiento y climatización en una experiencia visual clara, rápida y fácil de administrar.",
      en: "Combine kitchen, cleaning, entertainment, and climate in a clear, fast, easy-to-manage visual experience.",
    },
    cta: { es: "Solicitar asesoría", en: "Request guidance" },
  },
  showcases: [
    {
      id: "countertop",
      kicker: { es: "Ninja productos", en: "Ninja products" },
      title: { es: "Ninja Slushie para bebidas congeladas en casa", en: "Ninja Slushie for frozen drinks at home" },
      description: {
        es: "Destaca la línea Ninja con una imagen real del producto para campañas de cocina y verano.",
        en: "Highlight the Ninja lineup with a real product image for kitchen and summer campaigns.",
      },
      priceLabel: { es: "Ninja destacado", en: "Ninja featured" },
      stat: { es: "Edición Slushie", en: "Slushie edition" },
      tone: "from-white via-[#d8f6ff] to-[#0a9ad3]",
      imageUrl: "/productos/ninja2.png",
    },
    {
      id: "floorcare",
      kicker: { es: "Cuidado del hogar", en: "Home care" },
      title: { es: "Limpieza potente, diseño compacto", en: "Powerful cleaning, compact design" },
      description: {
        es: "Área ideal para aspiradoras, vaporizadores o bundles por temporada.",
        en: "Ideal area for vacuums, steamers, or seasonal bundles.",
      },
      priceLabel: { es: "Bundles disponibles", en: "Bundles available" },
      stat: { es: "Garantía incluida", en: "Warranty included" },
      tone: "from-[#031c36] via-[#064783] to-[#0a9ad3]",
      imageUrl: "",
    },
  ],
};
