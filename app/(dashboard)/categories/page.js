'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { categoryAPI, isCancelledError } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  Plus, Search,
  Trash2, MoreHorizontal,
  Tag, Eye, EyeOff,
  SlidersHorizontal,
  Pencil, X, CornerDownRight
} from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import DataError from '@/components/dashboard/DataError';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useStoreStore } from '@/store/storeStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatDate } from '@/lib/utils';


const TABS = [
  { key: 'All', label: 'All Categories' },
  { key: 'Main', label: 'Main Categories' },
  { key: 'Sub', label: 'Subcategories' },
];

// Removed buildTreeOrder as it requires the full dataset which is incompatible with server-side pagination.

export default function CategoriesPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();
  const invalidateDashboard = useDashboardStore((s) => s.invalidate);

  const [categories, setCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = searchParams.get('tab') || 'All';
  const page = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 10;

  const setActiveTab = (val) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', val);
    params.set('page', 1);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setPage = (val) => {
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

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
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

  /* ── fetch ── */
  const fetchCategories = useCallback(async (force = false) => {
    if (fetchingRef.current && !force) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const params = { page, perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeTab === 'Main') params.level = 'main';
      if (activeTab === 'Sub') params.level = 'sub';

      const res = await categoryAPI.list(params);
      const data = res.data;
      if (data?.results) {
        setCategories(data.results);
        setTotalItems(data.count || 0);
      } else {
        setCategories(Array.isArray(data) ? data : []);
        setTotalItems(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      if (!isCancelledError(err)) {
        setError(true);
      }
      setCategories([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [page, perPage, searchQuery, activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await categoryAPI.delete(deleteModal.id);
      toast.success('Category and all its products deleted!');
      setDeleteModal(null);
      invalidateDashboard(activeStore?.id);
      fetchCategories(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  /* ── toggle active ── */
  const handleToggleActive = async (cat) => {
    try {
      await categoryAPI.toggleActive(cat.id);
      toast.success(cat.is_active ? 'Category, subcategories and products deactivated' : 'Category, subcategories and products activated');
      invalidateDashboard(activeStore?.id);
      fetchCategories(true);
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'string' ? detail : detail?.detail || 'Failed to update category status';
      toast.error(msg);
    }
  };

  /* ── helpers ── */


  const getLevelBadge = (level) => {
    if (level === 0) return { cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', label: 'Main' };
    if (level === 1) return { cls: 'bg-green-500/10 text-green-400 border border-green-500/20', label: 'Sub' };
    return { cls: 'bg-violet-500/10 text-violet-400 border border-violet-500/20', label: 'Sub-sub' };
  };

  /* ── filter + paginate ── */
  // Pagination
  const filtered = categories;

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(page, totalPages) || 1;
  const paginated = filtered;

  const handleCreate = () => {
    sessionStorage.removeItem('form-draft:category-create');
    router.push('/categories/create');
  };

  return (
    <div className="admin-page h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="admin-container flex-1 flex flex-col min-h-0">

        {/* Page Header */}
        <div className="admin-page-header !mb-6">
          <div className="flex flex-col w-full sm:w-auto">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h2 className="admin-title !mb-0 sm:!mb-1">Categories</h2>
              {/* Mobile Button */}
              <button
                onClick={handleCreate}
                className="admin-btn-primary sm:hidden"
              >
                <Plus size={20} />
                <span>Add Category</span>
              </button>
            </div>
            <p className="admin-subtitle !mt-1 sm:mt-1 mb-2 sm:mb-0">Organize your products into collections.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            {/* Search Bar */}
            <div className="admin-search-wrapper !mb-0 w-full sm:w-96" ref={filterRef}>
              <div className="admin-search-box !h-11">
                <div className="admin-search-icon">
                  <Search size={20} />
                </div>
                <input
                  className="admin-search-input"
                  placeholder="Search categories"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setPage(1); }}
                    className="flex items-center justify-center px-3 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                )}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={activeTab !== 'All' ? 'admin-filter-toggle-active' : 'admin-filter-toggle'}
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>

              {filterOpen && (
                <div className="admin-filters-mobile">
                  {TABS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setActiveTab(key); setFilterOpen(false); }}
                      className={activeTab === key ? 'admin-filter-mobile-item-active' : 'admin-filter-mobile-item'}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Button */}
            <button
              onClick={handleCreate}
              className="admin-btn-primary hidden sm:flex"
            >
              <Plus size={20} />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="admin-filters">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={activeTab === key ? 'admin-filter-btn-active' : 'admin-filter-btn'}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Table Card ── */}
        <div className="admin-table-card flex-1 flex flex-col min-h-0">

          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
            </div>

          ) : error ? (
            <DataError message="Failed to load categories" onRetry={fetchCategories} retrying={loading} />

          ) : paginated.length === 0 ? (
            <div className="admin-empty admin-empty-text flex flex-col items-center justify-center">
              <Tag className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No categories found.</p>
            </div>

          ) : (
            <div className="overflow-auto flex-1 h-0">
              <div className="min-w-full"><table className="admin-table table-fixed min-w-[850px] w-full">
                <thead>
                  <tr className="admin-thead-row">
                    <th className="admin-th w-[25%] text-left">Category Name</th>
                    <th className="admin-th w-[20%] text-left">URL Handle</th>
                    <th className="admin-th w-[15%] text-left">Parent</th>
                    <th className="admin-th w-[10%]">Products</th>
                    <th className="admin-th w-[12%]">Status</th>
                    <th className="admin-th w-[8%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="admin-tbody">
                  {paginated.map((cat) => {
                    return (
                      <tr
                        key={cat.id}
                        className={`admin-tr group ${!cat.is_active ? 'opacity-60' : ''}`}
                        onClick={() => router.push(`/categories/${cat.id}/edit`)}
                      >
                        {/* Name */}
                        <td className="admin-td text-left">
                          <div className="flex items-center justify-start gap-3 w-full min-w-0">
                            <span
                              className="font-medium text-sm text-slate-900 dark:text-white truncate w-full block"
                              title={cat.name}
                            >
                              {cat.name}
                            </span>
                          </div>
                        </td>

                        {/* URL Handle */}
                        <td className="admin-td text-left">
                          <div className="w-full min-w-0">
                            <code
                              className="text-xs font-mono bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-500 dark:text-gray-400 truncate inline-block max-w-full align-bottom"
                              title={`/${cat.full_slug || cat.slug}`}
                            >
                              /{cat.full_slug || cat.slug}
                            </code>
                          </div>
                        </td>

                        {/* Parent */}
                        <td className="admin-td text-sm text-slate-500 dark:text-gray-400 text-left">
                          {cat.parent ? (
                            <div className="w-full min-w-0">
                              <span
                                className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-gray-700 text-xs font-medium text-slate-600 dark:text-gray-300 truncate max-w-full align-bottom"
                                title={cat.parent_name || '—'}
                              >
                                {cat.parent_name || '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-gray-600">—</span>
                          )}
                        </td>

                        {/* Products */}
                        <td className="admin-td whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-500 border border-violet-500/20 text-xs font-bold">
                            {(cat.product_count ?? 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="admin-td whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center gap-1.5 min-w-[5.5rem] px-3 py-1 rounded-full text-xs font-bold ${cat.is_active
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>


                        {/* Actions */}
                        <td className="admin-td whitespace-nowrap text-center">
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
                                  router.push(`/categories/${cat.id}/edit`);
                                }}
                                className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                              >
                                <Pencil size={16} className="text-slate-400 dark:text-gray-500" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(cat);
                                }}
                                className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                              >
                                {cat.is_active ? <EyeOff size={16} className="text-slate-400 dark:text-gray-500" /> : <Eye size={16} className="text-slate-400 dark:text-gray-500" />}
                                <span>{cat.is_active ? 'Deactivate' : 'Activate'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ id: cat.id, name: cat.name });
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
                  })}
                </tbody>
              </table></div>
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              perPage={perPage}
              itemLabel="categories"
              onPerPageChange={setPerPage}
            />
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmDeleteModal
        open={!!deleteModal}
        title="Delete Category?"
        itemName={deleteModal?.name}
        description="This will permanently delete this category and ALL products & catalogs inside it. This cannot be undone."
        onCancel={() => !deleting && setDeleteModal(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? 'Deleting…' : 'Delete Category'}
      />
    </div>
  );
}
