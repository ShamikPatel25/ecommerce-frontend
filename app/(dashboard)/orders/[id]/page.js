'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Printer, Truck, Package,
  Mail, Phone, MapPin, Save, CheckCircle2, Clock,
  ChevronDown, Loader2, XCircle, RotateCcw,
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { useStoreStore } from '@/store/storeStore';
import { useDashboardStore } from '@/store/dashboardStore';

const STATUS_STYLES = {
  pending:          'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  confirmed:        'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  processing:       'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  shipped:          'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
  delivered:        'bg-green-500/10 text-green-400 border border-green-500/20',
  cancelled:        'bg-red-500/10 text-red-400 border border-red-500/20',
  returned:         'bg-orange-500/10 text-orange-400 border border-orange-500/20',
};

const VALID_TRANSITIONS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['delivered'],
  delivered:        ['returned'],
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
  const invalidateDashboard = useDashboardStore((s) => s.invalidate);

  const [order,        setOrder]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [newStatus,    setNewStatus]    = useState('');

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

  useEffect(() => {
    fetchOrder();
  }, [id, fetchOrder]);

  const handleStatusSave = async () => {
    if (newStatus === order.status) return;
    setSaving(true);
    try {
      const res = await orderAPI.updateStatus(id, newStatus);
      setOrder(res.data);
      invalidateDashboard(activeStore?.id);
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

  // Check if all items are inactive (cancelled/returned)
  const activeItems = order.items?.filter(i => !['cancelled', 'returned'].includes(i.status)) || [];
  const allItemsInactive = activeItems.length === 0 && (order.items?.length || 0) > 0;
  const hasReturnedItems = order.items?.some(i => i.status === 'returned');

  // Determine effective status (for display when backend hasn't updated)
  let effectiveStatus = order.status;
  if (allItemsInactive && !['cancelled', 'returned'].includes(order.status)) {
    effectiveStatus = hasReturnedItems ? 'returned' : 'cancelled';
  }

  const isCancelled   = effectiveStatus === 'cancelled';
  const isReturned    = effectiveStatus === 'returned';
  const isOrderFinal  = isCancelled || isReturned || allItemsInactive;
  const customerInit  = order.customer_name?.charAt(0).toUpperCase() || '?';
  // If order is final (cancelled/returned/all items inactive), no status changes allowed
  const allowedNext   = isOrderFinal ? [] : (VALID_TRANSITIONS[order.status] || []);

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

    if (isReturned) {
      const label = 'Returned';
      const colorCls = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      return (
        <div className="flex items-center gap-3 py-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${colorCls}`}>
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-orange-500">{label}</p>
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
                      ? 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                      : active
                      ? 'bg-violet-500/15 border-violet-500 text-violet-500'
                      : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 text-slate-400 dark:text-gray-500'
                  }`}
                >
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                {!isLast && (
                  <div className="flex-1 h-0.5 mx-1 bg-slate-200 dark:bg-gray-700 relative overflow-hidden">
                    <div
                      className="absolute inset-0 bg-violet-500 origin-left transition-transform duration-500"
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

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print invoice');
      return;
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
          .store-name { font-size: 24px; font-weight: bold; color: #111827; }
          .store-info { font-size: 13px; color: #4b5563; margin-top: 4px; }
          .invoice-title { font-size: 32px; font-weight: bold; color: #111827; text-align: right; }
          .invoice-meta { font-size: 13px; color: #4b5563; text-align: right; margin-top: 8px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 12px; font-weight: bold; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
          .customer-name { font-size: 16px; font-weight: 600; color: #111827; }
          .customer-info { font-size: 13px; color: #4b5563; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f3f4f6; padding: 12px; font-size: 13px; font-weight: bold; color: #111827; border: 1px solid #d1d5db; text-align: left; }
          th.center { text-align: center; }
          th.right { text-align: right; }
          td { padding: 12px; font-size: 13px; color: #1f2937; border: 1px solid #d1d5db; }
          td.center { text-align: center; }
          td.right { text-align: right; }
          .item-name { font-weight: 500; }
          .item-variant { font-size: 11px; color: #6b7280; }
          .item-sku { font-size: 11px; color: #9ca3af; }
          .totals { display: flex; justify-content: flex-end; }
          .totals-box { width: 250px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .total-row.final { border-top: 2px solid #1f2937; margin-top: 10px; padding-top: 12px; font-size: 18px; font-weight: bold; }
          .footer { border-top: 1px solid #d1d5db; padding-top: 20px; text-align: center; margin-top: 40px; }
          .footer-text { font-size: 14px; color: #4b5563; }
          .footer-note { font-size: 11px; color: #9ca3af; margin-top: 8px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="store-name">${activeStore?.name || 'Store'}</div>
            ${activeStore?.address ? `<div class="store-info">${activeStore.address}</div>` : ''}
            ${activeStore?.phone ? `<div class="store-info">Phone: ${activeStore.phone}</div>` : ''}
            ${activeStore?.email ? `<div class="store-info">Email: ${activeStore.email}</div>` : ''}
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">Order #: ${order.order_number}</div>
            <div class="invoice-meta">Date: ${formatDateTime(order.created_at)}</div>
            <div class="invoice-meta">Status: ${STATUS_LABELS[order.status] || order.status}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Bill To:</div>
          <div class="customer-name">${order.customer_name || ''}</div>
          ${order.customer_email ? `<div class="customer-info">${order.customer_email}</div>` : ''}
          ${order.customer_phone ? `<div class="customer-info">${order.customer_phone}</div>` : ''}
          ${order.shipping_address ? `<div class="customer-info">${order.shipping_address.replace(/\n/g, '<br>')}</div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="center" style="width:70px">Qty</th>
              <th class="right" style="width:100px">Price</th>
              <th class="right" style="width:100px">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td>
                  <div class="item-name">${item.product_name}</div>
                  ${item.variant_attrs ? `<div class="item-variant">${item.variant_attrs}</div>` : ''}
                  ${item.product_sku ? `<div class="item-sku">SKU: ${item.product_sku}</div>` : ''}
                </td>
                <td class="center">${item.quantity}</td>
                <td class="right">${formatCurrency(item.unit_price, activeStore?.currency)}</td>
                <td class="right" style="font-weight:500">${formatCurrency(Number.parseFloat(item.unit_price) * item.quantity, activeStore?.currency)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-box">
            ${order.subtotal != null ? `<div class="total-row"><span>Subtotal:</span><span>${formatCurrency(order.subtotal, activeStore?.currency)}</span></div>` : ''}
            ${order.shipping_cost != null ? `<div class="total-row"><span>Shipping:</span><span>${formatCurrency(order.shipping_cost, activeStore?.currency)}</span></div>` : ''}
            <div class="total-row final"><span>Total:</span><span>${formatCurrency(order.total_amount, activeStore?.currency)}</span></div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-text">Thank you for your business!</div>
          <div class="footer-note">This is a computer-generated invoice. No signature required.</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 mb-4">
          <button onClick={() => router.push('/orders')} className="hover:text-violet-500 transition-colors">
            Orders
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900 dark:text-white">{order.order_number}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/orders')}
              className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-500 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-7 h-7 text-slate-900 dark:text-white" strokeWidth={2.5} />
            </button>
            <h1 className="admin-title">
              {order.order_number}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[effectiveStatus] || ''}`}>
              {STATUS_LABELS[effectiveStatus] || effectiveStatus}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-700 dark:text-gray-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            {!isOrderFinal && allowedNext.includes('shipped') && (
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
                <Package className="w-5 h-5 text-violet-500" />
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
                        <th className="admin-th text-left">Product</th>
                        <th className="admin-th text-center">Qty</th>
                        <th className="admin-th text-right">Price</th>
                        <th className="admin-th text-right">Total</th>
                        <th className="admin-th text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="admin-tbody">
                      {order.items.map((item) => {
                        const isItemCancelled = item.status === 'cancelled';
                        const isItemReturned = item.status === 'returned';
                        const isItemInactive = isItemCancelled || isItemReturned;
                        return (
                          <tr key={item.id} className={isItemInactive ? 'opacity-60' : ''}>
                            <td className="admin-td text-left">
                              <div className="flex items-center gap-4 justify-start">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                                  <Package className="w-4 h-4 text-violet-500/60" />
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-semibold text-sm ${isItemInactive ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-900 dark:text-white'}`}>{item.product_name}</p>
                                  {item.variant_attrs && (
                                    <p className="text-xs text-slate-500 dark:text-gray-400">{item.variant_attrs}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="admin-td text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="admin-td text-sm text-slate-500 dark:text-gray-400 text-right">
                              {formatCurrency(item.unit_price, activeStore?.currency)}
                            </td>
                            <td className="admin-td text-sm font-semibold text-slate-900 dark:text-white text-right">
                              {formatCurrency(Number.parseFloat(item.unit_price) * item.quantity, activeStore?.currency)}
                            </td>
                            <td className="admin-td text-center">
                              {isItemCancelled ? (
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                  Cancelled
                                </span>
                              ) : isItemReturned ? (
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                  Returned
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                                  Active
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot className="bg-slate-50/50 dark:bg-gray-700/20">
                      {(() => {
                        const activeItems = order.items?.filter(i => !['cancelled', 'returned'].includes(i.status)) || [];
                        const cancelledItems = order.items?.filter(i => i.status === 'cancelled') || [];
                        const returnedItems = order.items?.filter(i => i.status === 'returned') || [];
                        const allItemsInactive = activeItems.length === 0 && (order.items?.length || 0) > 0;

                        // If order status is final OR all items are inactive → show original total
                        const isOrderFinal = ['cancelled', 'returned'].includes(order.status) || allItemsInactive;

                        const activeSubtotal = activeItems.reduce((sum, i) => sum + (Number.parseFloat(i.unit_price) * i.quantity), 0);
                        const cancelledTotal = cancelledItems.reduce((sum, i) => sum + (Number.parseFloat(i.unit_price) * i.quantity), 0);
                        const returnedTotal = returnedItems.reduce((sum, i) => sum + (Number.parseFloat(i.unit_price) * i.quantity), 0);

                        // If order is final, show original total_amount; otherwise show active total
                        const displayTotal = isOrderFinal
                          ? Number.parseFloat(order.total_amount || 0)
                          : activeSubtotal + (order.shipping_cost || 0);

                        return (
                          <>
                            {!isOrderFinal && (
                              <tr>
                                <td colSpan={4} className="admin-td text-sm text-slate-500 dark:text-gray-400 text-right">Subtotal ({activeItems.length} items)</td>
                                <td className="admin-td text-sm font-medium text-slate-700 dark:text-gray-300 text-right">
                                  {formatCurrency(activeSubtotal, activeStore?.currency)}
                                </td>
                              </tr>
                            )}
                            {cancelledItems.length > 0 && (
                              <tr>
                                <td colSpan={4} className="admin-td text-sm text-red-400 text-right">Cancelled ({cancelledItems.length} items)</td>
                                <td className="admin-td text-sm font-medium text-red-400 text-right line-through">
                                  {formatCurrency(cancelledTotal, activeStore?.currency)}
                                </td>
                              </tr>
                            )}
                            {returnedItems.length > 0 && (
                              <tr>
                                <td colSpan={4} className="admin-td text-sm text-orange-400 text-right">Returned ({returnedItems.length} items)</td>
                                <td className="admin-td text-sm font-medium text-orange-400 text-right line-through">
                                  {formatCurrency(returnedTotal, activeStore?.currency)}
                                </td>
                              </tr>
                            )}
                            {order.shipping_cost != null && !isOrderFinal && (
                              <tr>
                                <td colSpan={4} className="admin-td text-sm text-slate-500 dark:text-gray-400 text-right">Shipping</td>
                                <td className="admin-td text-sm font-medium text-slate-700 dark:text-gray-300 text-right">
                                  {formatCurrency(order.shipping_cost, activeStore?.currency)}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td colSpan={4} className="admin-td text-slate-900 dark:text-white font-bold text-right">Total</td>
                              <td className="admin-td text-xl font-black text-violet-500 text-right">
                                {formatCurrency(displayTotal, activeStore?.currency)}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Customer Details (1/3) */}
          <div>
            <div className="admin-table-card p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Customer Details</h3>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 font-black text-xl ring-4 ring-violet-500/5 shrink-0">
                  {customerInit}
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-900 dark:text-white">{order.customer_name}</p>
                  <p className="text-sm text-violet-500 font-medium">Customer</p>
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
              {isOrderFinal ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${isCancelled ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                    <div className="flex items-center gap-3">
                      {isCancelled ? (
                        <XCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <RotateCcw className="w-6 h-6 text-orange-500" />
                      )}
                      <div>
                        <p className={`font-bold ${isCancelled ? 'text-red-500' : 'text-orange-500'}`}>
                          Order {isCancelled ? 'Cancelled' : 'Returned'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                          Status cannot be changed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
                        className="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 px-4 pr-10 appearance-none text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full py-2.5 bg-violet-500 text-white rounded-lg font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : <><Save className="w-4 h-4" /> Save Status</>
                    }
                  </button>
                </div>
              )}
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
