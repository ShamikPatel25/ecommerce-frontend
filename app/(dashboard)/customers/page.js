'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Search, Users, ChevronDown, ChevronUp,
  ShoppingBag, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/dashboard/Pagination';
import { formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';

const PER_PAGE = 10;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* unique key for each aggregated customer row */
function customerKey(c) {
  return c.customer_email || `name:${c.customer_name}`;
}

const STATUS_BADGE = {
  pending:          { dot: 'bg-yellow-500', pill: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
  confirmed:        { dot: 'bg-blue-500',   pill: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  processing:       { dot: 'bg-orange-500', pill: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  shipped:          { dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  delivered:        { dot: 'bg-green-500',  pill: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  cancelled:        { dot: 'bg-red-500',    pill: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  return_requested: { dot: 'bg-amber-500',  pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  returned:         { dot: 'bg-purple-500', pill: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
};

function statusLabel(s) {
  return s?.replaceAll('_', ' ') ?? '';
}

export default function CustomersPage() {
  const { activeStore } = useStoreStore();
  const [customers,      setCustomers]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [expandedKey,    setExpandedKey]    = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders,  setLoadingOrders]  = useState(false);

  /* ── fetch customers ── */
  const fetchCustomers = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const res  = await orderAPI.customers(search);
      const data = res.data;
      setCustomers(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── debounced search ── */
  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  /* ── expand / collapse row ── */
  const toggleExpand = async (customer) => {
    const key = customerKey(customer);

    if (expandedKey === key) {
      setExpandedKey(null);
      setCustomerOrders([]);
      return;
    }

    setExpandedKey(key);
    setCustomerOrders([]);
    setLoadingOrders(true);
    try {
      const res  = await orderAPI.customerOrders({
        email: customer.customer_email || '',
        name:  customer.customer_name,
      });
      const data = res.data;
      setCustomerOrders(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      toast.error('Failed to load order history');
    } finally {
      setLoadingOrders(false);
    }
  };

  /* ── local search filter + pagination ── */
  const lowerQuery = searchQuery.toLowerCase().trim();
  const filteredCustomers = customers.filter(c =>
    c.customer_name?.toLowerCase().includes(lowerQuery) ||
    c.customer_email?.toLowerCase().includes(lowerQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCustomers = filteredCustomers.slice(
    (safeCurrentPage - 1) * PER_PAGE,
    safeCurrentPage * PER_PAGE
  );

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Customers</h2>
            <p className="admin-subtitle">View and manage your customer base and their order history.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="admin-search-wrapper">
          <div className="admin-search-box">
            <div className="admin-search-icon">
              <Search size={20} />
            </div>
            <input
              className="admin-search-input"
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* DataTable Container */}
        <div className="admin-table-card">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
            </div>
          ) : (
            <>
              {paginatedCustomers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="text-slate-400 dark:text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No customers found</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Try adjusting your search.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="admin-table min-w-[800px]">
                    <thead>
                      <tr className="admin-thead-row">
                        <th className="admin-th">Customer</th>
                        <th className="admin-th">Email</th>
                        <th className="admin-th">Phone</th>
                        <th className="admin-th text-center">Orders</th>
                        <th className="admin-th text-right">Total Spent</th>
                        <th className="admin-th text-right">Last Order</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="admin-tbody">
                      {paginatedCustomers.map((customer, idx) => {
                        const key = customerKey(customer);
                        const isExpanded = expandedKey === key;
                        return (
                          <Fragment key={key + `-${idx}`}>
                            <tr
                              onClick={() => toggleExpand(customer)}
                              className={`admin-tr group ${isExpanded ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                            >
                              <td className="admin-td">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                                    {customer.customer_name?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{customer.customer_name}</p>
                                </div>
                              </td>
                              <td className="admin-td">
                                <span className="text-sm text-slate-500 dark:text-gray-400">
                                  {customer.customer_email || <span className="text-slate-300 dark:text-gray-600 italic">Not provided</span>}
                                </span>
                              </td>
                              <td className="admin-td">
                                <span className="text-sm text-slate-500 dark:text-gray-400">
                                  {customer.customer_phone || <span className="text-slate-300 dark:text-gray-600 italic">Not provided</span>}
                                </span>
                              </td>
                              <td className="admin-td text-center">
                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-700 text-sm font-bold text-slate-700 dark:text-gray-300">
                                  {customer.total_orders ?? 0}
                                </span>
                              </td>
                              <td className="admin-td text-right">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(customer.total_spent || 0, activeStore?.currency)}
                                </span>
                              </td>
                              <td className="admin-td text-sm text-slate-400 dark:text-gray-500 text-right whitespace-nowrap">
                                {formatDate(customer.last_order)}
                              </td>
                              <td className="admin-td text-slate-400 dark:text-gray-500">
                                {isExpanded
                                  ? <ChevronUp   className="w-4 h-4" />
                                  : <ChevronDown className="w-4 h-4" />
                                }
                              </td>
                            </tr>

                            {/* Expanded order history */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="bg-slate-50/80 dark:bg-gray-900/40 px-6 py-5">
                                  {loadingOrders && (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                                    </div>
                                  )}
                                  {!loadingOrders && customerOrders.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-gray-500">
                                      <ShoppingBag className="w-8 h-8 mb-2 opacity-40" />
                                      <p className="text-sm font-medium">No orders found for this customer.</p>
                                    </div>
                                  )}
                                  {!loadingOrders && customerOrders.length > 0 && (
                                    <div className="space-y-3">
                                      <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                        Order History ({customerOrders.length})
                                      </p>
                                      <div className="grid gap-2">
                                        {customerOrders.map((order) => {
                                          const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
                                          return (
                                            <Link
                                              key={order.id}
                                              href={`/orders/${order.id}`}
                                              onClick={(e) => e.stopPropagation()}
                                              className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 px-4 py-3 hover:border-orange-500/30 hover:shadow-sm transition-all group"
                                            >
                                              <div className="flex items-center gap-4">
                                                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                                  #{order.id}
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${badge.pill}`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                                                  {statusLabel(order.status)}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-gray-500">
                                                  {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? '' : 's'}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                  {formatCurrency(order.total_amount || 0, activeStore?.currency)}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-gray-500">
                                                  {formatDate(order.created_at)}
                                                </span>
                                                <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-gray-600 group-hover:text-orange-500 transition-colors" />
                                              </div>
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredCustomers.length > 0 && (
                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredCustomers.length}
                  perPage={PER_PAGE}
                  itemLabel="customers"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
