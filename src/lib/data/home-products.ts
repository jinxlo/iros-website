import { unstable_cache } from "next/cache";
import { fetchPrivateApi } from "@/lib/private-api/client";
import {
  getHomepageProductsFromPostgres,
  type HomepageProduct,
} from "@/lib/postgres/catalog";

async function getHomepageProductsFromBackend(limit: number) {
  const payload = await fetchPrivateApi<{ products: HomepageProduct[] }>(`/api/products/home?limit=${limit}`);

  return payload?.products ?? getHomepageProductsFromPostgres(limit);
}

const getHomepageProductsCached = unstable_cache(
  async (limit: number) => getHomepageProductsFromBackend(limit),
  ["home-products"],
  { revalidate: 60, tags: ["products", "home-products"] },
);

export type { HomepageProduct };

export async function getHomepageProducts(limit = 32) {
  return getHomepageProductsCached(limit);
}
