'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderAPI, productAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, Printer, Truck, Package,
  FileText, Mail, Phone, MapPin, Save,
  ChevronDown, Loader2, Info,
} from 'lucide-react';

const STATUS_OPTIONS = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
];

const STATUS_STYLES = {
  pending:    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200',
  confirmed:  'bg-blue-100 dark:bg-blue-900/30   text-blue-700 dark:text-blue-400   border-blue-200',
  processing: 'bg-amber-100  text-amber-700  border-amber-200',
  shipped:    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200',
  delivered:  'bg-green-100 dark:bg-green-900/30  text-green-700 dark:text-green-400  border-green-200',
  cancelled:  'bg-red-100 dark:bg-red-900/30    text-red-600    border-red-200',
};

/* Status timeline progression */
const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id }  = useParams();

  const [order,        setOrder]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [newStatus,    setNewStatus]    = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [stockMap,     setStockMap]     = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  /* ── fetch order ── */
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

  /* ── fetch stock per product ── */
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

  /* ── save status ── */
  const handleStatusSave = async () => {
    if (newStatus === order.status && !internalNote.trim()) return;
    setSaving(true);
    try {
      const res = await orderAPI.updateStatus(id, newStatus);
      setOrder(res.data);
      setInternalNote('');
      toast.success('Status updated!');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
    </div>
  );

  if (!order) return null;

  const statusIndex   = STATUS_FLOW.indexOf(order.status);
  const isCancelled   = order.status === 'cancelled';
  const customerInit  = order.customer_name?.charAt(0).toUpperCase() || '?';

  /* ──────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-8">

      {/* ── Breadcrumbs ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
        <button onClick={() => router.push('/orders')} className="hover:text-[#ff6600] transition-colors">
          Orders
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white">Order #{order.id}</span>
      </nav>

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-[#ff6600] text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Order #{order.id}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-bold border capitalize ${STATUS_STYLES[order.status] || ''}`}>
            {order.status}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-700 dark:text-gray-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
          <button
            onClick={() => { setNewStatus('shipped'); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-[#ff6600]/90 transition-all"
          >
            <Truck className="w-4 h-4" />
            Fulfill Order
          </button>
        </div>
      </div>

      <p className="text-slate-500 dark:text-gray-400 text-sm mb-8">
        Placed on {formatDate(order.created_at)}
      </p>

      {/* ── 3-column grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: 2/3 ────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#ff6600]" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Items</h3>
            </div>

            {order.items?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-gray-500 text-sm">No items</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[580px]">
                  <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-100 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-center">Qty</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Price</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Total</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-center">Stock Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {order.items.map((item) => {
                      const currentStock = getItemCurrentStock(item);
                      return (
                        <tr key={item.id}>
                          {/* Product */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-[#ff6600]/10 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-[#ff6600]/60" />
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

                          {/* Qty */}
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300">
                              {item.quantity}
                            </span>
                          </td>

                          {/* Unit price */}
                          <td className="px-6 py-4 text-right text-sm text-slate-500 dark:text-gray-400">
                            ${parseFloat(item.unit_price).toLocaleString()}
                          </td>

                          {/* Line total */}
                          <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                            ${(parseFloat(item.unit_price) * item.quantity).toLocaleString()}
                          </td>

                          {/* Stock */}
                          <td className="px-6 py-4 text-center">
                            {stockLoading ? (
                              <div className="h-4 w-8 bg-slate-200 animate-pulse rounded mx-auto" />
                            ) : currentStock === null ? (
                              <span className="text-slate-300 text-xs">—</span>
                            ) : currentStock === 0 ? (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold rounded-full">Out</span>
                            ) : (
                              <span className={`text-sm font-bold ${currentStock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                                {currentStock}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Totals */}
                  <tfoot className="bg-slate-50/50">
                    {order.subtotal != null && (
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-right text-sm text-slate-500 dark:text-gray-400">Subtotal</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-slate-700 dark:text-gray-300" colSpan={2}>
                          ${parseFloat(order.subtotal).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {order.shipping_cost != null && (
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-right text-sm text-slate-500 dark:text-gray-400">Shipping</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-slate-700 dark:text-gray-300" colSpan={2}>
                          ${parseFloat(order.shipping_cost).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-slate-900 dark:text-white font-bold">Total</td>
                      <td className="px-6 py-4 text-right text-xl font-black text-[#ff6600]" colSpan={2}>
                        ${parseFloat(order.total_amount).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Stock info note */}
            <div className="mx-6 mb-6 mt-2 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Stock was automatically reduced when this order was placed. <strong>Stock Left</strong> shows current inventory.
              </p>
            </div>
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#ff6600]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customer Notes</h3>
              </div>
              <div className="bg-[#ff6600]/5 border border-[#ff6600]/20 rounded-lg p-4">
                <p className="text-slate-700 dark:text-gray-300 italic leading-relaxed text-sm">"{order.notes}"</p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: 1/3 ───────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Customer Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Customer Details</h3>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-[#ff6600]/10 flex items-center justify-center text-[#ff6600] font-black text-xl ring-4 ring-[#ff6600]/5 shrink-0">
                {customerInit}
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900 dark:text-white">{order.customer_name}</p>
                <p className="text-sm text-[#ff6600] font-medium">Customer</p>
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

          {/* Update Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider block mb-2">
                  Current Status
                </label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 px-4 pr-10 appearance-none text-sm text-slate-800 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 capitalize transition-all"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 dark:text-gray-500 uppercase font-bold tracking-wider block mb-2">
                  Internal Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a note for the staff..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20 resize-none transition-all"
                />
              </div>

              <button
                onClick={handleStatusSave}
                disabled={saving || (newStatus === order.status && !internalNote.trim())}
                className="w-full py-2.5 bg-[#ff6600] text-white rounded-lg font-bold shadow-md shadow-orange-500/20 hover:bg-[#ff6600]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save Status</>
                }
              </button>
            </div>
          </div>

          {/* Order History Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Order History</h3>

            {isCancelled ? (
              <div className="relative pl-8 space-y-4">
                <div className="relative">
                  <div className="absolute left-[-24px] top-1.5 w-5 h-5 rounded-full bg-red-500 ring-4 ring-red-100" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Order Cancelled</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">{formatDate(order.updated_at || order.created_at)}</p>
                </div>
                <div className="relative">
                  <div className="absolute left-[-24px] top-1.5 w-5 h-5 rounded-full bg-slate-200" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Order Placed</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
            ) : (
              <div className="relative pl-8 space-y-4 before:absolute before:inset-0 before:ml-2.5 before:-mt-1 before:w-0.5 before:bg-slate-100">
                {STATUS_FLOW.filter((_, i) => i <= statusIndex).reverse().map((s, i) => (
                  <div key={s} className="relative">
                    <div className={`absolute left-[-24px] top-1.5 w-5 h-5 rounded-full ring-4 ${
                      i === 0
                        ? 'bg-[#ff6600] ring-orange-100'
                        : 'bg-slate-300 ring-slate-50'
                    }`} />
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {s === 'pending'   ? 'Order Placed' :
                       s === 'confirmed' ? 'Order Confirmed' :
                       s === 'processing'? 'Payment Received' :
                       s === 'shipped'   ? 'Order Shipped' :
                       'Delivered'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">
                      {i === 0 ? formatDate(order.updated_at || order.created_at) : formatDate(order.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
