'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI, isCancelledError } from '@/lib/api';
import { useStoreStore } from '@/store/storeStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatCurrency } from '@/lib/utils';
import { PIE_COLORS } from '@/lib/constants';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  AlertTriangle, Plus, FolderPlus,
  Tags, ShoppingCart,
} from 'lucide-react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LabelList,
} from 'recharts';

function useWindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize(); // Set initial width on mount
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

const STATUS_BADGE = {
  pending:    { dot: 'bg-yellow-500', pill: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
  confirmed:  { dot: 'bg-blue-500',   pill: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  processing: { dot: 'bg-violet-500', pill: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
  shipped:    { dot: 'bg-cyan-500',   pill: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' },
  delivered:  { dot: 'bg-green-500',  pill: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  cancelled:  { dot: 'bg-red-500',    pill: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  returned:   { dot: 'bg-orange-500', pill: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
};

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
  const { activeStore, stores } = useStoreStore();
  const { getCache, setCache } = useDashboardStore();
  const screenWidth = useWindowWidth();
  const isMobile = screenWidth < 640;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const fetchAll = useCallback(async () => {
    if (!activeStore?.id) {
      setLoading(false);
      return;
    }

    // Use cached data if still fresh (< 60s old)
    const cached = getCache(activeStore.id);
    if (cached && cached.stats && cached.revenueByDay) {
      setStats({ ...cached.stats, stores: stores.length });
      setRecentOrders(cached.recentOrders);
      setLowStockProducts(cached.lowStockProducts);
      setRevenueByDay(cached.revenueByDay);
      setStatusData(cached.statusData);
      setTopProducts(cached.topProducts);
      setLoading(false);
      return;
    }

    try {
      const res = await orderAPI.dashboardStats();
      const data = res.data;

      const nextStats = { ...data.stats, stores: stores.length };
      const nextRecent = data.recent_orders || [];
      const nextLowStock = data.low_stock_products || [];
      const nextRevenue = data.revenue_by_day || [];
      
      const statusChartData = (data.status_data || []).map((item, index) => ({
        name: item.name,
        value: item.value,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }));
      const nextTop = data.top_products || [];

      setStats(nextStats);
      setRecentOrders(nextRecent);
      setLowStockProducts(nextLowStock);
      setRevenueByDay(nextRevenue);
      setStatusData(statusChartData);
      setTopProducts(nextTop);

      // Save to cache
      setCache(activeStore.id, {
        stats: nextStats,
        recentOrders: nextRecent,
        lowStockProducts: nextLowStock,
        revenueByDay: nextRevenue,
        statusData: statusChartData,
        topProducts: nextTop,
      });
    } catch (err) {
      if (!isCancelledError(err)) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [activeStore?.id, getCache, setCache, stores.length]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statCards = [
    {
      label: 'Total Revenue',
      value: loading ? '\u2014' : formatCurrency(stats.revenue || 0, activeStore?.currency),
      change: '+12.5%',
      changeUp: true,
      barColor: 'bg-blue-500',
      barPercent: 78,
    },
    {
      label: 'Orders',
      value: loading ? '\u2014' : (stats.orders ?? 0).toLocaleString(),
      change: '+8.2%',
      changeUp: true,
      barColor: 'bg-slate-300 dark:bg-slate-200',
      barPercent: 65,
    },
    {
      label: 'Customers',
      value: loading ? '\u2014' : (stats.customers ?? 0).toLocaleString(),
      change: '+5.1%',
      changeUp: true,
      barColor: 'bg-teal-500',
      barPercent: 52,
    },
    {
      label: 'Pending',
      value: loading ? '\u2014' : (stats.pending ?? 0).toLocaleString(),
      change: `+${stats.pending ?? 0}`,
      changeUp: false,
      barColor: 'bg-slate-500',
      barPercent: 25,
    },
  ];

  const quickActions = [
    { label: 'Add Product', icon: <Plus size={18} />, href: '/products/create', highlight: true },
    { label: 'Add Category', icon: <FolderPlus size={18} />, href: '/categories/create' },
    { label: 'Add Attribute', icon: <Tags size={18} />, href: '/attributes/create' },
    { label: 'View Orders', icon: <ShoppingCart size={18} />, href: '/orders' },
  ];

  const renderOrdersContent = () => {
    if (loading) {
      return (
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-20" />
            </div>
          ))}
        </div>
      );
    }
    if (recentOrders.length === 0) {
      return (
        <div className="p-12 text-center">
          <ShoppingCart size={40} className="mx-auto text-slate-300 dark:text-gray-600 mb-3" />
          <p className="text-slate-400 dark:text-gray-500 text-sm">No orders yet</p>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th border-b border-gray-200 dark:border-gray-700">Order</th>
              <th className="admin-th border-b border-gray-200 dark:border-gray-700 text-left">Customer</th>
              <th className="admin-th border-b border-gray-200 dark:border-gray-700 text-center">Items</th>
              <th className="admin-th border-b border-gray-200 dark:border-gray-700">Total</th>
              <th className="admin-th border-b border-gray-200 dark:border-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
              >
                <td className="admin-td text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                  {order.order_number}
                </td>
                <td className="admin-td text-left">
                  <div className="flex items-center justify-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex flex-shrink-0 items-center justify-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {getInitials(order.customer_name)}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{order.customer_name || 'Unknown'}</span>
                  </div>
                </td>
                <td className="admin-td text-sm text-slate-500 dark:text-slate-400">
                  {order.items?.length || 0}
                </td>
                <td className="admin-td text-sm text-slate-700 dark:text-slate-300">
                  {formatCurrency(order.total_amount || 0, activeStore?.currency)}
                </td>
                <td className="admin-td">
                  {(() => {
                    const badge = STATUS_BADGE[order.status] || { dot: 'bg-slate-400', pill: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
                    const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                        {statusText}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderLowStockContent = () => {
    if (loading) {
      return (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />)}
        </div>
      );
    }
    if (lowStockProducts.length === 0) {
      return (
        <p className="text-slate-400 dark:text-gray-500 text-sm text-center py-4">All products well-stocked</p>
      );
    }
    return (
      <div className="space-y-1">
        {lowStockProducts.map(p => {
          const stock = p.product_type === 'catalog'
            ? (p.variants || []).reduce((s, v) => s + (v.stock ?? 0), 0)
            : (p.stock ?? 0);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => router.push(`/products/${p.id}/edit`)}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 rounded-lg p-3 transition-colors appearance-none bg-transparent border-none w-full text-left border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 font-mono">{p.sku}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 ml-3 ${stock <= 5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                {stock === 0 ? 'Out of stock' : `${stock} left`}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{card.label}</span>
              {card.change && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${card.changeUp ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400'}`}>
                  {card.change}
                </span>
              )}
            </div>
            <div className="text-[28px] font-bold text-slate-900 dark:text-slate-100 mb-2.5">{card.value}</div>
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${card.barColor}`} style={{ width: `${card.barPercent}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Section */}
      {!loading && stats.orders > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Revenue & Orders Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-[14px] sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100">Revenue & Orders (Last 7 Days)</h3>
            </div>
            <div className="p-2 sm:p-6">
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <ComposedChart accessibilityLayer={false} data={revenueByDay} margin={isMobile ? { top: 10, right: 25, left: -5, bottom: 5 } : { top: 10, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="shadowRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="shadowOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    interval={0}
                    tickFormatter={(value) => {
                      if (!isMobile) return value;
                      // Extract just the day number for mobile (e.g., "May 22" -> "22", "2024-05-22" -> "22")
                      const match = value.match(/(\d{1,2})(?:\D|$)/);
                      if (match) return match[1];
                      return value.slice(-2);
                    }}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: isMobile ? 9 : 12, fill: '#64748b' }}
                    tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 32 : 60}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    tick={{ fontSize: isMobile ? 9 : 12, fill: '#3b82f6' }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 20 : 40}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: isMobile ? '11px' : '12px', color: '#334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value, name) => name === 'Revenue' ? [formatCurrency(value, activeStore?.currency), 'Revenue'] : [value, 'Orders']} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" fill="url(#shadowRevenue)" stroke="none" tooltipType="none" />
                  <Area yAxisId="orders" type="monotone" dataKey="orders" fill="url(#shadowOrders)" stroke="none" tooltipType="none" />
                  <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={isMobile ? 2 : 2.5} name="Revenue" dot={{ r: isMobile ? 3 : 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: isMobile ? 5 : 6, fill: '#8b5cf6' }} />
                  <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" dot={{ r: isMobile ? 2 : 3, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: isMobile ? 4 : 5, fill: '#3b82f6' }} />
                </ComposedChart>
              </ResponsiveContainer>
              {/* Legend below chart */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-violet-500" />
                  <span className="text-[11px] sm:text-xs text-gray-500">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                  <span className="text-[11px] sm:text-xs text-gray-500">Orders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Order Status Distribution</h3>
            </div>
            <div className="px-1 py-2 sm:px-2 sm:py-3">
              <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
                <PieChart accessibilityLayer={false}>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 35 : 55}
                    outerRadius={isMobile ? 60 : 90}
                    paddingAngle={4}
                    dataKey="value"
                    activeShape={false}
                    stroke="none"
                    label={({ cx, cy, midAngle, outerRadius: oR, name, percent, fill: sliceColor }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = oR + (isMobile ? 15 : 25);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={isMobile ? 10 : 12} fontWeight={600} fill={sliceColor}>
                          {`${name} (${(percent * 100).toFixed(0)}%)`}
                        </text>
                      );
                    }}
                    labelLine={({ cx, cy, midAngle, outerRadius: oR, stroke }) => {
                      const RADIAN = Math.PI / 180;
                      const startX = cx + oR * Math.cos(-midAngle * RADIAN);
                      const startY = cy + oR * Math.sin(-midAngle * RADIAN);
                      const endX = cx + (oR + (isMobile ? 12 : 20)) * Math.cos(-midAngle * RADIAN);
                      const endY = cy + (oR + (isMobile ? 12 : 20)) * Math.sin(-midAngle * RADIAN);
                      return <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={stroke} strokeWidth={1.5} />;
                    }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip isAnimationActive={false} animationDuration={0} wrapperStyle={{ transition: 'none' }} cursor={false} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#334155' }} formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Products by Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Top 5 Products by Revenue</h3>
            </div>
            <div className="p-2 sm:p-6">
              {topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-slate-400 dark:text-gray-500 text-sm">No product data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
                  <BarChart accessibilityLayer={false} data={topProducts} margin={isMobile ? { top: 20, right: 5, left: -15, bottom: 5 } : { top: 25, right: 20, left: 10, bottom: 5 }}>
                    <XAxis dataKey="sku" tick={{ fontSize: isMobile ? 9 : 12, fill: '#64748b' }} interval={0} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 50 : 30} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={isMobile ? 40 : 60} axisLine={false} tickLine={false} />
                    <Tooltip isAnimationActive={false} animationDuration={0} wrapperStyle={{ transition: 'none' }} cursor={false} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const { name, revenue } = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs">
                          <p className="font-semibold text-slate-900 dark:text-white">{name}</p>
                          <p className="text-violet-500 font-bold mt-1">{formatCurrency(revenue, activeStore?.currency)}</p>
                        </div>
                      );
                    }} />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={isMobile ? 24 : 36} stroke="none">
                      <LabelList dataKey="revenue" position="top" formatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`} style={{ fontSize: isMobile ? 9 : 11, fontWeight: 600, fill: '#64748b' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent Orders Table */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Recent Orders</h3>
            <Link href="/orders" className="text-violet-500 text-[13px] font-medium hover:underline">
              View All Orders
            </Link>
          </div>
          {renderOrdersContent()}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Low Stock Alert */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Low Stock Alert</h3>
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div className="px-5 py-3">
              {renderLowStockContent()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
            </div>
            <div>
              {quickActions.map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`flex items-center gap-3.5 px-6 py-3.5 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 transition-colors text-sm font-medium ${
                    a.highlight
                      ? 'bg-violet-500/5 text-violet-500 hover:bg-violet-500/10'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="text-violet-500">{a.icon}</span>
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
