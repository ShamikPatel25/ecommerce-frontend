'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { ProductCard } from '@/components/storefront/shared/ProductCard';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { href } = useStorefrontPath();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);

  const updateParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    if (updates.category !== undefined || updates.search !== undefined || updates.sort !== undefined) {
      params.delete('page');
    }
    router.push(href(`/products?${params.toString()}`));
  }, [searchParams, router, href]);

  useEffect(() => {
    setLoading(true);
    const params = { sort: currentSort, page: currentPage };
    if (currentCategory) params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;

    storefrontAPI.getProducts(params)
      .then((res) => {
        setProducts(res.data?.results || res.data || []);
        setTotalCount(res.data?.count || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [currentCategory, currentSearch, currentSort, currentPage]);

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      
      {/* Header & Breadcrumbs */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          {currentCategory ? currentCategory : currentSearch ? `Search: "${currentSearch}"` : "All Products"}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Explore our collection of premium, handcrafted goods built for the modern professional.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8 pb-8 border-b border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            defaultValue={currentSearch}
            className="w-full bg-muted/50 border border-border rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            onKeyDown={(e) => { if (e.key === 'Enter') updateParams({ search: e.target.value || null }); }}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by</label>
          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="w-full md:w-auto bg-muted/50 border border-border rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Active filters */}
      {(currentCategory || currentSearch) && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-sm text-muted-foreground mr-2">Active Filters:</span>
          {currentCategory && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-primary/20">
              {currentCategory}
              <button onClick={() => updateParams({ category: null })} className="hover:text-primary/70"><X className="w-4 h-4" /></button>
            </div>
          )}
          {currentSearch && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-primary/20">
              "{currentSearch}"
              <button onClick={() => updateParams({ search: null })} className="hover:text-primary/70"><X className="w-4 h-4" /></button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => updateParams({ category: null, search: null })} className="h-8 ml-2 text-muted-foreground">
            Clear all
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`skel-${i}`} className="bg-card border border-border rounded-2xl p-4 overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse rounded-xl mb-4" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2 mb-4" />
              <div className="h-5 bg-muted animate-pulse rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-24 px-4 border border-dashed border-border rounded-2xl bg-card">
          <Search className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
          <h3 className="text-2xl font-bold mb-3">No products found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Try adjusting your filters or search query to find what you're looking for, or browse our newest arrivals.
          </p>
          <Button onClick={() => updateParams({ category: null, search: null })} size="lg" className="rounded-full">
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} href={href} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-16 pt-8 border-t border-border">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <span key={page} className="flex items-center gap-2">
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-muted-foreground px-2">&hellip;</span>}
                    <Button
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => updateParams({ page: page.toString() })}
                      className={`w-10 h-10 p-0 rounded-full font-bold ${page === currentPage ? '' : 'hover:bg-muted'}`}
                    >
                      {page}
                    </Button>
                  </span>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
