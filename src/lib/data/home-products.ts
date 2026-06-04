import { unstable_cache } from "next/cache";
import {
  getHomepageProductsFromPostgres,
  type HomepageProduct,
} from "@/lib/postgres/catalog";

const getHomepageProductsCached = unstable_cache(
  async (limit: number) => getHomepageProductsFromPostgres(limit),
  ["home-products"],
  { revalidate: 60, tags: ["products", "home-products"] },
);

export type { HomepageProduct };

export async function getHomepageProducts(limit = 32) {
  return getHomepageProductsCached(limit);
}
