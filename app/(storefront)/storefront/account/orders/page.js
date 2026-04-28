'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import {
  User, PackageX, Package, Calendar, ChevronDown, ChevronUp,
  Box, ShoppingBag, Truck, CheckCircle2, Clock, XCircle,
  RotateCcw, AlertCircle, RefreshCw, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────── */
/*  Status metadata                        */
/* ─────────────────────────────────────── */
const STATUS_META = {
  pending:          { label: 'Pending',          color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',  dot: 'bg-yellow-400'  },
  confirmed:        { label: 'Confirmed',        color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',        dot: 'bg-blue-400'    },
  processing:       { label: 'Processing',       color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',  dot: 'bg-indigo-400'  },
  shipped:          { label: 'Shipped',          color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',        dot: 'bg-cyan-400'    },
  delivered:        { label: 'Delivered',        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  cancelled:        { label: 'Cancelled',        color: 'bg-red-500/15 text-red-400 border-red-500/30',           dot: 'bg-red-400'     },
  return_requested: { label: 'Return Requested', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',  dot: 'bg-orange-400'  },
  returned:         { label: 'Returned',         color: 'bg-gray-500/15 text-gray-400 border-gray-500/30',        dot: 'bg-gray-400'    },
};

/* ─────────────────────────────────────── */
/*  Order-progress steps                   */
/* ─────────────────────────────────────── */
const PROGRESS_STEPS = [
  { key: 'pending',    label: 'Order Placed',  Icon: Package      },
  { key: 'confirmed',  label: 'Confirmed',     Icon: CheckCircle2 },
  { key: 'processing', label: 'Processing',    Icon: Clock        },
  { key: 'shipped',    label: 'Shipped',       Icon: Truck        },
  { key: 'delivered',  label: 'Delivered',     Icon: CheckCircle2 },
];
const STEP_ORDER = PROGRESS_STEPS.map((s) => s.key);

function getActiveStepIndex(status) {
  // 'delivered' = all steps complete, so return length (all are "done")
  if (status === 'delivered') return PROGRESS_STEPS.length;
  const idx = STEP_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function OrderProgressTracker({ status }) {
  const activeIdx = getActiveStepIndex(status);
  const isCancelled = status === 'cancelled' || status === 'returned' || status === 'return_requested';

  if (isCancelled) {
    const meta = STATUS_META[status];
    const Icon = status === 'return_requested' || status === 'returned' ? RotateCcw : XCircle;
    return (
      <div className="flex items-center gap-3 py-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.color} border`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-sm font-bold ${meta.color.split(' ')[1]}`}>{meta.label}</p>
          <p className="text-xs text-muted-foreground">This order is {meta.label.toLowerCase()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 select-none">
      {/* ── Row 1: Icons only + connector lines ────────────────────
          Labels are NOT here — they live in Row 2.
          This keeps every icon at exactly the same vertical position
          and the line runs perfectly through all icon centers.      */}
      <div className="flex items-center w-full">
        {PROGRESS_STEPS.map((step, idx) => {
          const done   = idx < activeIdx;
          const active = idx === activeIdx;
          const isLast = idx === PROGRESS_STEPS.length - 1;
          const { Icon } = step;

          return (
            <div
              key={step.key}
              className={`flex items-center ${isLast ? 'shrink-0' : 'flex-1'}`}
            >
              {/* Circle */}
              <motion.div
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_14px_rgba(212,175,55,0.45)]'
                    : active
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground'
                }`}
                initial={false}
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </motion.div>

              {/* Connector line — fills the flex-1 gap between circles */}
              {!isLast && (
                <div className="flex-1 h-px mx-1 bg-border relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-primary origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={{ duration: 0.45, ease: 'easeInOut', delay: idx * 0.08 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Labels only (same flex structure) ── */}
      <div className="flex items-start mt-2 w-full">
        {PROGRESS_STEPS.map((step, idx) => {
          const done   = idx < activeIdx;
          const active = idx === activeIdx;
          const isLast = idx === PROGRESS_STEPS.length - 1;

          return (
            <div
              key={step.key}
              className={`flex ${isLast ? 'shrink-0' : 'flex-1'}`}
            >
              {/* Label centered under the 40px (w-10) icon */}
              <div className="w-10 shrink-0 flex justify-center">
                <span
                  className={`text-[10px] font-bold text-center leading-tight w-14 -mx-2 ${
                    done || active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* Spacer matching the connector line */}
              {!isLast && <div className="flex-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ─────────────────────────────────────── */
/*  Single order card                      */
/* ─────────────────────────────────────── */
function OrderCard({ order, isExpanded, onToggle, href }) {
  const statusKey = order.status || 'pending';
  const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const timeStr = new Date(order.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      layout
      className="group bg-card border border-border rounded-3xl overflow-hidden transition-colors hover:border-primary/40 shadow-lg"
    >
      {/* ── Card Header ── */}
      <button
        type="button"
        className="w-full text-left p-5 sm:p-7 transition-colors hover:bg-muted/10"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Package icon */}
          <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center text-primary shadow-[0_0_12px_rgba(212,175,55,0.08)] shrink-0 group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6" />
          </div>

          {/* Order info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h3 className="text-lg sm:text-xl font-black text-card-foreground">
                Order #{order.id}
              </h3>
              <StatusBadge status={statusKey} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {dateStr} · {timeStr}
              </span>
              <span className="font-medium">
                {order.items_count ?? order.items?.length ?? 0} item{(order.items_count ?? order.items?.length ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Amount + toggle */}
          <div className="flex items-center gap-4 sm:flex-col sm:items-end shrink-0">
            <p className="font-black text-foreground text-2xl">
              ₹{Number.parseFloat(order.total_amount).toFixed(2)}
            </p>
            <div
              className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Progress bar (always visible in header) */}
        {!['cancelled', 'returned', 'return_requested'].includes(statusKey) && (
          <div className="mt-5 sm:mt-4">
            <OrderProgressTracker status={statusKey} />
          </div>
        )}
      </button>

      {/* ── Expanded Details ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-background/40 p-5 sm:p-7">
              {/* Cancelled / Return status banner */}
              {['cancelled', 'returned', 'return_requested'].includes(statusKey) && (
                <div className="mb-6">
                  <OrderProgressTracker status={statusKey} />
                </div>
              )}

              {/* Items */}
              <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                Items Ordered
              </h4>
              <div className="space-y-4 mb-6">
                {order.items?.map((item) => {
                  const productLink = item.product_slug ? href(`/products/${item.product_slug}`) : null;
                  return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0 last:pb-0"
                  >
                    {/* Thumbnail */}
                    {productLink ? (
                      <Link href={productLink} className="relative w-16 h-16 rounded-xl bg-card border border-border overflow-hidden shrink-0 flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.product_name}
                            fill
                            sizes="64px"
                            className="object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Box className="w-7 h-7 text-muted-foreground opacity-30" />
                        )}
                      </Link>
                    ) : (
                      <div className="relative w-16 h-16 rounded-xl bg-card border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {item.thumbnail ? (
                          <Image src={item.thumbnail} alt={item.product_name} fill sizes="64px" className="object-cover" />
                        ) : (
                          <Box className="w-7 h-7 text-muted-foreground opacity-30" />
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {productLink ? (
                        <Link href={productLink} className="font-bold text-card-foreground line-clamp-1 hover:text-primary transition-colors">
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className="font-bold text-card-foreground line-clamp-1">{item.product_name}</p>
                      )}
                      {item.variant_attrs && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.variant_attrs}</p>
                      )}
                      <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md mt-1.5">
                        Qty: {item.quantity}
                      </span>
                    </div>

                    {/* Subtotal */}
                    <p className="font-black text-foreground shrink-0">
                      ₹{Number.parseFloat(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                  );
                })}
              </div>

              {/* Order total row */}
              <div className="flex justify-between items-center py-4 border-t border-border/50 mb-6">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Order Total</span>
                <span className="text-2xl font-black text-foreground">₹{Number.parseFloat(order.total_amount).toFixed(2)}</span>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="mt-2 p-4 rounded-2xl bg-muted/20 border border-border">
                  <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                    Order Notes
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{order.notes}</p>
                </div>
              )}

              {/* Customer info */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-4 rounded-2xl bg-muted/10 border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-semibold text-foreground">{order.customer_name}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{order.customer_email}</p>
                  {order.customer_phone && <p className="text-muted-foreground text-xs">{order.customer_phone}</p>}
                </div>
                <div className="p-4 rounded-2xl bg-muted/10 border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Order Info</p>
                  <p className="font-semibold text-foreground">#{order.id}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Placed: {dateStr}</p>
                  <p className="text-muted-foreground text-xs">Updated: {new Date(order.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="mt-3 p-4 rounded-2xl bg-muted/10 border border-border/50 text-sm">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Shipping Address</p>
                  <p className="font-semibold text-foreground whitespace-pre-line">{order.shipping_address}</p>
                  {order.address_type && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {order.address_type}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────── */
/*  Main Page                              */
/* ─────────────────────────────────────── */
export default function StorefrontOrdersPage() {
  const router = useRouter();
  const { href } = useStorefrontPath();
  const customer = useStorefrontAuthStore((s) => s.customer);
  const accessToken = useStorefrontAuthStore((s) => s.accessToken);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fetchOrders = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    storefrontAPI.getMyOrders()
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : res.data?.results || []);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch orders:', err.response?.status, err.response?.data);
        setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to load orders. Please try again.');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- hydration guard
  }, []);

  // Once mounted, check auth and fetch orders.
  // accessToken is reactive — when the token changes (login/logout/refresh),
  // this effect re-runs automatically.
  /* eslint-disable react-hooks/set-state-in-effect -- fetch on mount / redirect flow */
  useEffect(() => {
    if (!isMounted) return;
    if (accessToken) {
      fetchOrders();
    } else {
      setLoading(false);
      router.push(href('/account/login?redirect=' + encodeURIComponent(href('/account/orders'))));
    }
  }, [isMounted, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── Skeleton: shown while not yet mounted / hydrating / fetching ── */
  if (!isMounted || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-12 space-y-3">
          <div className="h-4 w-24 bg-muted/50 rounded-full animate-pulse" />
          <div className="h-10 w-56 bg-muted/50 rounded-2xl animate-pulse" />
          <div className="h-4 w-48 bg-muted/40 rounded-full animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-3xl p-6 mb-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted/50 rounded-full" />
                <div className="h-6 w-40 bg-muted/50 rounded-lg" />
                <div className="h-3 w-24 bg-muted/40 rounded-full" />
              </div>
              <div className="h-8 w-20 bg-muted/50 rounded-lg self-start" />
            </div>
          </div>
        ))}
      </div>
    );
  }


  /* ── Error state ── */
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card border border-red-500/20 rounded-3xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-400 mb-6" />
          <h3 className="text-2xl font-black text-foreground mb-3">Couldn&apos;t Load Orders</h3>
          <p className="text-muted-foreground mb-8 max-w-sm">{error}</p>
          <Button
            onClick={() => { setLoading(true); setError(null); fetchOrders(); }}
            className="rounded-full gap-2 font-bold px-8"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* ── Page Header ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <User className="w-4 h-4" /> My Account
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
            My Orders
          </h1>
          {customer && (
            <p className="text-muted-foreground">
              Logged in as <span className="text-foreground font-semibold">{customer.email}</span>
            </p>
          )}
        </div>

        {/* Stats pill */}
        {orders.length > 0 && (
          <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-3 shadow-sm self-start">
            <div className="text-center">
              <p className="text-2xl font-black text-foreground">{orders.length}</p>
              <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">
                {orders.filter((o) => o.status === 'delivered').length}
              </p>
              <p className="text-xs text-muted-foreground font-medium">Delivered</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-yellow-400">
                {orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length}
              </p>
              <p className="text-xs text-muted-foreground font-medium">Active</p>
            </div>
          </div>
        )}
      </div>

      {/* Refresh button */}
      {orders.length > 0 && (
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-28 px-8 text-center bg-card border border-border rounded-3xl shadow-2xl"
        >
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-[2rem] bg-muted/30 border border-border flex items-center justify-center">
              <PackageX className="w-14 h-14 text-muted-foreground opacity-40" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-foreground mb-3">No orders yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm text-base leading-relaxed">
            You haven&apos;t placed any orders yet. Explore our collection and find something you love!
          </p>
          <Link href={href('/products')}>
            <Button size="lg" className="rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)] font-bold px-8 gap-2">
              Browse Collection <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      ) : (
        /* ── Orders List ── */
        <div className="space-y-5">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <OrderCard
                order={order}
                isExpanded={expandedOrder === order.id}
                onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                href={href}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      {orders.length > 0 && (
        <div className="mt-12 text-center">
          <Link href={href('/products')}>
            <Button variant="outline" size="lg" className="rounded-full font-bold px-8 gap-2 hover:border-primary/50 transition-colors">
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
