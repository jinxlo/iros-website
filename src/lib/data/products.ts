import { unstable_cache } from "next/cache";
import type { Product } from "@/lib/content";
import { fetchPrivateApi } from "@/lib/private-api/client";
import {
  getActiveProductBySlugFromPostgres,
  getActiveProductsFromPostgres,
  getCatalogFilterOptionsFromPostgres,
  type CatalogFilters,
  type ProductCatalogFilterOptions,
  type ProductsCatalogResult,
} from "@/lib/postgres/catalog";

export type { CatalogFilters, ProductCatalogFilterOptions, ProductsCatalogResult };

function catalogSearchParams(searchQuery: string, page: number, pageSize: number, filters: CatalogFilters) {
  const params = new URLSearchParams();

  if (searchQuery) params.set("q", searchQuery);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.price) params.set("price", filters.price);

  return params;
}

async function getActiveProductsFromBackend(searchQuery: string, page: number, pageSize: number, filters: CatalogFilters) {
  const payload = await fetchPrivateApi<ProductsCatalogResult>(`/api/products?${catalogSearchParams(searchQuery, page, pageSize, filters)}`);

  return payload ?? getActiveProductsFromPostgres(searchQuery, page, pageSize, filters);
}

async function getCatalogFilterOptionsFromBackend(searchQuery: string, filters: Pick<CatalogFilters, "category">) {
  const params = new URLSearchParams();

  if (searchQuery) params.set("q", searchQuery);
  if (filters.category) params.set("category", filters.category);

  const payload = await fetchPrivateApi<ProductCatalogFilterOptions>(`/api/products/filters?${params}`);

  return payload ?? getCatalogFilterOptionsFromPostgres(searchQuery, filters);
}

async function getActiveProductBySlugFromBackend(slug: string) {
  const payload = await fetchPrivateApi<{ product: Product | null }>(`/api/products/${encodeURIComponent(slug)}`);

  if (payload) {
    return payload.product || undefined;
  }

  return getActiveProductBySlugFromPostgres(slug);
}

const getActiveProductsCached = unstable_cache(
  async (
    searchQuery: string,
    page: number,
    pageSize: number,
    category: string,
    brand: string,
    price: string,
  ) => getActiveProductsFromBackend(searchQuery, page, pageSize, { category, brand, price }),
  ["active-products-catalog"],
  {
    revalidate: 120,
    tags: ["products"],
  },
);

export async function getActiveProducts(searchQuery = "", page = 1, pageSize = 48, filters: CatalogFilters = {}) {
  return getActiveProductsCached(
    searchQuery.trim(),
    page,
    pageSize,
    (filters.category || "").trim(),
    (filters.brand || "").trim(),
    (filters.price || "").trim(),
  );
}

const getCatalogFilterOptionsCached = unstable_cache(
  async (searchQuery: string, category: string): Promise<ProductCatalogFilterOptions> =>
    getCatalogFilterOptionsFromBackend(searchQuery, { category }),
  ["catalog-filter-options"],
  {
    revalidate: 120,
    tags: ["products", "catalog-filter-options"],
  },
);

export async function getCatalogFilterOptions(searchQuery = "", filters: Pick<CatalogFilters, "category"> = {}) {
  return getCatalogFilterOptionsCached(searchQuery.trim(), (filters.category || "").trim());
}

export async function getActiveProductBySlug(slug: string): Promise<Product | undefined> {
  const product = await getActiveProductBySlugFromBackend(slug);

  return product || undefined;
}
