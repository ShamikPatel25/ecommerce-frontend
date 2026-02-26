'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { storeAPI, categoryAPI, productAPI, orderAPI } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-orange-100 text-orange-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function StatCard({ icon, label, value, sub, href, loading }) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition group flex flex-col min-h-[150px]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        {href && (
          <span className="text-xs text-gray-400 group-hover:text-orange-500 transition">View all →</span>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-end">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-gray-900 truncate">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5 min-h-[16px]">{sub ?? ''}</p>
          </>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}


export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [ordersRes, productsRes, categoriesRes, storesRes] = await Promise.all([
        orderAPI.list().catch(() => ({ data: [] })),
        productAPI.list().catch(() => ({ data: [] })),
        categoryAPI.list().catch(() => ({ data: [] })),
        storeAPI.list().catch(() => ({ data: [] })),
      ]);

      const orders = toArray(ordersRes.data);
      const products = toArray(productsRes.data);
      const categories = toArray(categoriesRes.data);
      const stores = toArray(storesRes.data);

      // Compute stats
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      const pendingCount = orders.filter(o => o.status === 'pending').length;

      // Low stock: single products with stock ≤ 10, or catalog products where total variant stock ≤ 10
      const lowStock = products.filter(p => {
        if (p.product_type === 'catalog') {
          const total = (p.variants || []).reduce((s, v) => s + (v.stock ?? 0), 0);
          return total <= 10;
        }
        return (p.stock ?? 0) <= 10;
      });

      setStats({
        orders: orders.length,
        revenue: totalRevenue,
        products: products.length,
        categories: categories.length,
        stores: stores.length,
        pending: pendingCount,
      });
      setRecentOrders(orders.slice(0, 5));
      setLowStockProducts(lowStock.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAll();
  }, [user, router, fetchAll]);

  const toArray = (data) =>
    Array.isArray(data) ? data : (data?.results || []);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, <span className="font-medium text-gray-700">{user?.email}</span>!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon="🛒" label="Total Orders" value={stats.orders ?? 0}
            sub={`${stats.pending ?? 0} pending`} href="/orders" loading={loading} />
          <StatCard icon="💰" label="Total Revenue" loading={loading}
            value={loading ? '—' : parseFloat(stats.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            sub="Excluding cancelled orders" href="/orders" />
          <StatCard icon="📦" label="Products" value={stats.products ?? 0}
            href="/products" loading={loading} />
          <StatCard icon="🏪" label="Stores" value={stats.stores ?? 0}
            href="/stores" loading={loading} />
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Recent Orders */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/orders" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="h-4 bg-gray-200 rounded flex-1" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl">📭</span>
                <p className="text-gray-400 mt-2">No orders yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                    <th className="pb-3 text-left">Order</th>
                    <th className="pb-3 text-left">Customer</th>
                    <th className="pb-3 text-left">Total</th>
                    <th className="pb-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(o => (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/orders/${o.id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition"
                    >
                      <td className="py-3 font-mono text-sm font-semibold text-gray-800">#{o.id}</td>
                      <td className="py-3 text-sm text-gray-700">{o.customer_name}</td>
                      <td className="py-3 text-sm font-semibold text-gray-900">
                        {parseFloat(o.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Low Stock Alert */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Low Stock</h2>
                <span className="text-xl">⚠️</span>
              </div>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-200 rounded" />)}
                </div>
              ) : lowStockProducts.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">All products well-stocked ✅</p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map(p => {
                    const stock = p.product_type === 'catalog'
                      ? (p.variants || []).reduce((s, v) => s + (v.stock ?? 0), 0)
                      : (p.stock ?? 0);
                    return (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/products/${p.id}/edit`)}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{p.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.sku}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                          {stock === 0 ? 'Out' : stock}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'Add Product', icon: '📦', href: '/products/create' },
                  { label: 'Add Category', icon: '📁', href: '/categories/create' },
                  { label: 'Add Attribute', icon: '🏷️', href: '/attributes/create' },
                  { label: 'View Orders', icon: '🛒', href: '/orders' },
                ].map(a => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition text-gray-700 text-sm font-medium"
                  >
                    <span>{a.icon}</span> {a.label}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}