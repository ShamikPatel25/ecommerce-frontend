import ProductDetailClient from '@/components/storefront/ProductDetailClient';

export const metadata = {
  title: 'Product Details',
  description: 'View product details, select variants, and add to cart.',
};

export default async function ProductVariantPage({ params }) {
  const { slug, sku } = await params;
  return <ProductDetailClient slug={slug} initialVariantSku={sku || null} />;
}
