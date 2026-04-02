'use client';

import { useParams } from 'next/navigation';
import ProductDetailClient from '@/components/storefront/ProductDetailClient';

export default function ProductPage() {
  const routeParams = useParams();
  // catch-all: routeParams.params is an array like ['polo-tshirt'] or ['polo-tshirt', 'POLO_TSHIRT-Red-36']
  const segments = routeParams.params || [];
  const slug = segments[0];
  const variantSku = segments[1] || null;

  if (!slug) return null;

  return <ProductDetailClient slug={slug} initialVariantSku={variantSku} />;
}
