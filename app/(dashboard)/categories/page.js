'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  Plus, Search,
  Trash2, MoreHorizontal,
  Tag, Eye, EyeOff,
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
      toast.success(cat.is_active ? 'Category and its products deactivated' : 'Category and its products activated');
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
    if (level === 0) return { cls: 'bg-blue-100 text-blue-700',   label: 'Main' };
    if (level === 1) return { cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: 'Sub' };
    return               { cls: 'bg-orange-100 text-orange-700 dark:text-orange-400', label: 'Sub-sub' };
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
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Categories</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Organize your store hierarchy for better customer navigation.</p>
        </div>
        <button
          onClick={() => router.push('/categories/create')}
          className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
        >
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="mb-6">
        <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
          <div className="text-slate-400 dark:text-gray-500 flex items-center justify-center px-4">
            <Search size={20} />
          </div>
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white text-base placeholder:text-slate-400 dark:text-gray-500"
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-200 dark:border-gray-700 mb-6 gap-6 overflow-x-auto whitespace-nowrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setPage(1); }}
            className={`px-1 pb-4 text-sm border-b-2 transition-colors ${
              activeTab === key
                ? 'border-orange-500 text-orange-500 font-bold'
                : 'border-transparent text-slate-500 dark:text-gray-400 font-medium hover:text-slate-700 dark:text-gray-300 hover:border-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>

        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-gray-500">
            <Tag className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No categories found.</p>
          </div>

        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Category Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-center">Products</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {paginated.map((cat) => {
                  const { cls, label } = getLevelBadge(cat.level);
                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-slate-50 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 transition-colors group cursor-pointer ${!cat.is_active ? 'opacity-60' : ''}`}
                      onClick={() => router.push(`/categories/${cat.id}/edit`)}
                    >
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {cat.name}
                        </span>
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className={`text-xs font-mono bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded ${cat.level === 0 ? 'text-[#ff6600]' : 'text-slate-500 dark:text-gray-400'}`}>
                          /{cat.slug}
                        </code>
                      </td>

                      {/* Level badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
                          {label}
                        </span>
                      </td>

                      {/* Parent */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                        {cat.parent ? getParentName(cat.parent) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Products */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-700 dark:text-gray-300">
                        {(cat.product_count ?? 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block w-[72px] text-center px-3 py-1 rounded-full text-xs font-semibold ${cat.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
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
                                handleToggleActive(cat);
                              }}
                              className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                            >
                              {cat.is_active ? <EyeOff size={16} className="text-slate-400 dark:text-gray-500" /> : <Eye size={16} className="text-slate-400 dark:text-gray-500" />}
                              <span>{cat.is_active ? 'Deactivate' : 'Activate'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ id: cat.id, name: cat.name });
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
