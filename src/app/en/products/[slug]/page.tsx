import { ProductDetailPage, ProductNotFoundPage } from "@/components/product-detail-page";
import { getActiveProductBySlug } from "@/lib/data/products";

type EnglishProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EnglishProductPage({ params }: EnglishProductPageProps) {
  const { slug } = await params;
  const product = await getActiveProductBySlug(slug);

  if (!product) {
    return <ProductNotFoundPage locale="en" />;
  }

  return <ProductDetailPage product={product} locale="en" />;
}
