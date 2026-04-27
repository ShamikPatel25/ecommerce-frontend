'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Download, Search, ShoppingBag,
} from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { formatDate } from '@/lib/utils';

const PER_PAGE = 15;

const STATUS_TABS = [
  { label: 'All Orders',       value: '' },
  { label: 'Pending',          value: 'pending' },
  { label: 'Confirmed',        value: 'confirmed' },
  { label: 'Processing',       value: 'processing' },
  { label: 'Shipped',          value: 'shipped' },
  { label: 'Delivered',        value: 'delivered' },
  { label: 'Cancelled',        value: 'cancelled' },
  { label: 'Return Requested', value: 'return_requested' },
  { label: 'Returned',         value: 'returned' },
];

/* dot color + pill color per status */
const STATUS_BADGE = {
  pending:          { dot: 'bg-slate-500',   pill: 'bg-slate-100 dark:bg-gray-700   text-slate-700 dark:text-gray-300'  },
  confirmed:        { dot: 'bg-blue-500',    pill: 'bg-blue-100 dark:bg-blue-900/30    text-blue-700 dark:text-blue-400'   },
  processing:       { dot: 'bg-orange-500',  pill: 'bg-orange-100 dark:bg-orange-900/30  text-orange-700 dark:text-orange-400' },
  shipped:          { dot: 'bg-emerald-500', pill: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'},
  delivered:        { dot: 'bg-green-500',   pill: 'bg-green-100 dark:bg-green-900/30   text-green-700 dark:text-green-400'  },
  cancelled:        { dot: 'bg-red-500',     pill: 'bg-red-100 dark:bg-red-900/30     text-red-700 dark:text-red-400'    },
  return_requested: { dot: 'bg-amber-500',   pill: 'bg-amber-100 dark:bg-amber-900/30   text-amber-700 dark:text-amber-400'  },
  returned:         { dot: 'bg-rose-500',    pill: 'bg-rose-100 dark:bg-rose-900/30    text-rose-600 dark:text-rose-400'   },
};

export default function OrdersPage() {
  const router = useRouter();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeStatus, setActiveStatus] = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [page,         setPage]         = useState(1);

  /* ── fetch ── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await orderAPI.list(activeStatus);
      const data = res.data;
      setOrders(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchOrders();
  }, [activeStatus, fetchOrders]);

  /* ── search filter ── */
  const lowerQuery = searchQuery.toLowerCase().trim();
  const idQuery = lowerQuery.replace(/^#/, '');

  const filtered = orders.filter((o) =>
    o.customer_name?.toLowerCase().includes(lowerQuery) ||
    String(o.id).includes(idQuery)
  );

  /* ── pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const switchTab = (value) => {
    setActiveStatus(value);
    setPage(1);
    setSearchQuery('');
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  /* ── CSV export ── */
  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No orders to export');
      return;
    }
    const headers = ['Order #', 'Customer', 'Email', 'Phone', 'Items', 'Total', 'Status', 'Date'];
    const rows = filtered.map((o) => [
      o.id,
      `"${(o.customer_name || '').replaceAll('"', '""')}"`,
      `"${(o.customer_email || '').replaceAll('"', '""')}"`,
      `"${(o.customer_phone || '').replaceAll('"', '""')}"`,
      o.items_count ?? o.items?.length ?? 0,
      Number.parseFloat(o.total_amount || 0).toFixed(2),
      o.status,
      o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} orders`);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Orders</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage and track all customer transactions and delivery status.</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 cursor-pointer rounded-lg h-11 px-6 bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <div className="text-slate-400 dark:text-gray-500 flex items-center justify-center px-4">
              <Search size={20} />
            </div>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white text-base placeholder:text-slate-400 dark:placeholder:text-gray-500"
              placeholder="Search orders by customer name or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* DataTable Container */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          {/* Status Tabs */}
          <div className="border-b border-slate-200 dark:border-gray-700 px-6 overflow-x-auto">
            <div className="flex gap-6 whitespace-nowrap">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => switchTab(tab.value)}
                  className={`py-4 text-sm border-b-2 transition-colors ${
                    activeStatus === tab.value
                      ? 'border-orange-500 text-orange-500 font-bold'
                      : 'border-transparent text-slate-500 dark:text-gray-400 font-semibold hover:text-slate-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              {paginated.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="text-slate-400 dark:text-gray-500">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No orders found</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or filters.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300">
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[12%]">Order #</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[25%]">Customer</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[12%]">Items</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[15%]">Total Price</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[20%]">Status</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider w-[16%] text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                      {paginated.map((order) => {
                        const badge = STATUS_BADGE[order.status] || { dot: 'bg-slate-400', pill: 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300' };

                        let statusText;
                        if (order.status === 'return_requested') statusText = 'Return Requested';
                        else if (order.status === 'returned') statusText = 'Returned';
                        else statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);

                        return (
                          <tr
                            key={order.id}
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="hover:bg-slate-50/50 dark:hover:bg-gray-700 transition-colors group cursor-pointer"
                          >
                            <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                              #{order.id}
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.customer_name}</p>
                              {order.customer_email && (
                                <p className="text-xs text-slate-400 dark:text-gray-500">{order.customer_email}</p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-500 dark:text-gray-400 whitespace-nowrap">
                              {order.items_count ?? 0} item{(order.items_count ?? 0) === 1 ? '' : 's'}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                ${Number.parseFloat(order.total_amount || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.pill}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                                {statusText}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-400 dark:text-gray-500 text-right whitespace-nowrap">
                              {formatDate(order.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={filtered.length}
                  perPage={PER_PAGE}
                  itemLabel="orders"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
