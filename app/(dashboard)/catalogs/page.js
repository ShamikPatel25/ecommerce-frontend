'use client';

import { useState, useEffect, useCallback } from 'react';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Search, Trash2 } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';

export default function CatalogsPage() {
  const { activeStore } = useStoreStore();
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, variant: null });
  const itemsPerPage = 10;

  const fetchCatalogs = useCallback(async () => {
    try {
      const response = await productAPI.list();
      const products = Array.isArray(response.data) ? response.data : response.data?.results || [];
      const catalogProducts = products.filter(p => p.product_type === 'catalog');
      const allVariants = [];
      for (const product of catalogProducts) {
        const productDetail = await productAPI.get(product.id);
        const variants = productDetail.data?.variants || [];
        variants.forEach(variant => {
          const valuesLabel = variant.attribute_values?.map(av => av.value).join('-') || '';
          allVariants.push({
            ...variant,
            variant_name: valuesLabel ? `${product.name} - ${valuesLabel}` : variant.sku,
            product_name: product.name,
            product_id: product.id,
            product_price: product.price,
          });
        });
      }
      setCatalogs(allVariants);
    } catch {
      toast.error('Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (stock <= 30) return 'bg-orange-400';
    return 'bg-orange-500';
  };

  const getStockTextColor = (stock) => {
    if (stock <= 15) return 'text-red-500';
    return 'text-slate-700 dark:text-gray-300';
  };

  const getStockPercent = (stock) => Math.min((stock / 150) * 100, 100);

  const lowerQuery = searchQuery.toLowerCase().trim();
  const filteredCatalogs = catalogs.filter(c =>
    c.variant_name?.toLowerCase().includes(lowerQuery) ||
    c.sku?.toLowerCase().includes(lowerQuery) ||
    c.product_name?.toLowerCase().includes(lowerQuery)
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCatalogs.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCatalogs = filteredCatalogs.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Catalogs</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage product variants and catalog items.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <div className="text-slate-400 dark:text-gray-500 flex items-center justify-center px-4">
              <Search size={20} />
            </div>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white text-base placeholder:text-slate-400 dark:placeholder:text-gray-500"
              placeholder="Search by variant name, SKU or product..."
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
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Variant Name</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {paginatedCatalogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="text-slate-400 dark:text-gray-500">
                            <p className="text-4xl mb-3">📚</p>
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
                            className="hover:bg-slate-50/50 dark:hover:bg-gray-700 transition-colors group"
                          >
                            {/* Variant Name */}
                            <td className="px-6 py-4">
                              <p className="text-slate-900 dark:text-white text-sm font-semibold">
                                {variant.variant_name || variant.sku}
                              </p>
                              <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded text-slate-500 dark:text-gray-400">
                                {variant.sku}
                              </span>
                            </td>

                            {/* Product */}
                            <td className="px-6 py-4">
                              <span className="text-slate-600 dark:text-gray-300 text-sm">{variant.product_name}</span>
                            </td>

                            {/* Stock */}
                            <td className="px-6 py-4">
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
                            </td>

                            {/* Price */}
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(variant.price ?? variant.product_price ?? 0, activeStore?.currency)}
                              </span>
                            </td>

                            {/* Actions - visible on hover */}
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ open: true, variant });
                                }}
                                className="inline-flex items-center justify-center size-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredCatalogs.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredCatalogs.length}
                  perPage={itemsPerPage}
                  itemLabel="catalogs"
                />
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
