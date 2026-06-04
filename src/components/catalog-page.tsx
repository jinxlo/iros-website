"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { storeCategories } from "@/lib/categories";
import { copy, products as fallbackProducts, type Locale, type Product } from "@/lib/content";
import type { ProductCatalogFilterOptions } from "@/lib/data/products";

type CatalogPageProps = {
  locale: Locale;
  searchQuery?: string;
  products?: Product[];
  filterOptions?: ProductCatalogFilterOptions;
  page?: number;
  hasNextPage?: boolean;
  categoryFilterParam?: string;
  brandFilterParam?: string;
  priceFilterParam?: string;
};

const priceRanges = [
  { value: "all", min: 0, max: Number.POSITIVE_INFINITY, es: "Todos los precios", en: "All prices" },
  { value: "under-100", min: 0, max: 10_000, es: "Menos de $100", en: "Under $100" },
  { value: "100-500", min: 10_000, max: 50_000, es: "$100 a $500", en: "$100 to $500" },
  { value: "500-1000", min: 50_000, max: 100_000, es: "$500 a $1,000", en: "$500 to $1,000" },
  { value: "1000-2500", min: 100_000, max: 250_000, es: "$1,000 a $2,500", en: "$1,000 to $2,500" },
  { value: "over-2500", min: 250_000, max: Number.POSITIVE_INFINITY, es: "Más de $2,500", en: "Over $2,500" },
];

function normalized(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function publicSpecOptions(products: Product[], locale: Locale) {
  return uniqueSorted(
    products
      .flatMap((product) => product.specs[locale])
      .filter((spec) => !/^sku\b/i.test(spec))
      .filter((spec) => !/^stock\b/i.test(spec))
      .filter((spec) => !/^(marca|brand)\b/i.test(spec))
      .filter((spec) => !/^(publicado|published|draft)$/i.test(spec)),
  ).slice(0, 60);
}

function categoryMatches(product: Product, selectedCategory: string, locale: Locale) {
  if (selectedCategory === "all") {
    return true;
  }

  const selectedGroup = storeCategories.find((category) => category.slug === selectedCategory);

  if (selectedGroup) {
    const slugs = new Set([selectedGroup.slug, ...selectedGroup.subcategories.map((subcategory) => subcategory.slug)]);

    return product.categorySlug ? slugs.has(product.categorySlug) : product.category[locale] === selectedGroup.name[locale];
  }

  return product.categorySlug === selectedCategory || product.category[locale] === selectedCategory;
}

export function CatalogPage({
  locale,
  searchQuery = "",
  products = fallbackProducts,
  filterOptions,
  page = 1,
  hasNextPage = false,
  categoryFilterParam = "all",
  brandFilterParam = "all",
  priceFilterParam = "all",
}: CatalogPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const categoryFilter = categoryFilterParam || "all";
  const brandFilter = brandFilterParam || "all";
  const priceFilter = priceFilterParam || "all";
  const [specFilter, setSpecFilter] = useState("all");
  const [sort, setSort] = useState("relevance");
  const t = copy[locale];
  const normalizedQuery = normalized(searchQuery.trim());
  const brandOptions = filterOptions?.brands || uniqueSorted(products.map((product) => product.brand));
  const specOptions = filterOptions?.specs || publicSpecOptions(products, locale);
  const effectiveSpecFilter = specFilter === "all" || specOptions.includes(specFilter) ? specFilter : "all";
  const availablePriceOptions = new Set(filterOptions?.prices || priceRanges.slice(1).map((range) => range.value));
  const visiblePriceRanges = priceRanges.filter((range) =>
    range.value === "all" || range.value === priceFilter || availablePriceOptions.has(range.value),
  );
  const selectedPriceRange = priceRanges.find((range) => range.value === priceFilter) || priceRanges[0];
  const filteredProducts = products
    .filter((product) => {
      if (!normalizedQuery) {
        return true;
      }

        const searchable = [
          product.sku,
          product.brand,
          product.name[locale],
          product.description[locale],
          product.category[locale],
          ...product.specs[locale],
        ]
          .join(" ")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        return searchable.includes(normalizedQuery);
      })
    .filter((product) => categoryMatches(product, categoryFilter, locale))
    .filter((product) => brandFilter === "all" || product.brand === brandFilter)
    .filter((product) => priceFilter === "all" || (product.price >= selectedPriceRange.min && product.price < selectedPriceRange.max))
    .filter((product) => effectiveSpecFilter === "all" || product.specs[locale].includes(effectiveSpecFilter))
    .sort((a, b) => {
      if (sort === "price-asc") {
        return a.price - b.price;
      }

      if (sort === "price-desc") {
        return b.price - a.price;
      }

      if (sort === "name") {
        return a.name[locale].localeCompare(b.name[locale]);
      }

      return 0;
    });
  const filterLabels = locale === "es"
    ? {
        allCategories: "Todas las categorías",
        allBrands: "Todas las marcas",
        allSpecs: "Todas las especificaciones",
        clear: "Limpiar filtros",
        active: "Filtros activos",
        relevance: "Relevancia",
        priceAsc: "Precio: menor a mayor",
        priceDesc: "Precio: mayor a menor",
        name: "Nombre A-Z",
      }
    : {
        allCategories: "All categories",
        allBrands: "All brands",
        allSpecs: "All specifications",
        clear: "Clear filters",
        active: "Active filters",
        relevance: "Relevance",
        priceAsc: "Price: low to high",
        priceDesc: "Price: high to low",
        name: "Name A-Z",
      };
  const activeFilterCount = [categoryFilter, brandFilter, priceFilter, effectiveSpecFilter].filter((value) => value !== "all").length;
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const pageLabels =
    locale === "es"
      ? { previous: "Anterior", next: "Siguiente", page: "Página" }
      : { previous: "Previous", next: "Next", page: "Page" };
  const updateUrlParam = (name: string, value: string) => {
    const params = new URLSearchParams(urlSearchParams.toString());

    if (!value || value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };
  const filterUrl = (name: string, value: string) => {
    const params = new URLSearchParams(urlSearchParams.toString());

    if (name === "category") {
      params.delete("brand");
    }

    if (!value || value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    params.delete("page");
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };
  const buildPageUrl = (nextPage: number) => {
    const params = new URLSearchParams(urlSearchParams.toString());

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    const queryString = params.toString();
    const basePath = locale === "es" ? "/productos" : "/en/products";
    return queryString ? `${basePath}?${queryString}` : basePath;
  };
  const emptyMessage =
    locale === "es"
      ? "No encontramos productos para esa búsqueda. Intenta con otra marca, categoría o especificación."
      : "No products matched that search. Try another brand, category, or specification.";

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader locale={locale} active="products" />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-[var(--brand-blue)] p-8 text-white shadow-xl shadow-[rgba(6,71,131,0.18)] sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-100">
            iroselectronics
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            {t.catalog.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            {t.catalog.subtitle}
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">{t.catalog.filters}</h2>
            <div className="mt-5 space-y-5">
              <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3" open={categoryFilter !== "all"}>
                <summary className="cursor-pointer list-none text-sm font-black text-slate-700 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {t.catalog.category}
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-[var(--brand-blue)] ring-1 ring-slate-200">
                      {categoryFilter === "all" ? filterLabels.allCategories : categoryFilter}
                    </span>
                  </span>
                </summary>
                <div className="mt-3 max-h-96 space-y-3 overflow-y-auto pr-1">
                  <Link
                    href={filterUrl("category", "all")}
                    className={`block rounded-xl px-3 py-2 text-sm font-black transition ${
                      categoryFilter === "all"
                        ? "bg-[var(--brand-blue)] text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:text-[var(--brand-blue)]"
                    }`}
                  >
                    {filterLabels.allCategories}
                  </Link>
                  {storeCategories.map((category) => {
                    const categoryActive = categoryFilter === category.slug;

                    return (
                      <div key={category.slug} className="rounded-xl bg-white p-2 ring-1 ring-slate-200">
                        <Link
                          href={filterUrl("category", category.slug)}
                          className={`block rounded-lg px-3 py-2 text-sm font-black transition ${
                            categoryActive
                              ? "bg-[var(--brand-blue)] text-white"
                              : "text-slate-800 hover:bg-slate-50 hover:text-[var(--brand-blue)]"
                          }`}
                        >
                          {category.name[locale]}
                        </Link>
                        <div className="mt-1 grid gap-1">
                          {category.subcategories.map((subcategory) => {
                            const subcategoryActive = categoryFilter === subcategory.slug;

                            return (
                              <Link
                                key={subcategory.slug}
                                href={filterUrl("category", subcategory.slug)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                  subcategoryActive
                                    ? "bg-[rgba(10,154,211,0.14)] text-[var(--brand-blue)]"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-[var(--brand-blue)]"
                                }`}
                              >
                                {subcategory.name[locale]}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
              <label className="block text-sm font-black text-slate-700">
                {t.catalog.brand}
                <select
                  value={brandFilter}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    updateUrlParam("brand", nextValue);
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[var(--brand-cyan)] focus:bg-white"
                >
                  <option value="all">{filterLabels.allBrands}</option>
                  {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </label>
              <label className="block text-sm font-black text-slate-700">
                {t.catalog.price}
                <select
                  value={priceFilter}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    updateUrlParam("price", nextValue);
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[var(--brand-cyan)] focus:bg-white"
                >
                  {visiblePriceRanges.map((range) => <option key={range.value} value={range.value}>{range[locale]}</option>)}
                </select>
              </label>
              <label className="block text-sm font-black text-slate-700">
                {t.catalog.specs}
                <select value={effectiveSpecFilter} onChange={(event) => setSpecFilter(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[var(--brand-cyan)] focus:bg-white">
                  <option value="all">{filterLabels.allSpecs}</option>
                  {specOptions.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
                </select>
              </label>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
                {activeFilterCount} {filterLabels.active}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSpecFilter("all");
                  const params = new URLSearchParams(urlSearchParams.toString());
                  params.delete("category");
                  params.delete("brand");
                  params.delete("price");
                  params.delete("page");
                  const queryString = params.toString();
                  router.push(queryString ? `${pathname}?${queryString}` : pathname);
                }}
                className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]"
              >
                {filterLabels.clear}
              </button>
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              <p className="font-bold text-slate-700">
                {filteredProducts.length} {t.catalog.results}
                {normalizedQuery ? (
                  <span className="ml-2 text-[var(--brand-blue)]">
                    “{searchQuery.trim()}”
                  </span>
                ) : null}
              </p>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                {t.catalog.sort}
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[var(--brand-cyan)]">
                  <option value="relevance">{filterLabels.relevance}</option>
                  <option value="price-asc">{filterLabels.priceAsc}</option>
                  <option value="price-desc">{filterLabels.priceDesc}</option>
                  <option value="name">{filterLabels.name}</option>
                </select>
              </label>
            </div>
            {filteredProducts.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} locale={locale} />
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700">
                  <span>
                    {pageLabels.page} {safePage}
                  </span>
                  <div className="flex items-center gap-2">
                    {safePage > 1 ? (
                      <Link
                        href={buildPageUrl(safePage - 1)}
                        className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]"
                      >
                        {pageLabels.previous}
                      </Link>
                    ) : (
                      <span className="rounded-full border border-slate-100 px-4 py-2 text-slate-300">{pageLabels.previous}</span>
                    )}
                    {hasNextPage ? (
                      <Link
                        href={buildPageUrl(safePage + 1)}
                        className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-blue)]"
                      >
                        {pageLabels.next}
                      </Link>
                    ) : (
                      <span className="rounded-full border border-slate-100 px-4 py-2 text-slate-300">{pageLabels.next}</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
                {emptyMessage}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
