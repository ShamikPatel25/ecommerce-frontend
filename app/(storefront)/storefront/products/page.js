'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { storefrontAPI } from '@/lib/storefrontApi';
import { Search, SlidersHorizontal, ChevronDown, X, ArrowRight, Heart, Eye, ShoppingBag } from 'lucide-react';
import {
  ScrollReveal, StaggerContainer, StaggerItem, TiltCard, PageTransition, TextReveal,
} from '@/components/storefront/animations';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const updateParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    if (updates.category !== undefined || updates.search !== undefined || updates.sort !== undefined) {
      params.delete('page');
    }
    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  useEffect(() => {
    storefrontAPI.getCategories().then((res) => setCategories(res.data || [])).catch(() => { });
  }, []);

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
    <PageTransition>
      <div className="pt-24 md:pt-28">
        {/* ─── Page Header with animated background ─── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-orange-50/30 border-b border-gray-100">
          <motion.div
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-100/40 to-transparent rounded-full blur-[100px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-100/30 to-transparent rounded-full blur-[80px]"
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <motion.span
              className="inline-block text-orange-500 font-bold text-xs uppercase tracking-[0.2em] mb-4"
              initial={{ opacity: 0, letterSpacing: '0.5em' }}
              animate={{ opacity: 1, letterSpacing: '0.2em' }}
              transition={{ duration: 0.8 }}
            >
              Collection
            </motion.span>
            <TextReveal>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                {currentCategory
                  ? <>{currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1).replace(/-/g, ' ')}</>
                  : <>All <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Products</span></>}
              </h1>
            </TextReveal>
            {totalCount > 0 && (
              <motion.p
                className="mt-3 text-gray-500 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {totalCount} product{totalCount !== 1 ? 's' : ''} found
              </motion.p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* ─── Toolbar ─── */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search products..."
                  defaultValue={currentSearch}
                  onKeyDown={(e) => { if (e.key === 'Enter') updateParams({ search: e.target.value || null }); }}
                  className="pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 w-48 md:w-80 bg-white/80 backdrop-blur-sm transition-all hover:border-gray-300"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={currentSort}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="appearance-none pl-4 pr-10 py-3 text-sm rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white/80 backdrop-blur-sm cursor-pointer hover:border-gray-300 transition-all font-medium"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Mobile filter toggle */}
              <motion.button
                onClick={() => setFilterOpen(!filterOpen)}
                className="md:hidden p-3 rounded-2xl border border-gray-200 text-gray-600 bg-white/80 backdrop-blur-sm hover:border-gray-300 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Active filters */}
          <AnimatePresence>
            {(currentCategory || currentSearch) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2 mb-8"
              >
                {currentCategory && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-bold px-4 py-2.5 rounded-full border border-orange-100"
                  >
                    {currentCategory}
                    <button onClick={() => updateParams({ category: null })} className="hover:bg-orange-100 rounded-full p-0.5 transition-colors ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                {currentSearch && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-bold px-4 py-2.5 rounded-full border border-orange-100"
                  >
                    &ldquo;{currentSearch}&rdquo;
                    <button onClick={() => updateParams({ search: null })} className="hover:bg-orange-100 rounded-full p-0.5 transition-colors ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-8">
            {/* ─── Category Sidebar ─── */}
            <aside className={`${filterOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
              <div className="sticky top-28">
                <h3 className="font-black text-gray-900 mb-5 text-xs uppercase tracking-[0.15em]">Categories</h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => updateParams({ category: null })}
                    className={`group flex items-center gap-3 w-full text-left text-sm px-4 py-3.5 rounded-2xl transition-all duration-300 ${!currentCategory
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/20'
                        : 'text-gray-600 hover:bg-gray-50 font-medium'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${!currentCategory ? 'bg-white' : 'bg-gray-300 group-hover:bg-orange-400'} transition-colors`} />
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <button
                        onClick={() => updateParams({ category: cat.slug })}
                        className={`group flex items-center gap-3 w-full text-left text-sm px-4 py-3.5 rounded-2xl transition-all duration-300 ${currentCategory === cat.slug
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/20'
                            : 'text-gray-600 hover:bg-gray-50 font-medium'
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${currentCategory === cat.slug ? 'bg-white' : 'bg-gray-300 group-hover:bg-orange-400'} transition-colors`} />
                        {cat.name}
                      </button>
                      {cat.children?.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => updateParams({ category: child.slug })}
                          className={`group flex items-center gap-3 w-full text-left text-sm px-4 py-3 pl-8 rounded-2xl transition-all duration-300 ${currentCategory === child.slug
                              ? 'bg-orange-50 text-orange-700 font-bold'
                              : 'text-gray-500 hover:bg-gray-50 font-medium'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${currentCategory === child.slug ? 'bg-orange-500' : 'bg-gray-300'}`} />
                          {child.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ─── Product Grid ─── */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                        <div className="h-5 bg-gray-100 rounded-full w-1/4 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <motion.div
                  className="text-center py-24"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <motion.div
                    className="w-28 h-28 mx-auto rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-6"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Search className="w-12 h-12 text-gray-300" />
                  </motion.div>
                  <p className="text-gray-900 font-black text-xl">No products found</p>
                  <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">Try adjusting your filters or search query to find what you&apos;re looking for.</p>
                  <button
                    onClick={() => { updateParams({ category: null, search: null }); }}
                    className="mt-6 inline-flex items-center gap-2 text-orange-600 font-bold text-sm hover:text-orange-700 bg-orange-50 px-6 py-3 rounded-full"
                  >
                    Clear all filters <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <>
                  <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" staggerDelay={0.05}>
                    {products.map((product) => (
                      <StaggerItem key={product.id}>
                        <ProductCard product={product} />
                      </StaggerItem>
                    ))}
                  </StaggerContainer>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-14">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((page, idx, arr) => (
                          <span key={page} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-gray-400 px-2">...</span>}
                            <motion.button
                              onClick={() => updateParams({ page: page.toString() })}
                              className={`w-11 h-11 rounded-2xl text-sm font-bold transition-all ${page === currentPage
                                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/20'
                                  : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {page}
                            </motion.button>
                          </span>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

/* ─── Product Card ─── */
function ProductCard({ product }) {
  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price);
  const discount = hasDiscount
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compare_at_price)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <TiltCard className="group cursor-pointer" intensity={8}>
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 hover:border-orange-200/50 transition-all duration-500 hover:shadow-[0_30px_80px_rgba(249,115,22,0.08)]">
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {product.thumbnail ? (
              <motion.img
                src={product.thumbnail}
                alt={product.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-gray-200/50 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
              </div>
            )}
            {hasDiscount && (
              <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/25">
                -{discount}%
              </span>
            )}
            {(product.total_stock ?? product.stock) <= 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[3px] flex items-center justify-center">
                <span className="bg-gray-900 text-white text-xs font-bold px-5 py-2 rounded-full">Sold Out</span>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <motion.div
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </motion.div>
              <motion.div
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
              >
                <Heart className="w-4 h-4 text-gray-700" />
              </motion.div>
            </div>
          </div>
          <div className="p-4 md:p-5">
            {product.category_name && (
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-2">{product.category_name}</p>
            )}
            <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">{product.name}</h3>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">${parseFloat(product.price).toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through font-medium">${parseFloat(product.compare_at_price).toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-full border-2 border-orange-500/30 border-t-orange-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-pink-500/30 border-b-pink-500"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
