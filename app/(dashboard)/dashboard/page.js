'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { storeAPI, categoryAPI, productAPI, orderAPI } from '@/lib/api';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import {
  DollarSign, ShoppingBag, Package, Users,
  MoreHorizontal, AlertTriangle, Plus, FolderPlus,
  Tags, ShoppingCart,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  processing: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  shipped: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  delivered: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#f97316', '#10b981', '#22c55e', '#ef4444'];

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const toArray = (data) =>
    Array.isArray(data) ? data : (data?.results || []);

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

      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      const pendingCount = orders.filter(o => o.status === 'pending').length;

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
      setAllOrders(orders);
      setRecentOrders(orders.slice(0, 5));
      setLowStockProducts(lowStock.slice(0, 5));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- Chart data computations ---

  // Revenue by day (last 7 days)
  const revenueByDay = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOrders = allOrders.filter(o => o.created_at?.startsWith(key) && o.status !== 'cancelled');
      days.push({
        date: label,
        revenue: dayOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
        orders: dayOrders.length,
      });
    }
    return days;
  }, [allOrders]);

  // Status distribution for pie
  const statusData = useMemo(() => {
    const counts = {};
    allOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allOrders]);

  // Top products by revenue (from order items)
  const topProducts = useMemo(() => {
    const map = {};
    allOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const name = item.product_name || item.product?.name || `Product #${item.product}`;
        map[name] = (map[name] || 0) + parseFloat(item.unit_price || 0) * (item.quantity || 1);
      });
    });
    return Object.entries(map)
      .map(([name, revenue]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [allOrders]);

  const statCards = [
    {
      label: 'Total Sales',
      value: loading ? '\u2014' : `$${parseFloat(stats.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
      icon: <DollarSign size={22} />,
      sub: 'Excluding cancelled orders',
      href: '/orders',
    },
    {
      label: 'Orders',
      value: loading ? '\u2014' : (stats.orders ?? 0).toLocaleString(),
      icon: <ShoppingBag size={22} />,
      sub: `${stats.pending ?? 0} pending`,
      href: '/orders',
    },
    {
      label: 'Products',
      value: loading ? '\u2014' : (stats.products ?? 0).toLocaleString(),
      icon: <Package size={22} />,
      sub: `${stats.categories ?? 0} categories`,
      href: '/products',
    },
    {
      label: 'Stores',
      value: loading ? '\u2014' : (stats.stores ?? 0).toLocaleString(),
      icon: <Users size={22} />,
      sub: 'Active stores',
      href: '/stores',
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            Welcome back, <span className="font-medium text-slate-700 dark:text-gray-300">{user?.email}</span>. Here is what is happening with your store today.
          </p>
        </div>
        <div className="hidden md:block flex-shrink-0">
          <TopBar />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const content = (
            <div key={card.label} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">{card.label}</p>
                <span className="text-orange-500">{card.icon}</span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                {loading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</h3>
                )}
              </div>
              {card.sub && (
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">{card.sub}</p>
              )}
            </div>
          );
          return card.href ? <Link key={card.label} href={card.href}>{content}</Link> : content;
        })}
      </div>

      {/* Analytics Charts Section */}
      {!loading && allOrders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Orders Chart - Full Width */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue &amp; Orders (Last 7 Days)</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6600" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6600" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff8533" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ff8533" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value, name) =>
                      name === 'revenue'
                        ? [`$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']
                        : [value, 'Orders']
                    }
                  />
                  <Legend />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ff6600"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    name="Revenue"
                  />
                  <Area
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    stroke="#ff8533"
                    strokeWidth={2}
                    fill="url(#ordersGradient)"
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Distribution - Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Status Distribution</h3>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Products by Revenue - Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top 5 Products by Revenue</h3>
            </div>
            <div className="p-6">
              {topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-slate-400 dark:text-gray-500 text-sm">No product data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(v) => `$${v.toLocaleString()}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value) => [`$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#ff6600" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Orders</h3>
            <Link href="/orders" className="text-orange-500 text-sm font-bold hover:underline">
              View All Orders
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="h-4 bg-gray-200 rounded flex-1" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 dark:text-gray-500 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-700/50 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Order ID</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Items</th>
                    <th className="px-6 py-4 font-semibold">Total</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map(order => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        #ORD-{String(order.id).padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-gray-300">
                            {getInitials(order.customer_name)}
                          </div>
                          <span className="text-sm text-slate-600 dark:text-gray-300">{order.customer_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-300">
                        {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'Item' : 'Items'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                        ${parseFloat(order.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}`);
                          }}
                          className="text-slate-400 dark:text-gray-500 hover:text-orange-500 transition-colors"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Low Stock Alert</h3>
              <AlertTriangle size={20} className="text-orange-500" />
            </div>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-200 rounded" />)}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-slate-400 dark:text-gray-500 text-sm text-center py-4">All products well-stocked</p>
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
                      className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg p-2.5 -mx-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">{p.sku}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ml-3 ${stock === 0 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                        {stock === 0 ? 'Out of stock' : `${stock} left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { label: 'Add Product', icon: <Plus size={18} />, href: '/products/create' },
                { label: 'Add Category', icon: <FolderPlus size={18} />, href: '/categories/create' },
                { label: 'Add Attribute', icon: <Tags size={18} />, href: '/attributes/create' },
                { label: 'View Orders', icon: <ShoppingCart size={18} />, href: '/orders' },
              ].map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors text-slate-700 dark:text-gray-300 text-sm font-medium"
                >
                  {a.icon}
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
