'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { ProductCard } from '@/components/storefront/shared/ProductCard';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal, Grid3X3, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductsListClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { href } = useStorefrontPath();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [gridSize, setGridSize] = useState(4);

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

  /* eslint-disable react-hooks/set-state-in-effect -- data fetch on filter change */
  useEffect(() => {
    setLoading(true);
    const params = { sort: currentSort, page: currentPage };
    if (currentCategory) params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;

    Promise.all([
      storefrontAPI.getProducts(params),
      storefrontAPI.getCategories(),
    ])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data?.results || productsRes.data || []);
        setTotalCount(productsRes.data?.count || 0);
        setCategories(categoriesRes.data || []);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [currentCategory, currentSearch, currentSort, currentPage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalPages = Math.ceil(totalCount / 20);
  const categoryName = categories.find(c => c.slug === currentCategory)?.name;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-muted/50 to-background border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-medium">
              <button onClick={() => router.push(href('/'))} className="hover:text-primary transition-colors">Home</button>
              <span className="opacity-50">/</span>
              <span className="text-foreground">Products</span>
              {categoryName && (
                <>
                  <span className="opacity-50">/</span>
                  <span className="text-foreground">{categoryName}</span>
                </>
              )}
            </nav>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
              {categoryName || (currentSearch ? `Results for "${currentSearch}"` : 'All Products')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {totalCount > 0 ? `${totalCount} products found` : 'Explore our collection of quality products.'}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  defaultValue={currentSearch}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter') updateParams({ search: e.target.value || null }); }}
                />
              </div>

              {categories.length > 0 && (
                <div className="bg-background border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Categories
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => updateParams({ category: null })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!currentCategory ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      All Products
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateParams({ category: cat.slug })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentCategory === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-background border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm text-foreground mb-3">Sort By</h3>
                <select
                  value={currentSort}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {(currentCategory || currentSearch) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {currentCategory && (
                  <button
                    onClick={() => updateParams({ category: null })}
                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    {categoryName || currentCategory}
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {currentSearch && (
                  <button
                    onClick={() => updateParams({ search: null })}
                    className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    "{currentSearch}"
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => updateParams({ category: null, search: null })}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-2"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="hidden md:flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {products.length} of {totalCount} products
              </p>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                <button
                  onClick={() => setGridSize(3)}
                  className={`p-2 rounded-md transition-colors ${gridSize === 3 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridSize(4)}
                  className={`p-2 rounded-md transition-colors ${gridSize === 4 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridSize === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={`skel-${i}`} className="bg-background border border-border rounded-2xl overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                      <div className="h-5 bg-muted animate-pulse rounded w-1/4 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-20 px-4 border border-dashed border-border rounded-2xl bg-muted/20">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">No products found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  We couldn&apos;t find any products matching your criteria. Try adjusting your filters.
                </p>
                <Button onClick={() => updateParams({ category: null, search: null })} className="rounded-full">
                  Clear All Filters
                </Button>
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridSize === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} href={href} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-border">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateParams({ page: (currentPage - 1).toString() })}
                      disabled={currentPage === 1}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((page, idx, arr) => (
                        <span key={page} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="text-muted-foreground px-2">&hellip;</span>
                          )}
                          <Button
                            variant={page === currentPage ? "default" : "outline"}
                            onClick={() => updateParams({ page: page.toString() })}
                            className="w-10 h-10 p-0 rounded-full font-semibold"
                          >
                            {page}
                          </Button>
                        </span>
                      ))}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateParams({ page: (currentPage + 1).toString() })}
                      disabled={currentPage === totalPages}
                      className="rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
