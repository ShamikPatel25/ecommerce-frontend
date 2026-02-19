'use client';

import { useState, useEffect } from 'react';
import { storeAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/Sidebar';

export default function StoresPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStore, setEditStore] = useState(null);
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
      // Handle different response formats
      const data = response.data;
      if (Array.isArray(data)) {
        setStores(data);
      } else if (data?.results && Array.isArray(data.results)) {
        setStores(data.results);
      } else if (typeof data === 'object') {
        setStores([data]);
      } else {
        setStores([]);
      }
    } catch (error) {
      console.error('Fetch stores error:', error);
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
    setFormData({
      name: store.name,
      subdomain: store.subdomain,
      description: store.description || '',
      currency: store.currency,
    });
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
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
            <p className="text-gray-500 mt-1">Manage your tenant stores</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Create Store
          </button>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : !Array.isArray(stores) || stores.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
            <span className="text-6xl">🏪</span>
            <h3 className="text-xl font-semibold text-gray-900 mt-4">No stores yet</h3>
            <p className="text-gray-500 mt-2">Create your first store</p>
            <button onClick={handleCreate} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Create Store
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div key={store.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">🏪</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {store.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{store.name}</h3>
                <p className="text-sm text-blue-600 mb-2">{store.subdomain}.myplatform.com</p>
                {store.description && <p className="text-sm text-gray-500 mb-4">{store.description}</p>}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleEdit(store)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">✏️ Edit</button>
                  <button onClick={() => handleDelete(store.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold">{editStore ? 'Edit Store' : 'Create Store'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl">×</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
                  <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="My Awesome Store" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subdomain *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <input type="text" className="flex-1 px-4 py-3 focus:outline-none" placeholder="mystore" value={formData.subdomain} onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase()})} required disabled={!!editStore} />
                    <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm border-l">.myplatform.com</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Describe your store..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{submitting ? 'Saving...' : editStore ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}