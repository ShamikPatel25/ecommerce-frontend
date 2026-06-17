'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { productAPI, isCancelledError } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, MoreHorizontal, Trash2, Eye, EyeOff, Star, SlidersHorizontal, Pencil, X } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import DataError from '@/components/dashboard/DataError';
import { formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useSharedDataStore } from '@/store/sharedDataStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function ProductsPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();
  const invalidateDashboard = useDashboardStore((s) => s.invalidate);
  const { fetchCategories, categories, invalidateProducts: invalidateSharedProducts } = useSharedDataStore();
  const [products, setProducts] = useState([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 10;
  const [totalItems, setTotalItems] = useState(0);
  const activeFilter = searchParams.get('filter') || 'all';

  const setCurrentPage = (val) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setPerPage = (val) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('perPage', val);
    params.set('page', 1);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setActiveFilter = (val) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', val);
    params.set('page', 1);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('pointerdown', handleClick);
    return () => {
      document.removeEventListener('pointerdown', handleClick);
    };
  }, [filterOpen]);
  

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = { page: currentPage, perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeFilter === 'active') params.is_active = 'true';
      if (activeFilter === 'inactive') params.is_active = 'false';
      if (activeFilter === 'featured') params.is_featured = 'true';
      if (activeFilter === 'low_stock') params.stock_status = 'low_stock';

      const prodRes = await productAPI.list(params).catch(() => ({ data: [] }));
      if (prodRes.data?.results) {
        setProducts(prodRes.data.results);
        setTotalItems(prodRes.data.count || 0);
      } else {
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setTotalItems(Array.isArray(prodRes.data) ? prodRes.data.length : 0);
      }
    } catch (err) {
      if (!isCancelledError(err)) {
        setError(true);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [currentPage, perPage, searchQuery, activeFilter]);

  const fetchData = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const params = { page: currentPage, perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeFilter === 'active') params.is_active = 'true';
      if (activeFilter === 'inactive') params.is_active = 'false';
      if (activeFilter === 'featured') params.is_featured = 'true';
      if (activeFilter === 'low_stock') params.stock_status = 'low_stock';

      const [prodRes] = await Promise.all([
        productAPI.list(params).catch(() => ({ data: [] })),
        fetchCategories(),
      ]);
      if (prodRes.data?.results) {
        setProducts(prodRes.data.results);
        setTotalItems(prodRes.data.count || 0);
      } else {
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setTotalItems(Array.isArray(prodRes.data) ? prodRes.data.length : 0);
      }
    } catch (err) {
      if (!isCancelledError(err)) {
        setError(true);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetchCategories, currentPage, perPage, searchQuery, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [currentPage, perPage, searchQuery, activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    try {
      await productAPI.delete(deleteModal.product.id);
      toast.success('Product deleted!');
      setDeleteModal({ open: false, product: null });
      invalidateDashboard(activeStore?.id);
      invalidateSharedProducts();
      fetchProducts(); // categories unchanged
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await productAPI.toggleActive(product.id);
      toast.success(product.is_active ? 'Product and its variants deactivated' : 'Product and its variants activated');
      invalidateDashboard(activeStore?.id);
      invalidateSharedProducts();
      fetchProducts(); // categories unchanged
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Failed to update product status';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (detail?.is_active) {
        msg = Array.isArray(detail.is_active) ? detail.is_active[0] : detail.is_active;
      } else if (detail?.detail) {
        msg = detail.detail;
      }
      toast.error(msg);
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.name || '';
  };

  const getTotalStock = (product) => {
    if (product.product_type === 'catalog') {
      const variants = product.variants || [];
      if (variants.length === 0) return 0;
      return variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    }
    return product.stock ?? 0;
  };

  const getTotalReserved = (product) => {
    if (product.product_type === 'catalog') {
      const variants = product.variants || [];
      if (variants.length === 0) return 0;
      return variants.reduce((sum, v) => sum + (v.reserved ?? 0), 0);
    }
    return product.reserved ?? 0;
  };

  const getVariantCount = (product) => {
    if (product.product_type === 'catalog') {
      return product.variants?.length || 0;
    }
    return 0;
  };

  // Filter + search
  const lowerQuery = searchQuery.toLowerCase().trim();

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
  const paginatedProducts = products;

  const getStockColor = (stock) => {
    if (stock <= 15) return 'bg-red-500';
    if (stock <= 30) return 'bg-violet-400';
    return 'bg-violet-500';
  };

  const getStockTextColor = (stock) => {
    if (stock <= 15) return 'text-red-500';
    return 'text-slate-700 dark:text-gray-300';
  };

  const getStockPercent = (stock) => Math.min((stock / 150) * 100, 100);

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'featured', label: 'Featured' },
    { key: 'low_stock', label: 'Low Stock' },
  ];

  const handleCreate = () => {
    sessionStorage.removeItem('form-draft:product-create');
    sessionStorage.removeItem('form-draft:product-create-selattr');
    sessionStorage.removeItem('form-draft:product-create-step');
    sessionStorage.removeItem('form-draft:product-create-combos');
    sessionStorage.removeItem('form-draft:product-create-combosel');
    router.push('/products/create');
  };

  return (
    <div className="admin-page h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="admin-container flex-1 flex flex-col min-h-0">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Products</h2>
            <p className="admin-subtitle">Manage your catalog, stock levels, and pricing.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            {/* Search Bar */}
            <div className="admin-search-wrapper !mb-0 w-full sm:w-96" ref={filterRef}>
              <div className="admin-search-box !h-11">
                <div className="admin-search-icon">
                  <Search size={20} />
                </div>
                <input
                  className="admin-search-input"
                  placeholder="Search products by name or SKU"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="flex items-center justify-center px-3 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                )}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={activeFilter !== 'all' ? 'admin-filter-toggle-active' : 'admin-filter-toggle'}
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>

              {filterOpen && (
                <div className="admin-filters-mobile">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveFilter(tab.key); setFilterOpen(false); }}
                      className={activeFilter === tab.key ? 'admin-filter-mobile-item-active' : 'admin-filter-mobile-item'}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCreate}
              className="admin-btn-primary"
            >
              <Plus size={20} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="admin-filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={activeFilter === tab.key ? 'admin-filter-btn-active' : 'admin-filter-btn'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DataTable Container */}
        <div className="admin-table-card flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
            </div>
          ) : error ? (
            <DataError message="Failed to load products" onRetry={fetchData} retrying={loading} />
          ) : (
            <>
              <div className="overflow-auto flex-1 h-0">
                <div className="min-w-full"><table className="admin-table table-fixed min-w-[950px] w-full">
                  <thead>
                    <tr className="admin-thead-row">
                      <th className="admin-th w-[30%] text-left">Product</th>
                      <th className="admin-th w-[15%] text-left">SKU</th>
                      <th className="admin-th w-[15%]">Stock Level</th>
                      <th className="admin-th w-[15%]">Catalog</th>
                      <th className="admin-th w-[15%] text-left">Price</th>
                      <th className="admin-th w-[10%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-tbody">
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-empty">
                          <div className="admin-empty-text">
                            <p className="text-4xl mb-3">📦</p>
                            <p className="text-sm font-medium">No products found</p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or add a new product.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((product) => {
                        const stock = getTotalStock(product);
                        const reserved = getTotalReserved(product);
                        const variantCount = getVariantCount(product);
                        const thumbItem = product.media?.find(m => m.is_thumbnail) || product.media?.[0];
                        const mediaUrl = thumbItem?.file_url || thumbItem?.file;

                        return (
                          <tr
                            key={product.id}
                            className={`admin-tr group ${product.is_active ? '' : 'opacity-60'}`}
                            onClick={() => router.push(`/products/${product.id}/edit`)}
                          >
                            {/* Product */}
                            <td className="admin-td text-left">
                              <div className="flex items-center justify-start gap-3 w-full min-w-0">
                                <div className="size-10 rounded-lg bg-slate-100 dark:bg-gray-700 overflow-hidden border border-slate-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                                  {mediaUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={mediaUrl}
                                      alt={product.name}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <span className="text-lg">
                                      {product.product_type === 'catalog' ? '📚' : '📦'}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-start gap-2 max-w-full">
                                    <p
                                      className={`text-sm font-medium text-left truncate max-w-[200px] lg:max-w-[300px] block ${product.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'}`}
                                      title={product.name}
                                    >
                                      {product.name}
                                    </p>
                                    {product.is_featured && (
                                      <Star className="w-3.5 h-3.5 text-violet-500 fill-violet-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p
                                    className="text-slate-500 dark:text-gray-400 text-left text-xs truncate max-w-[150px] lg:max-w-[250px] block mt-0.5"
                                    title={getCategoryName(product.category)}
                                  >
                                    {getCategoryName(product.category)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="admin-td text-left">
                              <span
                                className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-600 dark:text-gray-300 truncate max-w-full inline-block align-bottom"
                                title={product.sku}
                              >
                                {product.sku}
                              </span>
                            </td>

                            {/* Stock Level */}
                            <td className="admin-td">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full ${getStockColor(stock)} rounded-full transition-all`}
                                    style={{ width: `${getStockPercent(stock)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${getStockTextColor(stock)}`}>{stock}</span>
                              </div>
                              {reserved > 0 && (
                                <p className="text-[11px] font-semibold text-violet-500 mt-1 text-center">{reserved} reserved</p>
                              )}
                            </td>


                            {/* Catalog */}
                            <td className="admin-td">
                              {variantCount > 0 ? (
                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20 text-xs font-bold">
                                  {variantCount}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-gray-500 text-xs">—</span>
                              )}
                            </td>

                            {/* Price */}
                            <td className="admin-td text-left">
                              <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {formatCurrency(product.price, activeStore?.currency)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="admin-td text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 transition-all"
                                >
                                  <MoreHorizontal size={18} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={8} className="w-44 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 p-1.5 bg-white dark:bg-gray-800 z-[100]">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/products/${product.id}/edit`);
                                    }}
                                    className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                  >
                                    <Pencil size={16} className="text-slate-400 dark:text-gray-500" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleActive(product);
                                    }}
                                    className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                  >
                                    {product.is_active ? <EyeOff size={16} className="text-slate-400 dark:text-gray-500" /> : <Eye size={16} className="text-slate-400 dark:text-gray-500" />}
                                    <span>{product.is_active ? 'Deactivate' : 'Activate'}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteModal({ open: true, product });
                                    }}
                                    className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table></div>
              </div>

              {/* Table Footer / Pagination */}
              {products.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  perPage={perPage}
                  itemLabel="products"
                  onPerPageChange={setPerPage} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        title="Delete Product?"
        itemName={deleteModal.product?.name || ''}
        description="This action cannot be undone and will permanently remove this product from your store."
        confirmLabel="Delete Product"
        onCancel={() => setDeleteModal({ open: false, product: null })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
