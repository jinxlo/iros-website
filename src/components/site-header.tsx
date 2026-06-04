"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApplianceIcon } from "@/components/appliance-icon";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductImage } from "@/components/product-image";
import { categoryHref, storeCategories, type CategoryIconName } from "@/lib/categories";
import {
  copy,
  formatPrice,
  localizedPath,
  type Locale,
} from "@/lib/content";
import { useSiteContent } from "@/stores/site-content-context";

type SiteHeaderProps = {
  locale: Locale;
  active?: "home" | "products" | "admin";
};

type HeaderSearchFormProps = {
  locale: Locale;
  search: string;
  setSearch: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNavigate?: () => void;
  onSelectHref?: (href: string) => void;
  compact?: boolean;
};

type HeaderSearchProduct = {
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

function CategoryIcon({ icon }: { icon: CategoryIconName }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const icons: Record<CategoryIconName, ReactNode> = {
    tv: <svg {...common}>
      <path d="M4 6h16v10H4z" />
      <path d="M9 20h6" />
      <path d="M12 16v4" />
    </svg>,
    kitchen: <svg {...common}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6" />
      <circle cx="12" cy="14" r="3" />
    </svg>,
    laundry: <svg {...common}>
      <path d="M7 4h10v16H7z" />
      <circle cx="12" cy="13" r="4" />
      <path d="M10 7h1" />
    </svg>,
    computer: <svg {...common}>
      <path d="M5 5h14v10H5z" />
      <path d="M9 20h6" />
      <path d="M12 15v5" />
    </svg>,
    climate: <svg {...common}>
      <path d="M4 8h16" />
      <path d="M6 12h12" />
      <path d="M8 16h8" />
      <path d="M12 4v16" />
    </svg>,
    audio: <svg {...common}>
      <path d="M5 9v6h4l5 4V5L9 9z" />
      <path d="M17 9a4 4 0 0 1 0 6" />
    </svg>,
    refrigeration: <svg {...common}>
      <path d="M8 3h8a2 2 0 0 1 2 2v16H6V5a2 2 0 0 1 2-2z" />
      <path d="M6 10h12" />
      <path d="M10 7h1" />
      <path d="M10 14h1" />
    </svg>,
    "small-appliance": <svg {...common}>
      <path d="M8 5h8l1 12H7z" />
      <path d="M10 5V3h4v2" />
      <path d="M9 10h6" />
      <path d="M10 20h4" />
    </svg>,
    "smart-home": <svg {...common}>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
      <path d="M9 9h6" />
    </svg>,
    gaming: <svg {...common}>
      <path d="M7 9h10a4 4 0 0 1 4 4v2a3 3 0 0 1-5 2l-2-2h-4l-2 2a3 3 0 0 1-5-2v-2a4 4 0 0 1 4-4z" />
      <path d="M8 13h3" />
      <path d="M9.5 11.5v3" />
      <path d="M16 12h.01" />
      <path d="M18 14h.01" />
    </svg>,
    parts: <svg {...common}>
      <path d="m14.7 6.3 3 3" />
      <path d="M5 19 15.5 8.5l-3-3L2 16v3z" />
      <path d="M13 19h8" />
    </svg>,
    deals: <svg {...common}>
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 7v14" />
      <path d="M12 7H8.5a2.5 2.5 0 1 1 2.2-3.7L12 7z" />
      <path d="M12 7h3.5a2.5 2.5 0 1 0-2.2-3.7L12 7z" />
    </svg>,
  };

  return icons[icon];
}

function HeaderSearchForm({
  locale,
  search,
  setSearch,
  onSubmit,
  onNavigate,
  onSelectHref,
  compact = false,
}: HeaderSearchFormProps) {
  const [focused, setFocused] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<HeaderSearchProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const searchCache = useRef(new Map<string, HeaderSearchProduct[]>());
  const imageCache = useRef(new Map<string, { imageUrl: string; imageAlt: string }>());
  const imageMisses = useRef(new Set<string>());
  const t = copy[locale];
  const searchLabel = locale === "es" ? "Buscar" : "Search";
  const viewAllResultsLabel = locale === "es" ? "Ver todos los resultados" : "View all results";
  const allLabel = locale === "es" ? "Todo" : "All";
  const query = search.trim().toLowerCase();
  const categorySuggestions = query
    ? storeCategories
        .flatMap((category) => [
          {
            key: category.slug,
            label: category.name[locale],
            parent: locale === "es" ? "Categoría" : "Category",
            href: categoryHref(locale, category.slug),
          },
          ...category.subcategories.map((subcategory) => ({
            key: `${category.slug}-${subcategory.slug}`,
            label: subcategory.name[locale],
            parent: category.name[locale],
            href: categoryHref(locale, subcategory.slug),
          })),
        ])
        .filter((item) =>
          `${item.label} ${item.parent}`.toLowerCase().includes(query),
        )
        .slice(0, 5)
    : [];
  const showSuggestions = focused && query.length > 0;
  const searchResultsHref = `${localizedPath(locale, "products")}?q=${encodeURIComponent(search.trim())}`;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      if (query.length < 1) {
        setProductSuggestions([]);
        setLoadingProducts(false);
        return;
      }

      const cacheKey = query;
      const cached = searchCache.current.get(cacheKey);

      if (cached) {
        setProductSuggestions(cached);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);

      fetch(`/api/products/search?q=${encodeURIComponent(search.trim())}&limit=6`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { products: [] }))
        .then((payload: { products?: HeaderSearchProduct[] }) => {
          const products = payload.products || [];

          searchCache.current.set(cacheKey, products);
          setProductSuggestions(products);
          setLoadingProducts(false);
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setProductSuggestions([]);
            setLoadingProducts(false);
          }
        });
    }, 45);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query, search]);

  useEffect(() => {
    const missingIds = productSuggestions
      .filter((product) => !product.imageUrl && !imageCache.current.has(product.id) && !imageMisses.current.has(product.id))
      .map((product) => product.id);

    if (missingIds.length === 0) {
      const hasCachedImages = productSuggestions.some((product) => !product.imageUrl && imageCache.current.has(product.id));

      if (hasCachedImages) {
        setProductSuggestions((current) => current.map((product) => ({
          ...product,
          ...imageCache.current.get(product.id),
        })));
      }

      return;
    }

    const controller = new AbortController();

    fetch(`/api/products/search-images?ids=${missingIds.join(",")}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { images: {} }))
      .then((payload: { images?: Record<string, { imageUrl: string; imageAlt: string }> }) => {
        const images = payload.images || {};

        for (const productId of missingIds) {
          imageMisses.current.add(productId);
        }

        for (const [productId, image] of Object.entries(images)) {
          imageCache.current.set(productId, image);
        }

        if (Object.keys(images).length === 0) {
          return;
        }

        setProductSuggestions((current) => current.map((product) => ({
          ...product,
          ...imageCache.current.get(product.id),
        })));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
      });

    return () => controller.abort();
  }, [productSuggestions]);

  return (
    <div className="relative w-full">
      <form
        onSubmit={onSubmit}
        className={`flex w-full overflow-hidden rounded-md border-2 border-transparent bg-white text-slate-950 shadow-sm transition duration-300 focus-within:border-[var(--brand-cyan)] focus-within:ring-4 focus-within:ring-[rgba(10,154,211,0.24)] ${
          compact ? "h-12" : "h-12 lg:h-13"
        }`}
      >
        <div className="hidden items-center border-r border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-700 sm:flex">
          {allLabel}
        </div>
        <input
          aria-label={t.header.search}
          value={search}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={t.header.search}
          className="min-w-0 flex-1 px-4 text-sm outline-none placeholder:text-slate-500 sm:text-base"
        />
        <button
          type="submit"
          aria-label={searchLabel}
          className="bg-[var(--brand-cyan)] px-4 text-sm font-black text-white transition duration-300 hover:bg-[var(--brand-cyan-light)] sm:px-6"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </form>

      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-slate-900/15">
          {productSuggestions.length > 0 ? (
            <div className="border-b border-slate-100 p-2">
              <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-blue)]">
                {locale === "es" ? "Productos" : "Products"}
              </p>
              {productSuggestions.map((product) => {
                const href = `${localizedPath(locale, "products")}/${product.slug}`;

                return (
                  <Link
                    key={product.id}
                    href={href}
                    onMouseDown={(event) => {
                      if (!onSelectHref) {
                        return;
                      }

                      event.preventDefault();
                      onSelectHref(href);
                    }}
                    onClick={onNavigate}
                    className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                  >
                    <span className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-blue-100 text-xs font-black text-[var(--brand-blue)]">
                      {product.imageUrl ? (
                        <ProductImage src={product.imageUrl} alt={product.imageAlt || product.name} className="product-image-contrast h-full w-full object-contain p-1" />
                      ) : product.brand.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs font-semibold text-slate-500">
                        {product.brand} · {product.sku}
                      </span>
                    </span>
                    <span className="rounded-full bg-[var(--brand-blue)] px-2.5 py-1 text-xs font-black text-white shadow-sm">
                      {formatPrice(product.price)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : loadingProducts ? (
            <div className="border-b border-slate-100 p-2">
              <p className="px-3 py-3 text-sm font-bold text-slate-500">
                {locale === "es" ? "Buscando productos..." : "Searching products..."}
              </p>
            </div>
          ) : null}

          {categorySuggestions.length > 0 ? (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-blue)]">
                {locale === "es" ? "Categorías" : "Categories"}
              </p>
              {categorySuggestions.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onMouseDown={(event) => {
                    if (!onSelectHref) {
                      return;
                    }

                    event.preventDefault();
                    onSelectHref(item.href);
                  }}
                  onClick={onNavigate}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 hover:text-[var(--brand-blue)]"
                >
                  <span>{item.label}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {item.parent}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
          <div className="border-t border-slate-100 p-2">
            <Link
              href={searchResultsHref}
              onMouseDown={(event) => {
                if (!onSelectHref) {
                  return;
                }

                event.preventDefault();
                onSelectHref(searchResultsHref);
              }}
              onClick={onNavigate}
              className="flex items-center justify-center rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-black text-white transition hover:bg-[var(--brand-blue-dark)]"
            >
              {viewAllResultsLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileNavIcon({ icon }: { icon: "home" | "products" | "search" | "account" }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const icons = {
    home: <svg {...common}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>,
    products: <svg {...common}><path d="M4 7h16" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>,
    search: <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
    account: <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>,
  };

  return icons[icon];
}

function MobileBottomNav({ locale, pathname, onSearchClick }: { locale: Locale; pathname: string; onSearchClick: () => void }) {
  const productsPath = localizedPath(locale, "products");
  const accountPath = localizedPath(locale, "account");
  const items = [
    { label: locale === "es" ? "Inicio" : "Home", href: localizedPath(locale, "home"), icon: "home" as const, active: pathname === localizedPath(locale, "home") },
    { label: locale === "es" ? "Tienda" : "Shop", href: productsPath, icon: "products" as const, active: pathname.startsWith(productsPath) },
    { label: locale === "es" ? "Cuenta" : "Account", href: accountPath, icon: "account" as const, active: pathname.startsWith(accountPath) },
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[1.5rem] border border-white/60 bg-white/94 px-2 py-2 shadow-2xl shadow-slate-950/20 backdrop-blur-xl md:hidden" aria-label={locale === "es" ? "Navegación móvil" : "Mobile navigation"}>
      <div className="grid grid-cols-5 items-center gap-1">
        {items.slice(0, 2).map((item) => (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-black transition ${item.active ? "bg-[var(--brand-blue)] text-white shadow-lg shadow-blue-900/20" : "text-slate-500 hover:bg-slate-50 hover:text-[var(--brand-blue)]"}`}>
            <MobileNavIcon icon={item.icon} />
            {item.label}
          </Link>
        ))}
        <button type="button" onClick={onSearchClick} className="-mt-7 flex h-16 w-16 flex-col items-center justify-center justify-self-center rounded-full bg-[var(--brand-blue)] text-white shadow-2xl shadow-blue-900/30 ring-4 ring-white">
          <MobileNavIcon icon="search" />
          <span className="mt-0.5 text-[10px] font-black">{locale === "es" ? "Buscar" : "Search"}</span>
        </button>
        {items.slice(2).map((item) => (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-black transition ${item.active ? "bg-[var(--brand-blue)] text-white shadow-lg shadow-blue-900/20" : "text-slate-500 hover:bg-slate-50 hover:text-[var(--brand-blue)]"}`}>
            <MobileNavIcon icon={item.icon} />
            {item.label}
          </Link>
        ))}
        <CartDrawer locale={locale} variant="mobile" />
      </div>
    </nav>
  );
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState(storeCategories[0].slug);
  const { content } = useSiteContent();
  const t = copy[locale];
  const closeLabel = locale === "es" ? "Cerrar" : "Close";
  const quickCategorySlugs = [
    "televisores-video",
    "cocina",
    "refrigeracion",
    "lavado",
    "pequenos-electrodomesticos",
  ];
  const quickCategories = storeCategories.filter((category) =>
    quickCategorySlugs.includes(category.slug),
  );
  const activeCategory =
    storeCategories.find((category) => category.slug === activeCategorySlug) ??
    storeCategories[0];

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = search.trim();
    const target = localizedPath(locale, "products");

    setMenuOpen(false);

    if (!query) {
      router.push(target);
      return;
    }

    router.push(`${target}?q=${encodeURIComponent(query)}`);
  }

  function selectSearchHref(href: string) {
    setMenuOpen(false);
    setSearch("");
    router.push(href);
  }

  function focusMobileSearch() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      const searchInput = document.querySelector<HTMLInputElement>('input[aria-label]');
      searchInput?.focus();
    }, 220);
  }

  return (
    <header
      className={`relative z-40 border-b border-white/10 bg-[var(--brand-blue)] text-white transition-[box-shadow,border-color,background-color] duration-500 ease-out ${
        isScrolled
          ? "border-white/20 shadow-xl shadow-[rgba(3,28,54,0.28)]"
          : "shadow-sm shadow-[rgba(3,28,54,0.12)]"
      }`}
    >
      <div
        className={`overflow-hidden bg-[var(--brand-ink)] px-4 text-center text-xs font-bold text-white transition-all duration-500 ease-out sm:text-sm ${
          isScrolled ? "max-h-0 py-0 opacity-0" : "max-h-24 py-2 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4">
          <span className="inline-flex items-center gap-1.5 text-cyan-100">
            <ApplianceIcon icon="truck" className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" />
            <span className="text-white">
              {locale === "es" ? "Entrega a nivel nacional" : "Nationwide delivery"}
            </span>
          </span>
          <span className="hidden text-white/45 sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="text-white/95">{content.announcement[locale]}</span>
        </div>
      </div>

      <div
        className={`mx-auto grid max-w-7xl gap-3 px-4 transition-all duration-500 ease-out sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:px-8 ${
          isScrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="flex items-center gap-4">
          <Link
            href={localizedPath(locale, "home")}
            className={`relative block shrink-0 transition-all duration-500 ease-out hover:scale-[1.02] ${
              isScrolled ? "h-16 w-48 sm:h-20 sm:w-52" : "h-20 w-52 sm:h-24 sm:w-64"
            }`}
          >
            <Image
              src="/logos/iroslogo.png"
              alt="iroselectronics"
              fill
              priority
              sizes="(max-width: 640px) 208px, 256px"
              className="object-contain object-left"
            />
          </Link>
        </div>

        <HeaderSearchForm
          locale={locale}
          search={search}
          setSearch={setSearch}
          onSubmit={submitSearch}
          onSelectHref={selectSearchHref}
        />

        <div className="hidden items-center justify-end gap-2 md:flex">
          <Link
            href={localizedPath(locale, "login")}
            className="rounded-full px-4 py-2 text-sm font-black text-blue-50 transition duration-300 hover:bg-white/10 hover:text-white"
          >
            {t.header.account}
          </Link>
          <CartDrawer locale={locale} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white transition-colors duration-500 ease-out">
        <div
          className={`mx-auto flex max-w-7xl flex-wrap items-center gap-3 overflow-visible px-4 transition-all duration-500 ease-out sm:px-6 lg:px-8 ${
            isScrolled ? "py-3" : "py-4"
          }`}
        >
          <button
            type="button"
            aria-label={locale === "es" ? "Abrir todas las categorías" : "Open all categories"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-[var(--brand-blue)] transition duration-300 hover:border-[var(--brand-cyan)] hover:bg-white"
          >
            <span className="grid gap-1">
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
            </span>
            {locale === "es" ? "Todas" : "All"}
          </button>
          {quickCategories.map((category) => (
            <Link
              key={category.slug}
              href={categoryHref(locale, category.slug)}
              className="group flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)] hover:shadow-lg hover:shadow-slate-200/70"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(10,154,211,0.10)] text-[var(--brand-blue)] transition duration-300 group-hover:bg-[var(--brand-blue)] group-hover:text-white">
                <CategoryIcon icon={category.icon} />
              </span>
              {category.name[locale]}
            </Link>
          ))}
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label={closeLabel}
            className="absolute inset-0 animate-fade-in bg-[rgba(3,28,54,0.70)] backdrop-blur-sm"
            type="button"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-dvh w-full max-w-sm animate-slide-in-left flex-col bg-[#f4f7fb] text-slate-950 shadow-2xl lg:max-w-5xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-[var(--brand-blue)] px-6 py-4 text-white">
              <Link
                href={localizedPath(locale, "home")}
                onClick={() => setMenuOpen(false)}
                className="relative block h-20 w-52"
              >
                <Image
                  src="/logos/iroslogo.png"
                  alt="iroselectronics"
                  fill
                  sizes="208px"
                  className="object-contain object-left"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-black text-white transition hover:border-white hover:bg-white/10"
              >
                {closeLabel}
              </button>
            </div>

            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <HeaderSearchForm
                locale={locale}
                search={search}
                setSearch={setSearch}
                onSubmit={submitSearch}
                onNavigate={() => setMenuOpen(false)}
                onSelectHref={selectSearchHref}
                compact
              />
            </div>

            <nav className="grid flex-1 overflow-hidden lg:grid-cols-[260px_1fr]">
              <div className="overflow-y-auto border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r">
                <p className="px-3 pb-3 text-xs font-black uppercase tracking-[0.24em] text-[var(--brand-blue)]">
                  {locale === "es" ? "Categorías" : "Categories"}
                </p>
                <div className="grid gap-1">
                  {storeCategories.map((category) => (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => setActiveCategorySlug(category.slug)}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black transition duration-300 ${
                        activeCategory.slug === category.slug
                          ? "bg-[var(--brand-blue)] text-white shadow-lg shadow-[rgba(0,58,131,0.22)]"
                          : "text-slate-800 hover:bg-slate-100 hover:text-[var(--brand-blue)]"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition duration-300 ${
                          activeCategory.slug === category.slug
                            ? "bg-white/15 text-white"
                            : "bg-[rgba(10,154,211,0.10)] text-[var(--brand-blue)] group-hover:bg-[var(--brand-blue)] group-hover:text-white"
                        }`}
                      >
                        <CategoryIcon icon={category.icon} />
                      </span>
                      {category.name[locale]}
                    </button>
                  ))}
                </div>
              </div>

              <div key={activeCategory.slug} className="animate-panel-shift overflow-y-auto p-6">
                <p className="animate-fade-up text-xs font-black uppercase tracking-[0.24em] text-[var(--brand-blue)]">
                  {locale === "es" ? "Subcategorías" : "Subcategories"}
                </p>
                <h2 className="mt-2 animate-fade-up text-2xl font-black text-slate-950 [animation-delay:45ms]">
                  {activeCategory.name[locale]}
                </h2>
                <p className="mt-2 animate-fade-up text-sm leading-6 text-slate-600 [animation-delay:90ms]">
                  {activeCategory.description[locale]}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeCategory.subcategories.map((subcategory, index) => (
                    <Link
                      key={subcategory.slug}
                      href={categoryHref(locale, subcategory.slug)}
                      onClick={() => setMenuOpen(false)}
                      className="animate-menu-card rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 opacity-0 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)] hover:shadow-lg hover:shadow-slate-200/70"
                      style={{ animationDelay: `${120 + index * 38}ms` }}
                    >
                      {subcategory.name[locale]}
                    </Link>
                  ))}
                </div>
                <Link
                  href={categoryHref(locale, activeCategory.slug)}
                  onClick={() => setMenuOpen(false)}
                  className="mt-7 inline-flex animate-menu-card rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-black text-white opacity-0 shadow-lg shadow-[rgba(0,58,131,0.24)] transition hover:bg-[var(--brand-blue-dark)] [animation-delay:380ms]"
                >
                  {locale === "es" ? "Ver todo en" : "View all in"} {activeCategory.name[locale]}
                </Link>
                <div className="my-7 border-t border-slate-200" />
              </div>
            </nav>

            <div className="grid gap-2 border-t border-slate-200 bg-white p-5 lg:grid-cols-2">
              <Link
                href={localizedPath(locale, "login")}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-base font-black text-slate-800 transition hover:bg-slate-100"
              >
                {t.header.account}
              </Link>
              <Link
                href={localizedPath(locale, "admin")}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-base font-black text-slate-800 transition hover:bg-slate-100"
              >
                {t.nav.admin}
              </Link>
            </div>

            <div className="mt-auto border-t border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
              {content.announcement[locale]} · {t.domain}
            </div>
          </aside>
        </div>
      ) : null}
      <MobileBottomNav locale={locale} pathname={pathname} onSearchClick={focusMobileSearch} />
    </header>
  );
}
