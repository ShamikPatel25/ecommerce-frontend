'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Search, Trash2, Package, X } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';
import { useSharedDataStore } from '@/store/sharedDataStore';


export default function CatalogsPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();
  const { fetchProducts } = useSharedDataStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 10;

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

  const [deleteModal, setDeleteModal] = useState({ open: false, variant: null });

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await productAPI.variants(params);
      const data = res.data;
      
      setCatalogs(data?.results || []);
      setTotalItems(data.count || 0);
    } catch {
      toast.error('Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchQuery]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const handleDelete = async () => {
    if (!deleteModal.variant) return;
    const { product_id, id } = deleteModal.variant;
    try {
      await productAPI.deleteVariant(product_id, id);
      toast.success('Variant deleted!');
      setDeleteModal({ open: false, variant: null });
      fetchCatalogs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete variant');
    }
  };

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

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
  const paginatedCatalogs = catalogs;

  return (
    <div className="admin-page h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="admin-container flex-1 flex flex-col min-h-0">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Catalogs</h2>
            <p className="admin-subtitle">Manage product variants and catalog items.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            {/* Search Bar */}
            <div className="admin-search-wrapper !mb-0 w-full sm:w-96">
              <div className="admin-search-box !h-11">
                <div className="admin-search-icon">
                  <Search size={20} />
                </div>
                <input
                  className="admin-search-input"
                  placeholder="Search by variant name, SKU or product..."
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
              </div>
            </div>
          </div>
        </div>

        {/* DataTable Container */}
        <div className="admin-table-card flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
            </div>
          ) : (
            <>
              <div className="overflow-auto flex-1 h-0">
                <div className="min-w-full"><table className="admin-table min-w-[750px]">
                  <thead>
                    <tr className="admin-thead-row">
                      <th className="admin-th text-left">Variant Name</th>
                      <th className="admin-th text-left">Product</th>
                      <th className="admin-th">Stock</th>
                      <th className="admin-th">Price</th>
                      <th className="admin-th w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-tbody">
                    {paginatedCatalogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="admin-empty">
                          <div className="admin-empty-text">
                            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No catalogs found</p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or create catalog products.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedCatalogs.map((variant) => {
                        const stock = variant.stock ?? 0;
                        return (
                          <tr
                            key={`${variant.product_id}-${variant.id}`}
                            onClick={() => router.push(`/products/${variant.product_id}/edit`)}
                            className="admin-tr group"
                          >
                            <td className="admin-td text-left">
                              <p className="text-slate-900 dark:text-white text-sm font-medium">
                                {variant.variant_name || variant.sku}
                              </p>
                              <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded text-slate-500 dark:text-gray-400">
                                {variant.sku}
                              </span>
                            </td>
                            <td className="admin-td text-left">
                              <span className="text-slate-600 dark:text-gray-300 text-sm">{variant.product_name}</span>
                            </td>
                            <td className="admin-td">
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full ${getStockColor(stock)} rounded-full transition-all`}
                                    style={{ width: `${getStockPercent(stock)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${getStockTextColor(stock)}`}>
                                  {stock}
                                </span>
                              </div>
                            </td>
                            <td className="admin-td">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(variant.price ?? variant.product_price ?? 0, activeStore?.currency)}
                              </span>
                            </td>
                            <td className="admin-td">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ open: true, variant });
                                }}
                                className="inline-flex items-center justify-center size-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table></div>
              </div>

              {/* Pagination */}
              {catalogs.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  perPage={perPage}
                  itemLabel="catalogs"
                  onPerPageChange={setPerPage} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        title="Delete Variant?"
        itemName={deleteModal.variant?.variant_name || deleteModal.variant?.sku || ''}
        description="This action cannot be undone and will permanently remove this variant from your catalog."
        confirmLabel="Delete Variant"
        onCancel={() => setDeleteModal({ open: false, variant: null })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
