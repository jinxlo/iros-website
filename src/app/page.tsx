import { HomePage } from "@/components/home-page";
import { getHomepageProducts } from "@/lib/data/home-products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialProducts = await getHomepageProducts(32);
  return <HomePage locale="es" initialProducts={initialProducts} />;
}
