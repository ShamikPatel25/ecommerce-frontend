'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';

export default function CategoriesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', parent: '' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.list();
      const data = res.data;
      if (Array.isArray(data)) setCategories(data);
      else if (data?.results) setCategories(data.results);
      else setCategories([]);
    } catch {
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleCreate = () => {
    setEditCategory(null);
    setFormData({ name: '', slug: '', parent: '' });
    setShowModal(true);
  };

  const handleEdit = (cat) => {
    setEditCategory(cat);
    setFormData({ name: cat.name, slug: cat.slug, parent: cat.parent || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...formData, parent: formData.parent || null };
      if (editCategory) {
        await categoryAPI.update(editCategory.id, data);
        toast.success('Category updated!');
      } else {
        await categoryAPI.create(data);
        toast.success('Category created!');
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.name?.[0] || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoryAPI.delete(id);
      toast.success('Deleted!');
      fetchCategories();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const getLevelBadge = (level) => {
    if (level === 0) return 'bg-blue-100 text-blue-700';
    if (level === 1) return 'bg-purple-100 text-purple-700';
    return 'bg-orange-100 text-orange-700';
  };

  const getLevelName = (level) => {
    if (level === 0) return 'Main';
    if (level === 1) return 'Sub';
    return 'Sub-Sub';
  };

  const getParentName = (parentId) =>
    categories.find((c) => c.id === parentId)?.name || '—';

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'NAME',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-300">{'→'.repeat(row.level)}</span>
          <span className="font-semibold text-gray-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'SLUG',
      accessor: 'slug',
      cell: (row) => (
        <span className="font-mono text-gray-500 text-sm">{row.slug}</span>
      ),
    },
    {
      header: 'LEVEL',
      accessor: 'level',
      cell: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelBadge(row.level)}`}>
          {getLevelName(row.level)}
        </span>
      ),
    },
    {
      header: 'PARENT',
      accessor: 'parent',
      cell: (row) => (
        <span className="text-gray-500 text-sm">
          {row.parent ? getParentName(row.parent) : '—'}
        </span>
      ),
    },
    {
      header: 'PRODUCTS',
      accessor: 'product_count',
      cell: (row) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
          {row.product_count ?? 0}
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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <button
            onClick={() => router.push('/categories/create')}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Category
          </button>
        </div>

        {/* Search */}
        <SearchBar placeholder="Search by name or slug" onSearch={setSearchQuery} />

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredCategories}
          loading={loading}
          onRowClick={(row) => router.push(`/categories/${row.id}/edit`)}
        />
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Clothes, Electronics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="auto-generated"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                >
                  <option value="">None (Main Category)</option>
                  {categories
                    .filter((c) => c.id !== editCategory?.id && c.level < 2)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{'→'.repeat(c.level)} {c.name}</option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                  {submitting ? 'Saving...' : editCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}