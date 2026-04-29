'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, Trash2, Tag } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';

const PER_PAGE = 10;

export default function AttributesPage() {
  const router = useRouter();
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, attr: null });

  const fetchData = useCallback(async () => {
    try {
      const [attrRes, catRes] = await Promise.all([attributeAPI.list(), categoryAPI.list()]);
      const attrData = attrRes.data;
      setAttributes(Array.isArray(attrData) ? attrData : (attrData?.results || []));
      const catData = catRes.data;
      setCategories(Array.isArray(catData) ? catData : (catData?.results || []));
    } catch {
      toast.error('Failed to load data');
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteModal.attr) return;
    try {
      await attributeAPI.delete(deleteModal.attr.id);
      toast.success('Attribute deleted!');
      setDeleteModal({ open: false, attr: null });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const getCategoryName = (catId) =>
    categories.find((c) => c.id === catId)?.name || 'Uncategorized';

  const lowerQuery = searchQuery.toLowerCase().trim();
  const filteredAttributes = attributes.filter(a =>
    a.name?.toLowerCase().includes(lowerQuery) ||
    getCategoryName(a.category)?.toLowerCase().includes(lowerQuery)
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAttributes.length / PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAttributes = filteredAttributes.slice(
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
            <h2 className="admin-title">Attributes</h2>
            <p className="admin-subtitle">Manage product attributes and their values.</p>
          </div>
          <button
            onClick={() => router.push('/attributes/create')}
            className="admin-btn-primary"
          >
            <Plus size={20} />
            <span>Add Attribute</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="admin-search-wrapper">
          <div className="admin-search-box">
            <div className="admin-search-icon">
              <Search size={20} />
            </div>
            <input
              className="admin-search-input"
              placeholder="Search by attribute name or category..."
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
                <table className="admin-table min-w-[800px]">
                  <thead>
                    <tr className="admin-thead-row">
                      <th className="admin-th">Attribute</th>
                      <th className="admin-th">Category</th>
                      <th className="admin-th">Values</th>
                      <th className="admin-th text-center">Count</th>
                      <th className="admin-th text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-tbody">
                    {paginatedAttributes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="admin-empty">
                          <div className="admin-empty-text">
                            <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No attributes found</p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or add a new attribute.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedAttributes.map((attr) => (
                        <tr
                          key={attr.id}
                          className="admin-tr group"
                          onClick={() => router.push(`/attributes/${attr.id}/edit`)}
                        >
                          {/* Attribute Name */}
                          <td className="admin-td">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-900 dark:text-white text-sm font-medium">{attr.name}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="admin-td">
                            <span className="text-sm font-medium text-orange-500">
                              {getCategoryName(attr.category)}
                            </span>
                          </td>

                          {/* Values */}
                          <td className="admin-td">
                            <div className="flex flex-wrap gap-1.5">
                              {attr.values?.length > 0 ? (
                                <>
                                  {attr.values.slice(0, 5).map((v) => (
                                    <span
                                      key={v.id}
                                      className="px-2.5 py-1 bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 rounded-md text-[11px] font-medium"
                                    >
                                      {v.value}
                                    </span>
                                  ))}
                                  {attr.values.length > 5 && (
                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 rounded-md text-[11px]">
                                      +{attr.values.length - 5} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-400 dark:text-gray-500 text-xs italic">No values yet</span>
                              )}
                            </div>
                          </td>

                          {/* Count */}
                          <td className="admin-td text-center">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold">
                              {attr.values?.length ?? 0}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="admin-td text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ open: true, attr });
                              }}
                              className="inline-flex items-center justify-center size-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredAttributes.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredAttributes.length}
                  perPage={PER_PAGE}
                  itemLabel="attributes"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        title="Delete Attribute?"
        itemName={deleteModal.attr?.name || ''}
        description="This will permanently delete this attribute and all its values. Products using this attribute may be affected."
        confirmLabel="Delete Attribute"
        onCancel={() => setDeleteModal({ open: false, attr: null })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
