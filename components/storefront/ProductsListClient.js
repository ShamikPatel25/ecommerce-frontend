'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { ProductCard } from '@/components/storefront/shared/ProductCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal, Layers, IndianRupee, Percent, ArrowUpDown } from 'lucide-react';

const PRICE_RANGES = [
  { label: 'Below ₹500', min: 0, max: 500 },
  { label: '₹501 - ₹1,000', min: 501, max: 1000 },
  { label: '₹1,001 - ₹1,500', min: 1001, max: 1500 },
  { label: '₹1,501 - ₹2,000', min: 1501, max: 2000 },
  { label: 'Above ₹2,000', min: 2001, max: null },
];

const DISCOUNT_THRESHOLDS = [10, 20, 30, 40, 50];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name: A to Z', value: 'name_asc' },
  { label: 'Name: Z to A', value: 'name_desc' },
];

export default function ProductsListClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { href } = useStorefrontPath();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCounts, setFilterCounts] = useState({ discount: {}, price: {} });
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';
  const currentMinDiscount = searchParams.get('min_discount') || '';

  const updateParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    if (updates.category !== undefined || updates.search !== undefined ||
        updates.sort !== undefined || updates.min_price !== undefined ||
        updates.max_price !== undefined || updates.min_discount !== undefined) {
      params.delete('page');
    }
    router.push(href(`/products?${params.toString()}`));
  }, [searchParams, router, href]);

  const clearAllFilters = useCallback(() => {
    updateParams({
      category: null,
      search: null,
      min_price: null,
      max_price: null,
      min_discount: null,
      sort: null,
    });
  }, [updateParams]);

  /* eslint-disable react-hooks/set-state-in-effect -- data fetch on filter change */
  useEffect(() => {
    setLoading(true);
    const params = { sort: currentSort, page: currentPage };
    if (currentCategory) params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;
    if (currentMinPrice) params.min_price = currentMinPrice;
    if (currentMaxPrice) params.max_price = currentMaxPrice;
    if (currentMinDiscount) params.min_discount = currentMinDiscount;

    Promise.all([
      storefrontAPI.getProducts(params),
      storefrontAPI.getCategories(),
    ])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data?.results || productsRes.data || []);
        setTotalCount(productsRes.data?.count || 0);
        setFilterCounts(productsRes.data?.filter_counts || { discount: {}, price: {} });
        setCategories(categoriesRes.data || []);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
        setFilterCounts({ discount: {}, price: {} });
      })
      .finally(() => setLoading(false));
  }, [currentCategory, currentSearch, currentSort, currentPage, currentMinPrice, currentMaxPrice, currentMinDiscount]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalPages = Math.ceil(totalCount / 20);

  const hasActiveFilters = currentCategory || currentSearch || currentMinPrice || currentMaxPrice || currentMinDiscount || currentSort !== 'newest';

  const getPriceRangeLabel = () => {
    if (!currentMinPrice && !currentMaxPrice) return null;
    const range = PRICE_RANGES.find(r =>
      String(r.min) === currentMinPrice &&
      (r.max === null ? !currentMaxPrice : String(r.max) === currentMaxPrice)
    );
    return range?.label || `₹${currentMinPrice}${currentMaxPrice ? ` - ₹${currentMaxPrice}` : '+'}`;
  };

  const getSortLabel = () => {
    const sort = SORT_OPTIONS.find(s => s.value === currentSort);
    return sort?.label || 'Newest';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col">
          {/* Search bar and Filter button */}
          <div className="w-full max-w-3xl mx-auto mb-6">
            <div className="flex gap-3 items-center">
              {/* Search input */}
              <div className="flex-1 flex rounded-full overflow-hidden border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                <input
                  type="text"
                  placeholder="Search products..."
                  defaultValue={currentSearch}
                  className="flex-1 bg-background px-4 py-3 text-sm focus:outline-none min-w-0"
                  onKeyDown={(e) => { if (e.key === 'Enter') updateParams({ search: e.target.value || null }); }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    updateParams({ search: input.value || null });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 rounded-full px-4 h-[46px] border border-border bg-background text-sm font-medium hover:bg-muted transition-colors">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Clear All */}
                  <DropdownMenuItem onClick={clearAllFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Category Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Layers className="w-4 h-4 mr-2" />
                      Category
                      {currentCategory && <span className="ml-auto text-xs text-primary">•</span>}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={currentCategory} onValueChange={(val) => updateParams({ category: val || null })}>
                        <DropdownMenuRadioItem value="">All Categories</DropdownMenuRadioItem>
                        {categories.map((cat) => (
                          <DropdownMenuRadioItem key={cat.id} value={cat.full_slug || cat.slug}>
                            {cat.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {/* Price Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <IndianRupee className="w-4 h-4 mr-2" />
                      Price
                      {(currentMinPrice || currentMaxPrice) && <span className="ml-auto text-xs text-primary">•</span>}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => updateParams({ min_price: null, max_price: null })}>
                        All Prices
                      </DropdownMenuItem>
                      {PRICE_RANGES.map((range) => {
                        const key = range.max ? `${range.min}-${range.max}` : `${range.min}+`;
                        const count = filterCounts.price?.[key];
                        const isActive = String(range.min) === currentMinPrice &&
                          (range.max === null ? !currentMaxPrice : String(range.max) === currentMaxPrice);
                        return (
                          <DropdownMenuItem
                            key={key}
                            onClick={() => updateParams({
                              min_price: String(range.min),
                              max_price: range.max ? String(range.max) : null
                            })}
                            className={isActive ? 'bg-primary/10 text-primary' : ''}
                          >
                            {range.label}
                            {count > 0 && (
                              <span className="ml-auto text-xs text-muted-foreground">({count})</span>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {/* Discount Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Percent className="w-4 h-4 mr-2" />
                      Discount
                      {currentMinDiscount && <span className="ml-auto text-xs text-primary">•</span>}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => updateParams({ min_discount: null })}>
                        All Discounts
                      </DropdownMenuItem>
                      {DISCOUNT_THRESHOLDS.map((threshold) => {
                        const count = filterCounts.discount?.[String(threshold)];
                        const isActive = currentMinDiscount === String(threshold);
                        if (!count || count === 0) return null;
                        return (
                          <DropdownMenuItem
                            key={threshold}
                            onClick={() => updateParams({ min_discount: String(threshold) })}
                            className={isActive ? 'bg-primary/10 text-primary' : ''}
                          >
                            {threshold}% and above
                            <span className="ml-auto text-xs text-muted-foreground">({count})</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />

                  {/* Sort Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Sort: {getSortLabel()}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={currentSort} onValueChange={(val) => updateParams({ sort: val })}>
                        {SORT_OPTIONS.map((option) => (
                          <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active filters pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6 justify-center">
              {currentCategory && (
                <button
                  onClick={() => updateParams({ category: null })}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {categories.find(c => c.slug === currentCategory)?.name || currentCategory}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {currentSearch && (
                <button
                  onClick={() => updateParams({ search: null })}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  &quot;{currentSearch}&quot;
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {getPriceRangeLabel() && (
                <button
                  onClick={() => updateParams({ min_price: null, max_price: null })}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {getPriceRangeLabel()}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {currentMinDiscount && (
                <button
                  onClick={() => updateParams({ min_discount: null })}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {currentMinDiscount}%+ off
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {currentSort !== 'newest' && (
                <button
                  onClick={() => updateParams({ sort: null })}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {getSortLabel()}
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          <main>
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <h3 className="text-xl font-semibold text-foreground">No products found</h3>
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
