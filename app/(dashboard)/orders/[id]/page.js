'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderAPI, productAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, Printer, Truck, Package,
  Mail, Phone, MapPin, Save, CheckCircle2, Clock,
  ChevronDown, Loader2, Info, XCircle, RotateCcw,
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';

const STATUS_STYLES = {
  pending:          'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  confirmed:        'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  processing:       'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  shipped:          'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  delivered:        'bg-green-500/10 text-green-400 border border-green-500/20',
  cancelled:        'bg-red-500/10 text-red-400 border border-red-500/20',
  return_requested: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  returned:         'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

const VALID_TRANSITIONS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['delivered'],
  delivered:        ['return_requested'],
  return_requested: ['returned'],
  cancelled:        [],
  returned:         [],
};

const STATUS_LABELS = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  processing:       'Processing',
  shipped:          'Shipped',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
  return_requested: 'Return Requested',
  returned:         'Returned',
};

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const PROGRESS_STEPS = [
  { key: 'pending',    label: 'Order Placed',  Icon: Package      },
  { key: 'confirmed',  label: 'Confirmed',     Icon: CheckCircle2 },
  { key: 'processing', label: 'Processing',    Icon: Clock        },
  { key: 'shipped',    label: 'Shipped',       Icon: Truck        },
  { key: 'delivered',  label: 'Delivered',     Icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id }  = useParams();
  const { activeStore } = useStoreStore();

  const [order,        setOrder]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [newStatus,    setNewStatus]    = useState('');
  const [stockMap,     setStockMap]     = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await orderAPI.get(id);
      setOrder(res.data);
      setNewStatus(res.data.status);
    } catch {
      toast.error('Failed to load order');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchStockInfo = useCallback(async (items) => {
    if (!items?.length) return;
    setStockLoading(true);
    try {
      const ids = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
      const results = await Promise.allSettled(ids.map((pid) => productAPI.get(pid)));
      const map = {};
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          const p = r.value.data;
          map[ids[idx]] = { stock: p.stock, variants: p.variants || [], product_type: p.product_type };
        }
      });
      setStockMap(map);
    } catch {
      toast.error('Failed to load stock info');
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [id, fetchOrder]);

  useEffect(() => {
    if (order?.items) fetchStockInfo(order.items);
  }, [order, fetchStockInfo]);

  const getItemCurrentStock = (item) => {
    const info = stockMap[item.product_id];
    if (!info) return null;
    if (info.product_type === 'catalog' && item.variant_id) {
      return info.variants.find((v) => v.id === item.variant_id)?.stock ?? null;
    }
    return info.stock ?? null;
  };

  const handleStatusSave = async () => {
    if (newStatus === order.status) return;
    setSaving(true);
    try {
      const res = await orderAPI.updateStatus(id, newStatus);
      setOrder(res.data);
      toast.success('Status updated!');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="admin-loading min-h-[60vh]">
      <div className="admin-spinner"></div>
    </div>
  );

  if (!order) return null;

  const isCancelled   = order.status === 'cancelled';
  const isReturned    = order.status === 'returned';
  const isReturnReq   = order.status === 'return_requested';
  const customerInit  = order.customer_name?.charAt(0).toUpperCase() || '?';
  const allowedNext   = VALID_TRANSITIONS[order.status] || [];

  const renderProgressTracker = () => {
    if (isCancelled) {
      return (
        <div className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-500">Order Cancelled</p>
            <p className="text-xs text-slate-400 dark:text-gray-500">{formatDateTime(order.updated_at || order.created_at)}</p>
          </div>
        </div>
      );
    }

    if (isReturnReq || isReturned) {
      const label = isReturned ? 'Returned' : 'Return Requested';
      const colorCls = isReturned
        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        : 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      return (
        <div className="flex items-center gap-3 py-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${colorCls}`}>
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-sm font-bold ${isReturned ? 'text-rose-500' : 'text-amber-500'}`}>{label}</p>
            <p className="text-xs text-slate-400 dark:text-gray-500">{formatDateTime(order.updated_at)}</p>
          </div>
        </div>
      );
    }

    const activeIdx = order.status === 'delivered' ? PROGRESS_STEPS.length : STATUS_FLOW.indexOf(order.status);

    return (
      <div className="py-3 select-none">
        <div className="flex items-center w-full">
          {PROGRESS_STEPS.map((step, idx) => {
            const done   = idx < activeIdx;
            const active = idx === activeIdx;
            const isLast = idx === PROGRESS_STEPS.length - 1;
            const { Icon } = step;

            return (
              <div key={step.key} className={`flex items-center ${isLast ? 'shrink-0' : 'flex-1'}`}>
                <div
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : active
                      ? 'bg-orange-500/15 border-orange-500 text-orange-500'
                      : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 text-slate-400 dark:text-gray-500'
                  }`}
                >
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                {!isLast && (
                  <div className="flex-1 h-0.5 mx-1 bg-slate-200 dark:bg-gray-700 relative overflow-hidden">
                    <div
                      className="absolute inset-0 bg-orange-500 origin-left transition-transform duration-500"
                      style={{ transform: `scaleX(${done ? 1 : 0})` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-start mt-2 w-full">
          {PROGRESS_STEPS.map((step, idx) => {
            const done   = idx < activeIdx;
            const active = idx === activeIdx;
            const isLast = idx === PROGRESS_STEPS.length - 1;

            return (
              <div key={step.key} className={`flex ${isLast ? 'shrink-0' : 'flex-1'}`}>
                <div className="w-10 shrink-0 flex justify-center">
                  <span className={`text-[10px] font-bold text-center leading-tight w-14 -mx-2 ${
                    done || active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {!isLast && <div className="flex-1" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
          <button onClick={() => router.push('/orders')} className="hover:text-orange-500 transition-colors">
            Orders
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900 dark:text-white">Order #{order.id}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/orders')}
              className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-orange-500 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="admin-title">
              Order #{order.id}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[order.status] || ''}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => globalThis.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-700 dark:text-gray-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            {(VALID_TRANSITIONS[order.status] || []).includes('shipped') && (
              <button
                onClick={() => { setNewStatus('shipped'); }}
                className="admin-btn-primary"
              >
                <Truck className="w-4 h-4" />
                Fulfill Order
              </button>
            )}
          </div>
        </div>

        <p className="admin-subtitle mb-8">
          Placed on {formatDateTime(order.created_at)}
        </p>

        {/* Top row: Order Items + Customer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-6">

          {/* LEFT: Order Items (2/3) */}
          <div className="lg:col-span-2">
            <div className="admin-table-card">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Items</h3>
              </div>

              {order.items?.length === 0 ? (
                <div className="admin-empty">
                  <p className="admin-empty-text text-sm">No items</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[580px]">
                    <thead>
                      <tr className="admin-thead-row">
                        <th className="admin-th">Product</th>
                        <th className="admin-th text-center">Qty</th>
                        <th className="admin-th text-right">Price</th>
                        <th className="admin-th text-right">Total</th>
                        <th className="admin-th text-center">Stock Left</th>
                      </tr>
                    </thead>
                    <tbody className="admin-tbody">
                      {order.items.map((item) => {
                        const currentStock = getItemCurrentStock(item);

                        let stockCell;
                        if (stockLoading) {
                          stockCell = <div className="h-4 w-8 bg-slate-200 dark:bg-gray-700 animate-pulse rounded mx-auto" />;
                        } else if (currentStock === null) {
                          stockCell = <span className="text-slate-300 dark:text-gray-600 text-xs">&mdash;</span>;
                        } else if (currentStock === 0) {
                          stockCell = <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">Out</span>;
                        } else {
                          stockCell = (
                            <span className={`text-sm font-bold ${currentStock <= 5 ? 'text-orange-500' : 'text-green-500'}`}>
                              {currentStock}
                            </span>
                          );
                        }

                        return (
                          <tr key={item.id}>
                            <td className="admin-td">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5 text-orange-500/60" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{item.product_name}</p>
                                  {item.variant_attrs && (
                                    <p className="text-xs text-slate-400 dark:text-gray-500">{item.variant_attrs}</p>
                                  )}
                                  {item.product_sku && (
                                    <p className="text-xs text-slate-400 dark:text-gray-500 font-mono">{item.product_sku}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="admin-td text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="admin-td text-right text-sm text-slate-500 dark:text-gray-400">
                              {formatCurrency(item.unit_price, activeStore?.currency)}
                            </td>
                            <td className="admin-td text-right text-sm font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(Number.parseFloat(item.unit_price) * item.quantity, activeStore?.currency)}
                            </td>
                            <td className="admin-td text-center">
                              {stockCell}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot className="bg-slate-50/50 dark:bg-gray-700/20">
                      {order.subtotal != null && (
                        <tr>
                          <td colSpan={3} className="admin-td text-right text-sm text-slate-500 dark:text-gray-400">Subtotal</td>
                          <td className="admin-td text-right text-sm font-medium text-slate-700 dark:text-gray-300" colSpan={2}>
                            {formatCurrency(order.subtotal, activeStore?.currency)}
                          </td>
                        </tr>
                      )}
                      {order.shipping_cost != null && (
                        <tr>
                          <td colSpan={3} className="admin-td text-right text-sm text-slate-500 dark:text-gray-400">Shipping</td>
                          <td className="admin-td text-right text-sm font-medium text-slate-700 dark:text-gray-300" colSpan={2}>
                            {formatCurrency(order.shipping_cost, activeStore?.currency)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="admin-td text-right text-slate-900 dark:text-white font-bold">Total</td>
                        <td className="admin-td text-right text-xl font-black text-orange-500" colSpan={2}>
                          {formatCurrency(order.total_amount, activeStore?.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Stock info note */}
              <div className="mx-6 mb-6 mt-2 flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Stock was automatically reduced when this order was placed. <strong>Stock Left</strong> shows current inventory.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Customer Details (1/3) */}
          <div>
            <div className="admin-table-card p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Customer Details</h3>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-black text-xl ring-4 ring-orange-500/5 shrink-0">
                  {customerInit}
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">{order.customer_name}</p>
                  <p className="text-sm text-orange-500 font-medium">Customer</p>
                </div>
              </div>

              <div className="space-y-4">
                {order.customer_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-0.5">Email</p>
                      <p className="text-sm text-slate-700 dark:text-gray-300">{order.customer_email}</p>
                    </div>
                  </div>
                )}
                {order.customer_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-0.5">Phone</p>
                      <p className="text-sm text-slate-700 dark:text-gray-300">{order.customer_phone}</p>
                    </div>
                  </div>
                )}
                {order.shipping_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 dark:text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-0.5">Shipping Address</p>
                      <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-line">{order.shipping_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Update Status + Order History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Update Status */}
          <div>
            <div className="admin-table-card p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Update Status</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="status-select" className="text-xs text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider block mb-2">
                    Current Status
                  </label>
                  <div className="relative">
                    <select
                      id="status-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={allowedNext.length === 0}
                      className="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 px-4 pr-10 appearance-none text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value={order.status}>{STATUS_LABELS[order.status] || order.status} (current)</option>
                      {allowedNext.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={handleStatusSave}
                  disabled={saving || newStatus === order.status}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Save className="w-4 h-4" /> Save Status</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="admin-table-card p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Order History</h3>
              {renderProgressTracker()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
