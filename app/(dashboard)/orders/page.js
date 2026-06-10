'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI, isCancelledError } from '@/lib/api';
import { toast } from 'sonner';
import {
  Download, Search, ShoppingBag, SlidersHorizontal, X,
} from 'lucide-react';
import Pagination from '@/components/dashboard/Pagination';
import DataError from '@/components/dashboard/DataError';
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
  { label: 'Returned',         value: 'returned' },
];

/* dot color + pill color per status */
const STATUS_BADGE = {
  pending:          { dot: 'bg-yellow-500', pill: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
  confirmed:        { dot: 'bg-blue-500',   pill: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  processing:       { dot: 'bg-violet-500', pill: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
  shipped:          { dot: 'bg-cyan-500',   pill: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' },
  delivered:        { dot: 'bg-green-500',  pill: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  cancelled:        { dot: 'bg-red-500',    pill: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  returned:         { dot: 'bg-orange-500', pill: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { activeStore } = useStoreStore();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [activeStatus, setActiveStatus] = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [page,         setPage]         = useState(1);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const filterRef = useRef(null);
  const fetchingRef = useRef(false);
  const lastStatusRef = useRef('');

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
  const fetchOrders = useCallback(async (status) => {
    if (fetchingRef.current && lastStatusRef.current === status) return;
    fetchingRef.current = true;
    lastStatusRef.current = status;
    setLoading(true);
    setError(false);
    try {
      const res  = await orderAPI.list(status);
      const data = res.data;
      setOrders(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      if (!isCancelledError(err)) {
        setError(true);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeStatus);
  }, [activeStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── search filter ── */
  const lowerQuery = searchQuery.toLowerCase().trim();
  const idQuery = lowerQuery.replace(/^#/, '').replace(/^ord-/i, '');

  // Filter by search only (API handles status filtering)
  const filtered = orders.filter((o) => {
    if (!lowerQuery) return true;
    return (
      o.customer_name?.toLowerCase().includes(lowerQuery) ||
      o.order_number?.toLowerCase().includes(lowerQuery) ||
      o.order_number?.replace('ORD-', '').toLowerCase().includes(idQuery)
    );
  });

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
    const headers = ['Order #', 'Customer', 'Email', 'Phone', 'Active Items', 'Total Items', 'Total Price', 'Status', 'Date'];
    const rows = filtered.map((o) => {
      const activeCount = o.active_items_count ?? o.items_count ?? 0;
      const totalCount = o.items_count ?? 0;
      const isOrderFinal = ['cancelled', 'returned'].includes(o.status);
      // If order is cancelled/returned, show original total; otherwise show active_total
      const displayTotal = isOrderFinal
        ? (o.total_amount ?? 0)
        : (o.active_total ?? o.total_amount ?? 0);
      return [
        o.order_number,
        `"${(o.customer_name || '').replaceAll('"', '""')}"`,
        `"${(o.customer_email || '').replaceAll('"', '""')}"`,
        `"${(o.customer_phone || '').replaceAll('"', '""')}"`,
        activeCount,
        totalCount,
        Number.parseFloat(displayTotal || 0).toFixed(2),
        o.status,
        o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
      ];
    });
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="flex items-center justify-center px-3 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            )}
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
          ) : error ? (
            <DataError message="Failed to load orders" onRetry={() => fetchOrders(activeStatus)} retrying={loading} />
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
                        <th className="admin-th lg:w-[12%]">Order</th>
                        <th className="admin-th lg:w-[25%] text-left">Customer</th>
                        <th className="admin-th lg:w-[12%]">Items</th>
                        <th className="admin-th lg:w-[15%]">Total Price</th>
                        <th className="admin-th lg:w-[20%]">Status</th>
                        <th className="admin-th lg:w-[16%]">Date</th>
                      </tr>
                    </thead>
                    <tbody className="admin-tbody">
                      {paginated.map((order) => {
                        const badge = STATUS_BADGE[order.status] || { dot: 'bg-slate-400', pill: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };

                        const activeCount = order.active_items_count ?? order.items_count ?? 0;
                        const totalCount = order.items_count ?? 0;
                        const allItemsInactive = activeCount === 0 && totalCount > 0;

                        // If order status is final OR all items are inactive → treat as final
                        const isOrderFinal = ['cancelled', 'returned'].includes(order.status) || allItemsInactive;
                        const hasInactiveItems = activeCount < totalCount;

                        // Determine display status
                        let displayStatus = order.status;
                        let statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);

                        // If all items inactive but order status not updated, determine correct status
                        if (allItemsInactive && !['cancelled', 'returned'].includes(order.status)) {
                          // Check if any items are returned - if so, order should show Returned
                          const hasReturnedItems = order.items?.some(i => i.status === 'returned');
                          if (hasReturnedItems) {
                            displayStatus = 'returned';
                            statusText = 'Returned';
                          } else {
                            displayStatus = 'cancelled';
                            statusText = 'Cancelled';
                          }
                        }
                        if (order.status === 'returned') statusText = 'Returned';

                        const displayBadge = STATUS_BADGE[displayStatus] || badge;

                        // If order is final (cancelled/returned/all items inactive), show original total_amount
                        // Otherwise show active_total
                        const displayTotal = isOrderFinal
                          ? (order.total_amount ?? 0)
                          : (order.active_total ?? order.total_amount ?? 0);

                        return (
                          <tr
                            key={order.id}
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="admin-tr group"
                          >
                            <td className="admin-td font-mono font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                              {order.order_number}
                            </td>
                            <td className="admin-td text-left">
                              <div className="flex items-center justify-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                                  {(order.customer_name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">{order.customer_name}</p>
                                  {order.customer_email && (
                                    <p className="text-xs text-slate-400 dark:text-gray-500 whitespace-nowrap">{order.customer_email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="admin-td text-sm whitespace-nowrap">
                              {isOrderFinal ? (
                                // Order fully cancelled/returned - show total count only
                                <span className="text-slate-900 dark:text-white">{totalCount}</span>
                              ) : hasInactiveItems ? (
                                // Some items cancelled/returned - show active/total
                                <span>
                                  <span className="text-slate-900 dark:text-white font-medium">{activeCount}</span>
                                  <span className="text-slate-400 dark:text-gray-500">/{totalCount}</span>
                                </span>
                              ) : (
                                // All items active - show total
                                <span className="text-slate-900 dark:text-white">{totalCount}</span>
                              )}
                            </td>
                            <td className="admin-td">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatCurrency(displayTotal, activeStore?.currency)}
                              </span>
                            </td>
                            <td className="admin-td whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${displayBadge.pill}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${displayBadge.dot}`} />
                                {statusText}
                              </span>
                            </td>
                            <td className="admin-td text-sm text-slate-400 dark:text-gray-500 whitespace-nowrap">
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
