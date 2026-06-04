import { HomePage } from "@/components/home-page";
import { getHomepageProducts } from "@/lib/data/home-products";

export default async function Home() {
  const initialProducts = await getHomepageProducts(32);
  return <HomePage locale="es" initialProducts={initialProducts} />;
}
