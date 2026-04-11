'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, Trash2 } from 'lucide-react';
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
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Attributes</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage product attributes and their values.</p>
          </div>
          <button
            onClick={() => router.push('/attributes/create')}
            className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            <Plus size={20} />
            <span>Add Attribute</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <div className="text-slate-400 dark:text-gray-500 flex items-center justify-center px-4">
              <Search size={20} />
            </div>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white text-base placeholder:text-slate-400 dark:text-gray-500"
              placeholder="Search by attribute name or category..."
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
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Attribute</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Values</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Count</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {paginatedAttributes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="text-slate-400 dark:text-gray-500">
                            <p className="text-4xl mb-3">🏷️</p>
                            <p className="text-sm font-medium">No attributes found</p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or add a new attribute.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedAttributes.map((attr) => (
                        <tr
                          key={attr.id}
                          className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/attributes/${attr.id}/edit`)}
                        >
                          {/* Attribute Name */}
                          <td className="px-6 py-4">
                            <span className="text-slate-900 dark:text-white text-sm font-semibold">{attr.name}</span>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                              {getCategoryName(attr.category)}
                            </span>
                          </td>

                          {/* Values */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {attr.values?.length > 0 ? (
                                <>
                                  {attr.values.slice(0, 5).map((v) => (
                                    <span
                                      key={v.id}
                                      className="px-2 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-full text-xs"
                                    >
                                      {v.value}
                                    </span>
                                  ))}
                                  {attr.values.length > 5 && (
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 rounded-full text-xs">
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
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center size-8 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-full text-sm font-bold">
                              {attr.values?.length ?? 0}
                            </span>
                          </td>

                          {/* Actions - hover only */}
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ open: true, attr });
                              }}
                              className="inline-flex items-center justify-center size-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
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
