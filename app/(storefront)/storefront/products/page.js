import ProductsListClient from '@/components/storefront/ProductsListClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Products',
  description: 'Browse our collection of premium, handcrafted goods. Filter by category, search, and sort to find exactly what you need.',
  openGraph: {
    title: 'All Products | Store',
    description: 'Browse our collection of premium products.',
    type: 'website',
  },
};

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ProductsListClient />
    </Suspense>
  );
}
