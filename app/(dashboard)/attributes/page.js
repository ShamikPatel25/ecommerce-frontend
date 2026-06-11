'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { attributeAPI, categoryAPI, isCancelledError } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, Trash2, Tag, MoreHorizontal, Pencil, X } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import DataError from '@/components/dashboard/DataError';
import { useSharedDataStore } from '@/store/sharedDataStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';


export default function AttributesPage() {
  const router = useRouter();
  const { fetchCategories, categories } = useSharedDataStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const [deleteModal, setDeleteModal] = useState({ open: false, attr: null });
  const fetchingRef = useRef(false);

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const attrRes = await attributeAPI.list();
      const attrData = attrRes.data;
      setAttributes(Array.isArray(attrData) ? attrData : (attrData?.results || []));
    } catch (err) {
      if (!isCancelledError(err)) {
        setError(true);
      }
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const [attrRes] = await Promise.all([
        attributeAPI.list(),
        fetchCategories(),
      ]);
      const attrData = attrRes.data;
      setAttributes(Array.isArray(attrData) ? attrData : (attrData?.results || []));
    } catch (err) {
      if (!isCancelledError(err)) {
        setError(true);
      }
      setAttributes([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetchCategories]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteModal.attr) return;
    try {
      await attributeAPI.delete(deleteModal.attr.id);
      toast.success('Attribute deleted!');
      setDeleteModal({ open: false, attr: null });
      fetchAttributes(); // only re-fetch attributes, categories unchanged
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
  const totalPages = Math.max(1, Math.ceil(filteredAttributes.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAttributes = filteredAttributes.slice(
    (safeCurrentPage - 1) * perPage,
    safeCurrentPage * perPage
  );

  const handleCreate = () => {
    sessionStorage.removeItem('form-draft:attribute-create');
    sessionStorage.removeItem('form-draft:attribute-create-values');
    router.push('/attributes/create');
  };

  return (
    <div className="admin-page h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="admin-container flex-1 flex flex-col min-h-0">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Attributes</h2>
            <p className="admin-subtitle">Manage product attributes and their values.</p>
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
                  placeholder="Search by attribute name or category..."
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

            <button
              onClick={handleCreate}
              className="admin-btn-primary"
            >
              <Plus size={20} />
              <span>Add Attribute</span>
            </button>
          </div>
        </div>

        {/* DataTable Container */}
        <div className="admin-table-card flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
            </div>
          ) : error ? (
            <DataError message="Failed to load attributes" onRetry={fetchData} retrying={loading} />
          ) : (
            <>
              <div className="overflow-auto flex-1 h-0">
                <div className="min-w-full"><table className="admin-table table-fixed min-w-[800px] w-full">
                  <thead>
                    <tr className="admin-thead-row">
                      <th className="admin-th w-[25%] text-left">Attribute</th>
                      <th className="admin-th w-[20%] text-left">Category</th>
                      <th className="admin-th w-[35%] text-left">Values</th>
                      <th className="admin-th w-[10%] text-center">Count</th>
                      <th className="admin-th w-[10%] text-center">Actions</th>
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
                          <td className="admin-td text-left">
                            <div className="flex items-center justify-start gap-3 w-full min-w-0">
                              <span
                                className="text-slate-900 dark:text-white text-sm font-medium truncate max-w-[150px] lg:max-w-[250px] block"
                                title={attr.name}
                              >
                                {attr.name}
                              </span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="admin-td text-left">
                            <span
                              className="text-sm font-medium text-violet-500 truncate max-w-[150px] lg:max-w-[250px] block"
                              title={getCategoryName(attr.category)}
                            >
                              {getCategoryName(attr.category)}
                            </span>
                          </td>

                          {/* Values */}
                          <td className="admin-td text-left">
                            <div className="flex flex-wrap justify-start gap-1.5">
                              {attr.values?.length > 0 ? (
                                <>
                                  {attr.values.slice(0, 5).map((v) => (
                                    <span
                                      key={v.id}
                                      title={v.value}
                                      className="px-2.5 py-1 bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 rounded-md text-[11px] font-medium truncate max-w-[120px] inline-block align-bottom"
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
                          <td className="admin-td">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-500 border border-violet-500/20 text-xs font-bold">
                              {attr.values?.length ?? 0}
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
                                    router.push(`/attributes/${attr.id}/edit`);
                                  }}
                                  className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                >
                                  <Pencil size={16} className="text-slate-400 dark:text-gray-500" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteModal({ open: true, attr });
                                  }}
                                  className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table></div>
              </div>

              {/* Pagination */}
              {filteredAttributes.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredAttributes.length}
                  perPage={perPage}
                  itemLabel="attributes"
                 onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }} />
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
