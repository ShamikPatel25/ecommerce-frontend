import ProductDetailClient from '@/components/storefront/ProductDetailClient';

export const metadata = {
  title: 'Product Details',
  description: 'View product details, select variants, and add to cart.',
};

export default async function ProductPage({ params }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} initialVariantSku={null} />;
}
