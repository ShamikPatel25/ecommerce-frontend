'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productAPI, categoryAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StockIndicator from '@/components/StockIndicator';

export default function ProductsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productAPI.list(),
        categoryAPI.list(),
      ]);

      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.results || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.results || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted!');
      fetchData();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || '';

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'NAME',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {row.image ? (
              <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{row.product_type === 'catalog' ? '📚' : '📦'}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{getCategoryName(row.category)}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'SERIAL',
      accessor: 'sku',
      sortable: true,
      cell: (row) => <span className="font-mono text-gray-600 text-sm">{row.sku}</span>,
    },
    {
      header: 'STOCK',
      accessor: 'stock',
      cell: (row) => {
        if (row.product_type === 'catalog') {
          const variants = row.variants || [];
          if (variants.length === 0) return <span className="text-gray-400">—</span>;
          const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
          return <StockIndicator stock={totalStock} />;
        }
        return <StockIndicator stock={row.stock} />;
      },
    },
    {
      header: 'CATALOG COUNT',
      accessor: 'catalog_count',
      cell: (row) => (
        <div className="text-center">
          {row.product_type === 'catalog' ? (
            <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
              {row.variants?.length || 0}
            </span>
          ) : (
            <span className="text-gray-400">0</span>
          )}
        </div>
      ),
    },
    {
      header: 'PRICE',
      accessor: 'price',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-gray-900">
          {parseFloat(row.price).toLocaleString()}
        </span>
      ),
    },
    {
      header: '',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleDelete(row.id)}
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
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <button
            onClick={() => router.push('/products/create')}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Product
          </button>
        </div>

        {/* Search */}
        <SearchBar
          placeholder="Search by product name"
          onSearch={setSearchQuery}
        />

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          onRowClick={(row) => router.push(`/products/${row.id}/edit`)}
          loading={loading}
        />
      </main>
    </div>
  );
}