export type Locale = "es" | "en";

export type ProductSpecGroup = {
  title: string;
  specs: Array<{ label: string; value: string }>;
};

export type Product = {
  id: string;
  sku: string;
  brand: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  category: Record<Locale, string>;
  categorySlug?: string;
  badge: Record<Locale, string>;
  price: number;
  compareAt?: number;
  stock: number;
  rating: number;
  specs: Record<Locale, string[]>;
  specGroups?: Record<Locale, ProductSpecGroup[]>;
  imageClass: string;
  imageUrls?: string[];
  videoUrls?: string[];
};

export const copy = {
  es: {
    brand: "iroselectronics",
    domain: "iroselectronics.com",
    nav: {
      home: "Inicio",
      products: "Productos",
      deals: "Ofertas",
      support: "Soporte",
      admin: "Admin",
    },
    header: {
      search: "Buscar TVs, neveras, laptops...",
      account: "Mi cuenta",
      cart: "Carrito",
      language: "English",
      shipping: "Envíos rápidos y garantía local",
    },
    home: {
      eyebrow: "Tecnología confiable para tu hogar",
      title: "Electrónica y electrodomésticos premium para comprar con confianza.",
      subtitle:
        "iroselectronics conecta tu tienda con inventario real, precios claros y una experiencia moderna alimentada desde nuestra base de datos.",
      primaryCta: "Ver productos",
      secondaryCta: "Explorar ofertas",
      heroCardTitle: "Samsung Neo QLED 65\"",
      heroCardMeta: "4K, HDR, sonido inteligente",
      heroCardPrice: "Desde $1,199",
      trust: ["Garantía oficial", "Inventario sincronizado", "Pagos seguros"],
      categoriesTitle: "Compra por categoría",
      featuredTitle: "Productos destacados",
      featuredSubtitle:
        "Selección publicada desde el catálogo con imágenes reales, precios actualizados e inventario disponible.",
      promoTitle: "Actualiza tu cocina y entretenimiento",
      promoBody:
        "Combina electrodomésticos eficientes con pantallas y audio premium para una casa más inteligente.",
      promoCta: "Solicitar asesoría",
    },
    categories: [
      "Televisores",
      "Cocina",
      "Lavado",
      "Computadoras",
      "Climatización",
      "Audio",
    ],
    catalog: {
      title: "Catálogo de productos",
      subtitle:
        "Explora productos publicados con datos reales del catálogo, imágenes sincronizadas y filtros activos por categoría, marca, precio y especificaciones.",
      filters: "Filtros",
      category: "Categoría",
      brand: "Marca",
      price: "Precio",
      specs: "Especificaciones",
      sort: "Ordenar por relevancia",
      results: "productos disponibles",
      add: "Agregar al carrito",
      stock: "Disponible",
    },
    cart: {
      title: "Carrito de compras",
      empty: "Tu carrito está vacío.",
      subtotal: "Subtotal",
      checkout: "Ir a checkout",
      continue: "Seguir comprando",
      remove: "Eliminar",
      quantity: "Cantidad",
    },
    checkout: {
      title: "Checkout seguro",
      subtitle:
        "Paga con Stripe o solicita un pago Zelle verificado desde tu cuenta de cliente.",
      contact: "Información de contacto",
      shipping: "Dirección de envío",
      payment: "Pago",
      summary: "Resumen",
      placeOrder: "Crear orden",
    },
    auth: {
      title: "Accede a tu cuenta",
      subtitle: "Inicia sesión o crea una cuenta para ver órdenes, direcciones y garantías.",
      email: "Correo electrónico",
      password: "Contraseña",
      signIn: "Iniciar sesión",
      create: "Crear cuenta",
    },
    account: {
      title: "Panel de cliente",
      subtitle: "Historial de órdenes, direcciones y datos de cuenta.",
      orders: "Órdenes recientes",
      addresses: "Direcciones",
      profile: "Perfil",
    },
    admin: {
      title: "Panel administrativo",
      subtitle: "Vista protegida para métricas, productos, órdenes y usuarios.",
      sales: "Ventas del mes",
      orders: "Órdenes",
      products: "Productos activos",
      users: "Usuarios",
    },
    footer: {
      tagline:
        "Electrónica y electrodomésticos con una experiencia digital moderna, bilingüe y catálogo actualizado.",
      newsletter: "Recibe ofertas y lanzamientos",
      rights: "Todos los derechos reservados.",
    },
  },
  en: {
    brand: "iroselectronics",
    domain: "iroselectronics.com",
    nav: {
      home: "Home",
      products: "Products",
      deals: "Deals",
      support: "Support",
      admin: "Admin",
    },
    header: {
      search: "Search TVs, refrigerators, laptops...",
      account: "Account",
      cart: "Cart",
      language: "Español",
      shipping: "Fast shipping and local warranty",
    },
    home: {
      eyebrow: "Trusted technology for your home",
      title: "Premium electronics and appliances built for confident shopping.",
      subtitle:
        "iroselectronics connects your store to a real product catalog, clear pricing, and a modern experience powered by our database.",
      primaryCta: "View products",
      secondaryCta: "Explore deals",
      heroCardTitle: "Samsung Neo QLED 65\"",
      heroCardMeta: "4K, HDR, intelligent sound",
      heroCardPrice: "From $1,199",
      trust: ["Official warranty", "Synced catalog", "Secure payments"],
      categoriesTitle: "Shop by category",
      featuredTitle: "Featured products",
      featuredSubtitle:
        "Published selection from the catalog with real images, current pricing, and available inventory.",
      promoTitle: "Upgrade your kitchen and entertainment",
      promoBody:
        "Combine efficient appliances with premium screens and audio for a smarter home.",
      promoCta: "Request guidance",
    },
    categories: ["TVs", "Kitchen", "Laundry", "Computers", "Climate", "Audio"],
    catalog: {
      title: "Product catalog",
      subtitle:
        "Browse published products with real catalog data, synced images, and active filters by category, brand, price, and specifications.",
      filters: "Filters",
      category: "Category",
      brand: "Brand",
      price: "Price",
      specs: "Specifications",
      sort: "Sort by relevance",
      results: "available products",
      add: "Add to cart",
      stock: "Available",
    },
    cart: {
      title: "Shopping cart",
      empty: "Your cart is empty.",
      subtotal: "Subtotal",
      checkout: "Go to checkout",
      continue: "Continue shopping",
      remove: "Remove",
      quantity: "Quantity",
    },
    checkout: {
      title: "Secure checkout",
      subtitle:
        "Pay with Stripe or request a verified Zelle payment from your customer account.",
      contact: "Contact information",
      shipping: "Shipping address",
      payment: "Payment",
      summary: "Summary",
      placeOrder: "Place order",
    },
    auth: {
      title: "Access your account",
      subtitle: "Sign in or create an account to view orders, addresses, and warranties.",
      email: "Email address",
      password: "Password",
      signIn: "Sign in",
      create: "Create account",
    },
    account: {
      title: "Customer dashboard",
      subtitle: "Order history, addresses, and account details.",
      orders: "Recent orders",
      addresses: "Addresses",
      profile: "Profile",
    },
    admin: {
      title: "Admin dashboard",
      subtitle: "Protected view for metrics, products, orders, and users.",
      sales: "Monthly sales",
      orders: "Orders",
      products: "Active products",
      users: "Users",
    },
    footer: {
      tagline:
        "Electronics and appliances with a modern, bilingual digital experience and an updated catalog.",
      newsletter: "Get deals and launches",
      rights: "All rights reserved.",
    },
  },
} as const;

export const products: Product[] = [
  {
    id: "tv-samsung-neo-qled-65",
    sku: "IRO-TV-SAM-65NQ",
    brand: "Samsung",
    name: {
      es: "Samsung Neo QLED 65\" 4K",
      en: "Samsung Neo QLED 65\" 4K",
    },
    description: {
      es: "Pantalla premium con brillo avanzado, HDR y sonido inteligente para salas modernas.",
      en: "Premium display with advanced brightness, HDR, and intelligent sound for modern living rooms.",
    },
    category: { es: "Televisores", en: "TVs" },
    badge: { es: "Más vendido", en: "Best seller" },
    price: 119900,
    compareAt: 139900,
    stock: 18,
    rating: 4.8,
    specs: {
      es: ["65 pulgadas", "4K UHD", "HDR Quantum", "Smart TV"],
      en: ["65 inch", "4K UHD", "Quantum HDR", "Smart TV"],
    },
    imageClass: "from-blue-600 via-slate-900 to-cyan-400",
    videoUrls: ["https://www.w3schools.com/html/mov_bbb.mp4"],
  },
  {
    id: "lg-instaview-refrigerator",
    sku: "IRO-KIT-LG-INSTA",
    brand: "LG",
    name: {
      es: "LG InstaView Nevera French Door",
      en: "LG InstaView French Door Refrigerator",
    },
    description: {
      es: "Refrigeración eficiente con puerta InstaView, gran capacidad y control inteligente.",
      en: "Efficient refrigeration with InstaView door, large capacity, and smart control.",
    },
    category: { es: "Cocina", en: "Kitchen" },
    badge: { es: "Eficiencia alta", en: "High efficiency" },
    price: 189900,
    compareAt: 209900,
    stock: 7,
    rating: 4.7,
    specs: {
      es: ["27 pies cúbicos", "Inverter", "Wi-Fi", "Acero inoxidable"],
      en: ["27 cu. ft.", "Inverter", "Wi-Fi", "Stainless steel"],
    },
    imageClass: "from-slate-200 via-slate-500 to-slate-900",
    videoUrls: [],
  },
  {
    id: "whirlpool-lavadora-front-load",
    sku: "IRO-LAU-WHI-FL",
    brand: "Whirlpool",
    name: {
      es: "Whirlpool Lavadora Frontal 20 kg",
      en: "Whirlpool 20 kg Front Load Washer",
    },
    description: {
      es: "Lavado potente y silencioso con ciclos rápidos para familias ocupadas.",
      en: "Powerful and quiet washing with quick cycles for busy families.",
    },
    category: { es: "Lavado", en: "Laundry" },
    badge: { es: "Ahorro de agua", en: "Water saving" },
    price: 84900,
    stock: 12,
    rating: 4.6,
    specs: {
      es: ["20 kg", "Motor inverter", "Ciclo rápido", "Bajo ruido"],
      en: ["20 kg", "Inverter motor", "Quick cycle", "Low noise"],
    },
    imageClass: "from-indigo-500 via-sky-200 to-white",
    videoUrls: [],
  },
  {
    id: "sony-soundbar-dolby-atmos",
    sku: "IRO-AUD-SON-ATMOS",
    brand: "Sony",
    name: {
      es: "Sony Barra de Sonido Dolby Atmos",
      en: "Sony Dolby Atmos Soundbar",
    },
    description: {
      es: "Audio envolvente para cine en casa con bajos profundos y conexión Bluetooth.",
      en: "Immersive home theater audio with deep bass and Bluetooth connectivity.",
    },
    category: { es: "Audio", en: "Audio" },
    badge: { es: "Nuevo", en: "New" },
    price: 44900,
    stock: 24,
    rating: 4.5,
    specs: {
      es: ["Dolby Atmos", "Subwoofer", "Bluetooth", "HDMI eARC"],
      en: ["Dolby Atmos", "Subwoofer", "Bluetooth", "HDMI eARC"],
    },
    imageClass: "from-zinc-950 via-zinc-700 to-orange-400",
    videoUrls: [],
  },
];

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function localizedPath(locale: Locale, path: "home" | "products" | "checkout" | "login" | "account" | "admin") {
  const paths = {
    es: {
      home: "/",
      products: "/productos",
      checkout: "/checkout",
      login: "/login",
      account: "/account",
      admin: "/admin",
    },
    en: {
      home: "/en",
      products: "/en/products",
      checkout: "/en/checkout",
      login: "/en/login",
      account: "/en/account",
      admin: "/en/admin",
    },
  };

  return paths[locale][path];
}

export function productPath(locale: Locale, productId: string) {
  return `${localizedPath(locale, "products")}/${productId}`;
}

export function getProductById(productId: string) {
  return products.find((product) => product.id === productId);
}
