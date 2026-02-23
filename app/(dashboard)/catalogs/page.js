'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { productAPI } from '@/lib/api';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import DataTable from '@/components/DataTable';
import SearchBar from '@/components/SearchBar';
import StockIndicator from '@/components/StockIndicator';

export default function CatalogsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchCatalogs();
  }, [user]);

  const fetchCatalogs = async () => {
    try {
      // Fetch all products
      const response = await productAPI.list();
      const products = Array.isArray(response.data) ? response.data : response.data?.results || [];
      
      // Get all catalog products
      const catalogProducts = products.filter(p => p.product_type === 'catalog');
      
      // Fetch variants for each catalog product
      const allVariants = [];
      for (const product of catalogProducts) {
        const productDetail = await productAPI.get(product.id);
        const variants = productDetail.data?.variants || [];
        
        variants.forEach(variant => {
          allVariants.push({
            ...variant,
            product_name: product.name,
            product_id: product.id,
          });
        });
      }
      
      setCatalogs(allVariants);
    } catch (error) {
      console.error('Fetch catalogs error:', error);
      toast.error('Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalogs = catalogs.filter(c =>
    c.variant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'NAME',
      accessor: 'variant_name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.variant_name || row.sku}</p>
          <div className="flex gap-2 mt-1">
            {row.attributes?.map((attr, idx) => (
              <span key={idx} className="text-xs text-gray-500">
                {attr.attribute_name}: {attr.value}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      header: 'PRODUCT NAME',
      accessor: 'product_name',
      cell: (row) => <span className="text-gray-600">{row.product_name}</span>,
    },
    {
      header: 'STOCK',
      accessor: 'stock',
      cell: (row) => <StockIndicator stock={row.stock} />,
    },
    {
      header: 'PRICE',
      accessor: 'price',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-gray-900">
          {parseFloat(row.price).toLocaleString('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
          })}
        </span>
      ),
    },
    {
      header: '',
      accessor: 'actions',
      cell: (row) => (
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      ),
    },
  ];

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Catalogs</h1>
        </div>

        {/* Search */}
        <SearchBar
          placeholder="Search by catalog name"
          onSearch={setSearchQuery}
        />

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredCatalogs}
          loading={loading}
        />
      </main>
    </div>
  );
}