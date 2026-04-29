'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, MoreHorizontal, Trash2, Eye, EyeOff, Star, SlidersHorizontal } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function ProductsPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

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
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productAPI.list().catch(() => ({ data: [] })),
        categoryAPI.list().catch(() => ({ data: [] })),
      ]);

      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.results || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.results || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    try {
      await productAPI.delete(deleteModal.product.id);
      toast.success('Product deleted!');
      setDeleteModal({ open: false, product: null });
      fetchData();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await productAPI.toggleActive(product.id);
      toast.success(product.is_active ? 'Product and its variants deactivated' : 'Product and its variants activated');
      fetchData();
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
  const filteredProducts = useMemo(() => {
    let filtered = products;
    switch (activeFilter) {
      case 'active': filtered = products.filter(p => p.is_active); break;
      case 'inactive': filtered = products.filter(p => !p.is_active); break;
      case 'featured': filtered = products.filter(p => p.is_featured); break;
      case 'low_stock': filtered = products.filter(p => getTotalStock(p) <= 15); break;
    }
    if (lowerQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery)
      );
    }
    return filtered;
  }, [products, activeFilter, lowerQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const getStockColor = (stock) => {
    if (stock <= 15) return 'bg-red-500';
    if (stock <= 30) return 'bg-orange-400';
    return 'bg-orange-500';
  };

  const getStockTextColor = (stock) => {
    if (stock <= 15) return 'text-red-500';
    return 'text-slate-700 dark:text-gray-300';
  };

  const getStockPercent = (stock) => Math.min((stock / 150) * 100, 100);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'featured', label: 'Featured' },
    { key: 'low_stock', label: 'Low Stock' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Products</h2>
            <p className="admin-subtitle">Manage your catalog, stock levels, and pricing.</p>
          </div>
          <button
            onClick={() => router.push('/products/create')}
            className="admin-btn-primary"
          >
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="admin-search-wrapper" ref={filterRef}>
          <div className="admin-search-box">
            <div className="admin-search-icon">
              <Search size={20} />
            </div>
            <input
              className="admin-search-input"
              placeholder="Search products by name, SKU or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
        <div className="admin-table-card">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table min-w-[900px]">
                  <thead>
                    <tr className="admin-thead-row">
                      <th className="admin-th lg:w-[28%]">Product</th>
                      <th className="admin-th lg:w-[12%]">SKU</th>
                      <th className="admin-th lg:w-[14%]">Stock Level</th>
                      <th className="admin-th lg:w-[10%] text-center">Catalog</th>
                      <th className="admin-th lg:w-[12%]">Price</th>
                      <th className="admin-th lg:w-[14%] text-right">Actions</th>
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
                            <td className="admin-td">
                              <div className="flex items-center gap-3">
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
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium truncate ${product.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'}`}>{product.name}</p>
                                    {product.is_featured && (
                                      <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-slate-500 dark:text-gray-400 text-xs truncate">{getCategoryName(product.category)}</p>
                                </div>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="admin-td">
                              <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-600 dark:text-gray-300">
                                {product.sku}
                              </span>
                            </td>

                            {/* Stock Level */}
                            <td className="admin-td">
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full ${getStockColor(stock)} rounded-full transition-all`}
                                    style={{ width: `${getStockPercent(stock)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${getStockTextColor(stock)}`}>{stock}</span>
                              </div>
                              {reserved > 0 && (
                                <p className="text-[11px] font-semibold text-orange-500 mt-1">{reserved} reserved</p>
                              )}
                            </td>


                            {/* Catalog */}
                            <td className="admin-td text-center">
                              {variantCount > 0 ? (
                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold">
                                  {variantCount}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-gray-500 text-xs">—</span>
                              )}
                            </td>

                            {/* Price */}
                            <td className="admin-td">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(product.price, activeStore?.currency)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="admin-td text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 transition-all opacity-100 lg:opacity-40 lg:group-hover:opacity-100"
                                >
                                  <MoreHorizontal size={18} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={8} className="w-44 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 p-1.5 bg-white dark:bg-gray-800 z-[100]">
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
                </table>
              </div>

              {/* Table Footer / Pagination */}
              {filteredProducts.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredProducts.length}
                  perPage={itemsPerPage}
                  itemLabel="products"
                />
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
