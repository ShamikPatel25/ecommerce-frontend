'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShoppingBag, Package, ClipboardList } from 'lucide-react';
import { PageTransition } from '@/components/storefront/animations';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { href } = useStorefrontPath();
  const orderId = searchParams.get('order');
  const customer = useStorefrontAuthStore((s) => s.customer);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-12 text-center min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center">

        {/* ── Success animation ── */}
        <motion.div
          className="relative w-28 h-28 mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Animated rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 border border-primary/50">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thank you! <span className="inline-block">🎉</span>
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-base mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Your order has been placed successfully and is being processed.
        </motion.p>

        {/* ── Order ID pill ── */}
        {orderId && (
          <motion.div
            className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-5 py-2.5 mb-6 shadow-lg shadow-black/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-card-foreground">Order #{orderId}</span>
          </motion.div>
        )}

        {/* ── Logged-in customer info banner ── */}
        {customer && (
          <motion.div
            className="mb-6 mx-auto max-w-md p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <ClipboardList className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Order saved to your account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You can view and track this order anytime in <span className="font-semibold text-primary">Orders</span>.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── CTA buttons ── */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* "View Orders" — only for logged-in users */}
          {customer && (
            <Link
              href={href('/account/orders')}
              className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-6 py-3 rounded-xl font-bold whitespace-nowrap border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ClipboardList className="w-4 h-4" /> View Orders
            </Link>
          )}

          <Link
            href={href('/products')}
            className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-6 py-3 rounded-xl font-bold whitespace-nowrap border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>

          <Link
            href={href('/')}
            className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-6 py-3 rounded-xl font-bold whitespace-nowrap border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
          >
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
