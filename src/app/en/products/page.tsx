import { CatalogPage } from "@/components/catalog-page";
import { getActiveProducts, getCatalogFilterOptions } from "@/lib/data/products";

export const dynamic = "force-dynamic";

type EnglishProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    brand?: string;
    price?: string;
  }>;
};

export default async function EnglishProductsPage({
  searchParams,
}: EnglishProductsPageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page || "1", 10);
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const { products, hasNextPage } = await getActiveProducts(params.q || "", safePage, 48, {
    category: params.category,
    brand: params.brand,
    price: params.price,
  });
  const filterOptions = await getCatalogFilterOptions(params.q || "", {
    category: params.category,
  });

  return (
    <CatalogPage
      locale="en"
      searchQuery={params.q}
      products={products}
      page={safePage}
      hasNextPage={hasNextPage}
      filterOptions={filterOptions}
      categoryFilterParam={params.category}
      brandFilterParam={params.brand}
      priceFilterParam={params.price}
    />
  );
}
