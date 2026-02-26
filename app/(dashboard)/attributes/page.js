'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { attributeAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';

export default function AttributesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user, router, fetchData]);

  const handleDeleteAttribute = async (id) => {
    const attr = attributes.find(a => a.id === id);
    if (!confirm(`Delete "${attr?.name}"? All values will be deleted too.`)) return;
    try {
      await attributeAPI.delete(id);
      toast.success('Attribute deleted!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const getCategoryName = (catId) =>
    categories.find((c) => c.id === catId)?.name || 'Uncategorized';

  const filteredAttributes = attributes.filter(a =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCategoryName(a.category)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'ATTRIBUTE',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-gray-900">{row.name}</span>
      ),
    },
    {
      header: 'CATEGORY',
      accessor: 'category',
      cell: (row) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {getCategoryName(row.category)}
        </span>
      ),
    },
    {
      header: 'VALUES',
      accessor: 'values',
      cell: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.values?.length > 0 ? (
            <>
              {row.values.slice(0, 6).map((v) => (
                <span
                  key={v.id}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {v.value}
                </span>
              ))}
              {row.values.length > 6 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                  +{row.values.length - 6} more
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-xs italic">No values yet</span>
          )}
        </div>
      ),
    },
    {
      header: 'COUNT',
      accessor: 'values_count',
      cell: (row) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
          {row.values?.length ?? 0}
        </span>
      ),
    },
    {
      header: '',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleDeleteAttribute(row.id)}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
          >
            🗑️
          </button>
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
          <h1 className="text-3xl font-bold text-gray-900">Attributes</h1>
          <button
            onClick={() => router.push('/attributes/create')}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Attribute
          </button>
        </div>

        {/* Search */}
        <SearchBar placeholder="Search by attribute name or category" onSearch={setSearchQuery} />

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredAttributes}
          loading={loading}
          onRowClick={(row) => router.push(`/attributes/${row.id}/edit`)}
        />
      </main>
    </div>
  );
}