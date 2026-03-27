'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Search, Users, Loader2, ChevronDown, ChevronUp,
  Mail, Phone, ShoppingBag,
} from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const STATUS_BADGE = {
  pending:    { dot: 'bg-slate-50 dark:bg-gray-700/500',   pill: 'bg-slate-100 dark:bg-gray-700   text-slate-700 dark:text-gray-300'  },
  confirmed:  { dot: 'bg-blue-500',    pill: 'bg-blue-100    text-blue-700'   },
  processing: { dot: 'bg-orange-500',  pill: 'bg-orange-100  text-orange-700 dark:text-orange-400' },
  shipped:    { dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700'},
  delivered:  { dot: 'bg-green-500',   pill: 'bg-green-100 dark:bg-green-900/30   text-green-700 dark:text-green-400'  },
  cancelled:  { dot: 'bg-red-500',     pill: 'bg-red-100 dark:bg-red-900/30     text-red-700 dark:text-red-400'    },
};

export default function CustomersPage() {
  const [customers,      setCustomers]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [expandedEmail,  setExpandedEmail]  = useState(null);
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
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  /* ── expand / collapse row ── */
  const toggleExpand = async (email) => {
    if (expandedEmail === email) {
      setExpandedEmail(null);
      setCustomerOrders([]);
      return;
    }

    setExpandedEmail(email);
    setCustomerOrders([]);
    setLoadingOrders(true);
    try {
      const res  = await orderAPI.customerByEmail(email);
      const data = res.data;
      setCustomerOrders(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      toast.error('Failed to load order history');
    } finally {
      setLoadingOrders(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-8">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Customers</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">
            View and manage your customer base and their order history.
          </p>
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by customer name…"
              className="w-full bg-slate-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#ff6600]/30 focus:bg-white dark:bg-gray-800 outline-none transition-all border border-transparent focus:border-[#ff6600]/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-gray-500">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No customers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total Orders</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Last Order</th>
                  <th className="px-6 py-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {customers.map((customer) => {
                  const isExpanded = expandedEmail === customer.customer_email;
                  return (
                    <Fragment key={customer.customer_email}>
                      {/* ── Customer row ── */}
                      <tr
                        onClick={() => toggleExpand(customer.customer_email)}
                        className={`hover:bg-slate-50 dark:bg-gray-700/50 dark:hover:bg-gray-700/60 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50 dark:bg-gray-700/50/40' : ''}`}
                      >
                        {/* Name */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{customer.customer_name}</p>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
                            <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 shrink-0" />
                            {customer.customer_email || '—'}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
                            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 shrink-0" />
                            {customer.customer_phone || '—'}
                          </span>
                        </td>

                        {/* Total Orders */}
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {customer.total_orders ?? 0}
                        </td>

                        {/* Total Spent */}
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          ${parseFloat(customer.total_spent || 0).toLocaleString()}
                        </td>

                        {/* Last Order */}
                        <td className="px-6 py-4 text-sm text-slate-400 dark:text-gray-500 text-right whitespace-nowrap">
                          {formatDate(customer.last_order)}
                        </td>

                        {/* Chevron */}
                        <td className="px-6 py-4 text-slate-400 dark:text-gray-500">
                          {isExpanded
                            ? <ChevronUp   className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                          }
                        </td>
                      </tr>

                      {/* ── Expanded order history ── */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-slate-50 dark:bg-gray-700/50/70 px-6 py-4">
                            {loadingOrders ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-[#ff6600] animate-spin" />
                              </div>
                            ) : customerOrders.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-gray-500">
                                <ShoppingBag className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm font-medium">No orders found for this customer.</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700">
                                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Order #</th>
                                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                    {customerOrders.map((order) => {
                                      const badge = STATUS_BADGE[order.status] || { dot: 'bg-slate-400', pill: 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300' };
                                      return (
                                        <tr key={order.id} className="hover:bg-slate-50 dark:bg-gray-700/50 dark:hover:bg-gray-700/60 transition-colors">
                                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                                            #{order.id}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400 whitespace-nowrap">
                                            {order.items_count ?? order.items?.length ?? 0} item{(order.items_count ?? order.items?.length ?? 0) !== 1 ? 's' : ''}
                                          </td>
                                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                            ${parseFloat(order.total_amount || 0).toLocaleString()}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${badge.pill}`}>
                                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                                              {order.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-slate-400 dark:text-gray-500 text-right whitespace-nowrap">
                                            {formatDate(order.created_at)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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

        {/* Footer summary */}
        {!loading && customers.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50/30">
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {customers.length} customer{customers.length !== 1 ? 's' : ''} total
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
