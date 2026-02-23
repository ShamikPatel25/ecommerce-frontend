'use client';

import { useState, useEffect } from 'react';
import { storeAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';

export default function StoresPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    currency: 'USD',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchStores();
  }, [user]);

  const fetchStores = async () => {
    try {
      const response = await storeAPI.list();
      const data = response.data;
      if (Array.isArray(data)) setStores(data);
      else if (data?.results) setStores(data.results);
      else if (typeof data === 'object') setStores([data]);
      else setStores([]);
    } catch (error) {
      toast.error('Failed to fetch stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditStore(null);
    setFormData({ name: '', subdomain: '', description: '', currency: 'USD' });
    setShowModal(true);
  };

  const handleEdit = (store) => {
    setEditStore(store);
    setFormData({ name: store.name, subdomain: store.subdomain, description: store.description || '', currency: store.currency });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editStore) {
        await storeAPI.update(editStore.id, formData);
        toast.success('Store updated!');
      } else {
        await storeAPI.create(formData);
        toast.success('Store created!');
      }
      setShowModal(false);
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.subdomain?.[0] || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this store?')) return;
    try {
      await storeAPI.delete(id);
      toast.success('Store deleted!');
      fetchStores();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredStores = stores.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'STORE',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">🏪</div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-xs text-blue-600">{row.subdomain}.myplatform.com</p>
          </div>
        </div>
      ),
    },
    {
      header: 'DESCRIPTION',
      accessor: 'description',
      cell: (row) => (
        <span className="text-gray-500 text-sm">{row.description || '—'}</span>
      ),
    },
    {
      header: 'CURRENCY',
      accessor: 'currency',
      cell: (row) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold">{row.currency}</span>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'is_active',
      cell: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: '',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleDelete(row.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm">🗑️</button>
        </div>
      ),
    },
  ];

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
          <button
            onClick={() => router.push('/stores/create')}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create Store
          </button>
        </div>

        {/* Search */}
        <SearchBar placeholder="Search by store name or subdomain" onSearch={setSearchQuery} />

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredStores}
          loading={loading}
          onRowClick={(row) => router.push(`/stores/${row.id}/edit`)}
        />
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editStore ? 'Edit Store' : 'Create Store'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="My Awesome Store" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subdomain *</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                  <input type="text" className="flex-1 px-4 py-3 focus:outline-none" placeholder="mystore" value={formData.subdomain} onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })} required disabled={!!editStore} />
                  <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm border-l">.myplatform.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3} placeholder="Describe your store..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                  {submitting ? 'Saving...' : editStore ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}