'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, MoreHorizontal, Trash2, Eye, EyeOff } from 'lucide-react';
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
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
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
      await productAPI.update(product.id, {
        name: product.name,
        sku: product.sku,
        product_type: product.product_type,
        price: product.price,
        stock: product.stock,
        category: product.category,
        is_active: !product.is_active,
        is_featured: product.is_featured,
      });
      toast.success(product.is_active ? 'Product deactivated' : 'Product activated');
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

  const lowerQuery = searchQuery.toLowerCase().trim();
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.sku.toLowerCase().includes(lowerQuery)
  );

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

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Products</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage your catalog, stock levels, and pricing.</p>
          </div>
          <button
            onClick={() => router.push('/products/create')}
            className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <div className="text-slate-400 dark:text-gray-500 flex items-center justify-center px-4">
              <Search size={20} />
            </div>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white text-base placeholder:text-slate-400 dark:placeholder:text-gray-500"
              placeholder="Search products by name, SKU or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* DataTable Container */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300">
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[30%]">Product</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[14%]">SKU</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[14%]">Stock Level</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[14%] text-center">Catalog</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[14%]">Price</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[14%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="text-slate-400 dark:text-gray-500">
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
                            className={`hover:bg-slate-50/50 dark:hover:bg-gray-700 transition-colors group cursor-pointer ${product.is_active ? '' : 'opacity-60'}`}
                            onClick={() => router.push(`/products/${product.id}/edit`)}
                          >
                            {/* Product */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-4">
                                <div className="size-12 rounded-lg bg-slate-100 dark:bg-gray-700 overflow-hidden border border-slate-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                                  {mediaUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={mediaUrl}
                                      alt={product.name}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <span className="text-xl">
                                      {product.product_type === 'catalog' ? '📚' : '📦'}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-semibold ${product.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'}`}>{product.name}</p>
                                    {!product.is_active && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 text-[10px] font-bold uppercase tracking-wide">
                                        <EyeOff size={10} />
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-500 dark:text-gray-400 text-xs">{getCategoryName(product.category)}</p>
                                </div>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="px-4 py-4">
                              <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-600 dark:text-gray-300">
                                {product.sku}
                              </span>
                            </td>

                            {/* Stock Level */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full ${getStockColor(stock)} rounded-full transition-all`}
                                    style={{ width: `${getStockPercent(stock)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${getStockTextColor(stock)}`}>
                                  {stock}
                                </span>
                              </div>
                              {reserved > 0 && (
                                <p className="text-[11px] font-semibold text-orange-500 mt-1">
                                  {reserved} reserved
                                </p>
                              )}
                            </td>

                            {/* Catalog */}
                            <td className="px-4 py-4 text-center">
                              {variantCount > 0 ? (
                                <span className="inline-flex items-center justify-center size-7 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-bold">
                                  {variantCount}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-gray-500 text-xs">—</span>
                              )}
                            </td>

                            {/* Price */}
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(product.price, activeStore?.currency)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center size-8 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 transition-all opacity-40 group-hover:opacity-100"
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
