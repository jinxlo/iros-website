import { unstable_cache } from "next/cache";
import type { Product } from "@/lib/content";
import {
  getActiveProductBySlugFromPostgres,
  getActiveProductsFromPostgres,
  getCatalogFilterOptionsFromPostgres,
  type CatalogFilters,
  type ProductCatalogFilterOptions,
  type ProductsCatalogResult,
} from "@/lib/postgres/catalog";

export type { CatalogFilters, ProductCatalogFilterOptions, ProductsCatalogResult };

const getActiveProductsCached = unstable_cache(
  async (
    searchQuery: string,
    page: number,
    pageSize: number,
    category: string,
    brand: string,
    price: string,
  ) => getActiveProductsFromPostgres(searchQuery, page, pageSize, { category, brand, price }),
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
    getCatalogFilterOptionsFromPostgres(searchQuery, { category }),
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
  const product = await getActiveProductBySlugFromPostgres(slug);

  return product || undefined;
}
