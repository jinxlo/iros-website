import { ProductDetailPage, ProductNotFoundPage } from "@/components/product-detail-page";
import { getActiveProductBySlug } from "@/lib/data/products";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getActiveProductBySlug(slug);

  if (!product) {
    return <ProductNotFoundPage locale="es" />;
  }

  return <ProductDetailPage product={product} locale="es" />;
}
