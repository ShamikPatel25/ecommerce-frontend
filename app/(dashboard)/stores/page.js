'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { storeAPI, isCancelledError } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, MoreHorizontal, Trash2, Eye, EyeOff, Pencil, X } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import DataError from '@/components/dashboard/DataError';
import { useStoreStore } from '@/store/storeStore';
import StoreDeactivatedModal from '@/components/StoreDeactivatedModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ open: false, store: null });
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const { activeStore, setActiveStore, setStores: setGlobalStores } = useStoreStore();
  
  const fetchingRef = useRef(false);

  const fetchStores = useCallback(async (force = false) => {
    if (fetchingRef.current && !force) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const params = { page: currentPage, perPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await storeAPI.list(params);
      const data = response.data;
      if (data?.results) {
        setStores(data.results);
        setTotalItems(data.count || 0);
      } else {
        const storeList = Array.isArray(data) ? data : (typeof data === 'object' && data ? [data] : []);
        setStores(storeList);
        setTotalItems(storeList.length);
      }
    } catch (err) {
      if (!isCancelledError(err)) {
        setError(true);
      }
      setStores([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [currentPage, perPage, searchQuery]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteModal.store) return;

    const storeToDelete = deleteModal.store;
    const isActiveStore = activeStore?.id === storeToDelete.id;
    const otherStores = stores.filter(s => s.id !== storeToDelete.id);

    // If deleting the active store and other stores exist, block it
    if (isActiveStore && otherStores.length > 0) {
      toast.error('Switch to another store before deleting the active one.');
      setDeleteModal({ open: false, store: null });
      return;
    }

    try {
      await storeAPI.delete(storeToDelete.id);
      toast.success('Store deleted!');
      setDeleteModal({ open: false, store: null });

      // If it was the only store, clear active store
      if (otherStores.length === 0) {
        setActiveStore(null);
        setGlobalStores([]);
      }

      fetchStores();
    } catch {
      toast.error('Failed to delete store');
    }
  };

  const handleToggleActive = async (store) => {
    const isDeactivating = store.is_active;
    try {
      await storeAPI.patch(store.id, { is_active: !store.is_active });
      toast.success(isDeactivating ? 'Store deactivated' : 'Store activated');

      // Refresh stores list
      const res = await storeAPI.list();
      const data = res.data;
      const updatedStores = Array.isArray(data) ? data : data?.results || [];
      setStores(updatedStores);
      setGlobalStores(updatedStores);

      // If we deactivated the currently active store, auto-switch
      if (isDeactivating && activeStore?.id === store.id) {
        const otherActive = updatedStores.find(s => s.is_active && s.id !== store.id);
        if (otherActive) {
          setActiveStore(otherActive);
          globalThis.location.reload();
        } else {
          setShowDeactivatedModal(true);
        }
      }
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'string' ? detail : detail?.detail || JSON.stringify(detail) || 'Failed to update store status';
      toast.error(msg);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
  const paginatedStores = stores;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCreate = () => {
    sessionStorage.removeItem('form-draft:store-create');
    router.push('/stores/create');
  };

  return (
    <div className="admin-page h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="admin-container flex-1 flex flex-col min-h-0">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Stores</h2>
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
                  placeholder="Search by store name or subdomain"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <span>Create Store</span>
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
            <DataError message="Failed to load stores" onRetry={fetchStores} retrying={loading} />
          ) : (
            <>
              <div className="overflow-auto flex-1 h-0">
                <div className="min-w-full"><table className="admin-table min-w-[800px]">
                  <thead>
                    <tr className="admin-thead-row">
                      <th className="admin-th text-left">Store</th>
                      <th className="admin-th text-left">Description</th>
                      <th className="admin-th text-center">Currency</th>
                      <th className="admin-th text-center">Status</th>
                      <th className="admin-th text-center w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-tbody">
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="admin-empty">
                          <div className="admin-empty-text">
                            <p className="text-4xl mb-3">🏪</p>
                            <p className="text-sm font-medium">No stores found</p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or create a new store.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      stores.map((store) => (
                        <tr
                          key={store.id}
                          className="admin-tr group"
                          onClick={() => router.push(`/stores/${store.id}/edit`)}
                        >
                          {/* Store Name */}
                          <td className="admin-td text-left">
                            <div className="flex items-center justify-start gap-3">
                              <div className="size-10 bg-slate-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🏪</div>
                              <div className="min-w-0">
                                <p
                                  className="text-sm font-semibold truncate text-slate-900 dark:text-white max-w-[200px]"
                                  title={store.name}
                                >
                                  {store.name}
                                </p>
                                <p
                                  className="text-xs text-violet-500 truncate max-w-[200px]"
                                  title={store.full_domain || `${store.subdomain}.localhost:3000`}
                                >
                                  {store.full_domain || `${store.subdomain}.localhost:3000`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="admin-td text-left max-w-[200px]">
                            <span
                              className="text-slate-500 dark:text-gray-400 text-sm block truncate"
                              title={store.description || '—'}
                            >
                              {store.description || '—'}
                            </span>
                          </td>

                          {/* Currency */}
                          <td className="admin-td text-center">
                            <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-600 dark:text-gray-300 font-semibold">{store.currency}</span>
                          </td>

                          {/* Status */}
                          <td className="admin-td">
                            <span className={`inline-flex items-center justify-center gap-1.5 min-w-[5.5rem] px-3 py-1 rounded-full text-xs font-bold ${store.is_active
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                              {store.is_active ? 'Active' : 'Inactive'}
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
                                    router.push(`/stores/${store.id}/edit`);
                                  }}
                                  className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                                >
                                  <Pencil size={16} className="text-slate-400 dark:text-gray-500" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleActive(store);
                                  }}
                                  className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                                >
                                  {store.is_active ? <EyeOff size={16} className="text-slate-400 dark:text-gray-500" /> : <Eye size={16} className="text-slate-400 dark:text-gray-500" />}
                                  <span>{store.is_active ? 'Deactivate' : 'Activate'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteModal({ open: true, store });
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
              {stores.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  perPage={perPage}
                  itemLabel="stores"
                 onPerPageChange={(val) => { setPerPage(val); setCurrentPage(1); }} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        title="Delete Store?"
        itemName={deleteModal.store?.name || ''}
        description="This action cannot be undone and will permanently remove this store and all its data."
        confirmLabel="Delete Store"
        onCancel={() => setDeleteModal({ open: false, store: null })}
        onConfirm={handleDelete}
      />

      <StoreDeactivatedModal
        open={showDeactivatedModal}
        onClose={() => setShowDeactivatedModal(false)}
      />
    </div>
  );
}
