'use client';

import { useParams } from 'next/navigation';
import ProductDetailClient from '@/components/storefront/ProductDetailClient';

export default function ProductPage() {
  const { slug, sku } = useParams();
  if (!slug) return null;
  return <ProductDetailClient slug={slug} initialVariantSku={sku || null} />;
}
