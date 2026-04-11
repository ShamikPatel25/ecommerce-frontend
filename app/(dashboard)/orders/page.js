'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Download, Search,
  Loader2, ShoppingBag,
} from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';

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

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

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
  const idQuery = lowerQuery.replace(/^#/, ''); // Allow searching both "#123" and "123"
  
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

  /* ──────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-8">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Orders</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">
            Manage and track all customer transactions and delivery status.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-700 dark:text-gray-300 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">

        {/* Status Tabs */}
        <div className="border-b border-slate-200 dark:border-gray-700 px-6 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => switchTab(tab.value)}
                className={`py-4 text-sm border-b-2 transition-colors ${
                  activeStatus === tab.value
                    ? 'border-[#ff6600] text-[#ff6600] font-bold'
                    : 'border-transparent text-slate-500 dark:text-gray-400 font-semibold hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by customer or order #"
              className="w-full bg-slate-100 dark:bg-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#ff6600]/30 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all border border-transparent focus:border-[#ff6600]/20"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table body */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
          </div>
        )}
        {!loading && paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-gray-500">
            <ShoppingBag className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No orders found.</p>
          </div>
        )}
        {!loading && paginated.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Date</th>
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
                      className="hover:bg-slate-50/60 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
                    >
                      {/* Order # */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                        #{order.id}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.customer_name}</p>
                        {order.customer_email && (
                          <p className="text-xs text-slate-400 dark:text-gray-500">{order.customer_email}</p>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-gray-400 whitespace-nowrap">
                        {order.items_count ?? 0} item{(order.items_count ?? 0) === 1 ? '' : 's'}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        ${Number.parseFloat(order.total_amount || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                          {statusText}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-500 text-right whitespace-nowrap">
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
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          perPage={PER_PAGE}
          itemLabel="orders"
        />
      </div>
    </div>
  );
}
