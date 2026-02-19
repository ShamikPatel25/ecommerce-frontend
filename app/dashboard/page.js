'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { storeAPI, categoryAPI, productAPI } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({ stores: 0, products: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      console.log('🔄 Fetching dashboard stats...'); // Debug
      
      // Fetch all data
      const [storesRes, productsRes, categoriesRes] = await Promise.all([
        storeAPI.list().catch(err => {
          console.error('Stores API error:', err);
          return { data: [] };
        }),
        productAPI.list().catch(err => {
          console.error('Products API error:', err);
          return { data: [] };
        }),
        categoryAPI.list().catch(err => {
          console.error('Categories API error:', err);
          return { data: [] };
        }),
      ]);

      console.log('📊 API Responses:', { storesRes, productsRes, categoriesRes }); // Debug

      // Handle stores data
      let storesCount = 0;
      const storesData = storesRes.data;
      if (Array.isArray(storesData)) {
        storesCount = storesData.length;
      } else if (storesData?.results && Array.isArray(storesData.results)) {
        storesCount = storesData.results.length;
      } else if (storesData?.count) {
        storesCount = storesData.count;
      }

      // Handle products data
      let productsCount = 0;
      const productsData = productsRes.data;
      if (Array.isArray(productsData)) {
        productsCount = productsData.length;
      } else if (productsData?.results && Array.isArray(productsData.results)) {
        productsCount = productsData.results.length;
      } else if (productsData?.count) {
        productsCount = productsData.count;
      }

      // Handle categories data
      let categoriesCount = 0;
      const categoriesData = categoriesRes.data;
      if (Array.isArray(categoriesData)) {
        categoriesCount = categoriesData.length;
      } else if (categoriesData?.results && Array.isArray(categoriesData.results)) {
        categoriesCount = categoriesData.results.length;
      } else if (categoriesData?.count) {
        categoriesCount = categoriesData.count;
      }

      console.log('✅ Counts:', { storesCount, productsCount, categoriesCount }); // Debug

      setStats({
        stores: storesCount,
        products: productsCount,
        categories: categoriesCount,
      });
    } catch (err) {
      console.error('❌ Dashboard stats error:', err);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Stores', value: stats.stores, icon: '🏪', href: '/stores', color: 'blue' },
    { label: 'Total Products', value: stats.products, icon: '📦', href: '/products', color: 'green' },
    { label: 'Categories', value: stats.categories, icon: '📁', href: '/categories', color: 'purple' },
  ];

  const actions = [
    { label: 'Create Store', desc: 'Set up a new store', href: '/stores', icon: '🏪' },
    { label: 'Add Product', desc: 'Create new product', href: '/products', icon: '📦' },
    { label: 'Add Category', desc: 'Organize products', href: '/categories', icon: '📁' },
    { label: 'Add Attribute', desc: 'Define variants', href: '/attributes', icon: '🏷️' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.email}!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))
          ) : (
            cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 cursor-pointer group"
              >
                <span className="text-4xl block mb-3">{card.icon}</span>
                <p className="text-gray-500 text-sm mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                  {card.value}
                </p>
              </Link>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group"
              >
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}