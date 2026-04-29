'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Download, Search, ShoppingBag, SlidersHorizontal,
} from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';

const PER_PAGE = 10;

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
  pending:          { dot: 'bg-yellow-500', pill: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
  confirmed:        { dot: 'bg-blue-500',   pill: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  processing:       { dot: 'bg-orange-500', pill: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  shipped:          { dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  delivered:        { dot: 'bg-green-500',  pill: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  cancelled:        { dot: 'bg-red-500',    pill: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  return_requested: { dot: 'bg-amber-500',  pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  returned:         { dot: 'bg-rose-500',   pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeStatus, setActiveStatus] = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [page,         setPage]         = useState(1);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('pointerdown', handleClick);
    return () => {
      document.removeEventListener('pointerdown', handleClick);
    };
  }, [filterOpen]);

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
    <div className="admin-page">
      <div className="admin-container">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Orders</h2>
            <p className="admin-subtitle">Manage and track all customer transactions and delivery status.</p>
          </div>
          <button
            onClick={exportCSV}
            className="admin-btn-primary"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="admin-search-wrapper" ref={filterRef}>
          <div className="admin-search-box">
            <div className="admin-search-icon">
              <Search size={20} />
            </div>
            <input
              className="admin-search-input"
              placeholder="Search orders by customer name or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={activeStatus !== 'all' ? 'admin-filter-toggle-active' : 'admin-filter-toggle'}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {filterOpen && (
            <div className="admin-filters-mobile">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { switchTab(tab.value); setFilterOpen(false); }}
                  className={activeStatus === tab.value ? 'admin-filter-mobile-item-active' : 'admin-filter-mobile-item'}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="admin-filters">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => switchTab(tab.value)}
              className={activeStatus === tab.value ? 'admin-filter-btn-active' : 'admin-filter-btn'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DataTable Container */}
        <div className="admin-table-card">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
            </div>
          ) : (
            <>
              {paginated.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-text">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No orders found</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search or filters.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="admin-table min-w-[800px]">
                    <thead>
                      <tr className="admin-thead-row">
                        <th className="admin-th lg:w-[12%]">Order #</th>
                        <th className="admin-th lg:w-[25%]">Customer</th>
                        <th className="admin-th lg:w-[12%]">Items</th>
                        <th className="admin-th lg:w-[15%]">Total Price</th>
                        <th className="admin-th lg:w-[20%]">Status</th>
                        <th className="admin-th lg:w-[16%] text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="admin-tbody">
                      {paginated.map((order) => {
                        const badge = STATUS_BADGE[order.status] || { dot: 'bg-slate-400', pill: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };

                        let statusText;
                        if (order.status === 'return_requested') statusText = 'Return Requested';
                        else if (order.status === 'returned') statusText = 'Returned';
                        else statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);

                        return (
                          <tr
                            key={order.id}
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="admin-tr group"
                          >
                            <td className="admin-td font-mono font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                              #{order.id}
                            </td>
                            <td className="admin-td max-w-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                                  {(order.customer_name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{order.customer_name}</p>
                                  {order.customer_email && (
                                    <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{order.customer_email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="admin-td text-sm text-slate-500 dark:text-gray-400 whitespace-nowrap">
                              {order.items_count ?? 0} item{(order.items_count ?? 0) === 1 ? '' : 's'}
                            </td>
                            <td className="admin-td">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(order.total_amount || 0, activeStore?.currency)}
                              </span>
                            </td>
                            <td className="admin-td whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.pill}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                                {statusText}
                              </span>
                            </td>
                            <td className="admin-td text-sm text-slate-400 dark:text-gray-500 text-right whitespace-nowrap">
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
