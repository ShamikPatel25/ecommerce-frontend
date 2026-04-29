'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  Plus, Search,
  Trash2, MoreHorizontal,
  Tag, Eye, EyeOff,
  SlidersHorizontal,
} from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const PER_PAGE = 10;

const TABS = [
  { key: 'All',      label: 'All Categories' },
  { key: 'Main',     label: 'Main Categories' },
  { key: 'Sub',      label: 'Subcategories' },
];

/* Flatten a category list into tree order:
   parent → its children → grandchildren → next parent … */
function buildTreeOrder(items) {
  const result = [];
  const insertChildren = (parentId) => {
    items
      .filter((c) => c.parent === parentId)
      .forEach((child) => {
        result.push(child);
        insertChildren(child.id);
      });
  };
  items.filter((c) => !c.parent).forEach((root) => {
    result.push(root);
    insertChildren(root.id);
  });
  return result;
}

export default function CategoriesPage() {
  const router = useRouter();

  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [activeTab,    setActiveTab]    = useState('All');
  const [page,         setPage]         = useState(1);
  const [deleteModal,  setDeleteModal]  = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [filterOpen,   setFilterOpen]   = useState(false);
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

  /* ── fetch ── */
  const fetchCategories = useCallback(async () => {
    try {
      const res  = await categoryAPI.list();
      const data = res.data;
      if (Array.isArray(data))    setCategories(data);
      else if (data?.results)     setCategories(data.results);
      else                        setCategories([]);
    } catch {
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await categoryAPI.delete(deleteModal.id);
      toast.success('Category and all its products deleted!');
      setDeleteModal(null);
      fetchCategories();
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
      fetchCategories();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'string' ? detail : detail?.detail || 'Failed to update category status';
      toast.error(msg);
    }
  };

  /* ── helpers ── */
  const getParentName = (parentId) =>
    categories.find((c) => c.id === parentId)?.name || '—';

  const getLevelBadge = (level) => {
    if (level === 0) return { cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', label: 'Main' };
    if (level === 1) return { cls: 'bg-green-500/10 text-green-400 border border-green-500/20', label: 'Sub' };
    return               { cls: 'bg-orange-500/10 text-orange-400 border border-orange-500/20', label: 'Sub-sub' };
  };

  /* ── filter + paginate ── */
  const lowerQuery = searchQuery.toLowerCase().trim();
  const baseFiltered = categories.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(lowerQuery) ||
      c.slug?.toLowerCase().includes(lowerQuery);
    if (!matchSearch) return false;
    if (activeTab === 'Main')     return c.level === 0;
    if (activeTab === 'Sub')      return c.level >= 1;
    return true;
  });

  const filtered =
    activeTab === 'All' && !lowerQuery
      ? buildTreeOrder(baseFiltered)
      : baseFiltered;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="admin-page">
      <div className="admin-container">

      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-title">Categories</h2>
          <p className="admin-subtitle">Organize your store hierarchy for better customer navigation.</p>
        </div>
        <button
          onClick={() => router.push('/categories/create')}
          className="admin-btn-primary"
        >
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="admin-search-wrapper" ref={filterRef}>
        <div className="admin-search-box">
          <div className="admin-search-icon">
            <Search size={20} />
          </div>
          <input
            className="admin-search-input"
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
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
                onClick={() => { setActiveTab(key); setPage(1); setFilterOpen(false); }}
                className={activeTab === key ? 'admin-filter-mobile-item-active' : 'admin-filter-mobile-item'}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="admin-filters">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setPage(1); }}
            className={activeTab === key ? 'admin-filter-btn-active' : 'admin-filter-btn'}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="admin-table-card">

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
          </div>

        ) : paginated.length === 0 ? (
          <div className="admin-empty admin-empty-text flex flex-col items-center justify-center">
            <Tag className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No categories found.</p>
          </div>

        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[800px]">
              <thead>
                <tr className="admin-thead-row">
                  <th className="admin-th">Category Name</th>
                  <th className="admin-th">Slug</th>
                  <th className="admin-th">Parent</th>
                  <th className="admin-th text-center">Products</th>
                  <th className="admin-th">Status</th>
                  <th className="admin-th text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="admin-tbody">
                {paginated.map((cat) => {
                  const { cls, label } = getLevelBadge(cat.level);
                  return (
                    <tr
                      key={cat.id}
                      className={`admin-tr group ${!cat.is_active ? 'opacity-60' : ''}`}
                      onClick={() => router.push(`/categories/${cat.id}/edit`)}
                    >
                      {/* Name */}
                      <td className="admin-td whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="admin-td whitespace-nowrap">
                        <code className="text-xs font-mono bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-500 dark:text-gray-400">
                          /{cat.slug}
                        </code>
                      </td>

                      {/* Parent */}
                      <td className="admin-td whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                        {cat.parent ? (
                          <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-gray-700 text-xs font-medium text-slate-600 dark:text-gray-300">
                            {getParentName(cat.parent)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-gray-600">—</span>
                        )}
                      </td>

                      {/* Products */}
                      <td className="admin-td whitespace-nowrap text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold">
                          {(cat.product_count ?? 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="admin-td whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center gap-1.5 min-w-[5.5rem] px-3 py-1 rounded-full text-xs font-bold ${
                          cat.is_active
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="admin-td whitespace-nowrap text-right">
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
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > PER_PAGE && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            perPage={PER_PAGE}
            itemLabel="categories"
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
