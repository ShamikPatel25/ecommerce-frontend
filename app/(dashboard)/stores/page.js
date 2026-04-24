'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { storeAPI } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, MoreHorizontal, Trash2, Eye, EyeOff } from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, store: null });
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const { activeStore, setActiveStore, setStores: setGlobalStores } = useStoreStore();
  const itemsPerPage = 10;

  const fetchStores = useCallback(async () => {
    try {
      const response = await storeAPI.list();
      const data = response.data;
      if (Array.isArray(data)) setStores(data);
      else if (data?.results) setStores(data.results);
      else if (typeof data === 'object') setStores([data]);
      else setStores([]);
    } catch {
      toast.error('Failed to fetch stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleDelete = async () => {
    if (!deleteModal.store) return;
    try {
      await storeAPI.delete(deleteModal.store.id);
      toast.success('Store deleted!');
      setDeleteModal({ open: false, store: null });
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

  const lowerQuery = searchQuery.toLowerCase().trim();
  const filteredStores = stores.filter(s =>
    s.name?.toLowerCase().includes(lowerQuery) ||
    s.subdomain?.toLowerCase().includes(lowerQuery)
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStores = filteredStores.slice(
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
            <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Stores</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage your stores, domains, and settings.</p>
          </div>
          <button
            onClick={() => router.push('/stores/create')}
            className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            <Plus size={20} />
            <span>Create Store</span>
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
              placeholder="Search by store name or subdomain..."
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
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Store</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {paginatedStores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="text-slate-400 dark:text-gray-500">
                            <p className="text-4xl mb-3">🏪</p>
                            <p className="text-sm font-medium">No stores found</p>
                            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or create a new store.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedStores.map((store) => (
                        <tr
                          key={store.id}
                          className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/stores/${store.id}/edit`)}
                        >
                          {/* Store Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🏪</div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{store.name}</p>
                                <p className="text-xs text-blue-600">{store.full_domain || `${store.subdomain}.localhost:3000`}</p>
                              </div>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="px-6 py-4">
                            <span className="text-slate-500 dark:text-gray-400 text-sm">{store.description || '—'}</span>
                          </td>

                          {/* Currency */}
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded text-slate-600 dark:text-gray-300 font-semibold">{store.currency}</span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span className={`inline-block w-[72px] text-center px-3 py-1 rounded-full text-xs font-semibold ${store.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
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
                </table>
              </div>

              {/* Pagination */}
              {filteredStores.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredStores.length}
                  perPage={itemsPerPage}
                  itemLabel="stores"
                />
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
