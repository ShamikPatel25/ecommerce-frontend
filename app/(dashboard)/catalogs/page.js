'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Search, Trash2, Package } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';

const PER_PAGE = 10;

export default function CatalogsPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, variant: null });

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
  const totalPages = Math.max(1, Math.ceil(filteredCatalogs.length / PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCatalogs = filteredCatalogs.slice(
    (safeCurrentPage - 1) * PER_PAGE,
    safeCurrentPage * PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Catalogs</h2>
            <p className="admin-subtitle">Manage product variants and catalog items.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="admin-search-wrapper">
          <div className="admin-search-box">
            <div className="admin-search-icon">
              <Search size={20} />
            </div>
            <input
              className="admin-search-input"
              placeholder="Search by variant name, SKU or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                <table className="admin-table min-w-[750px]">
                  <thead>
                    <tr className="admin-thead-row">
                      <th className="admin-th">Variant Name</th>
                      <th className="admin-th">Product</th>
                      <th className="admin-th">Stock</th>
                      <th className="admin-th">Price</th>
                      <th className="admin-th text-right w-20">Actions</th>
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
                            <td className="admin-td">
                              <p className="text-slate-900 dark:text-white text-sm font-medium">
                                {variant.variant_name || variant.sku}
                              </p>
                              <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded text-slate-500 dark:text-gray-400">
                                {variant.sku}
                              </span>
                            </td>
                            <td className="admin-td">
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
                            <td className="admin-td text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ open: true, variant });
                                }}
                                className="inline-flex items-center justify-center size-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
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
                  perPage={PER_PAGE}
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
