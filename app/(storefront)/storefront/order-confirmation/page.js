'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShoppingBag, Package, ClipboardList } from 'lucide-react';
import { PageTransition, MagneticButton } from '@/components/storefront/animations';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';

const CONFETTI_COLORS = ['#d4af37', '#b5952f', '#f9d77e', '#8a7322', '#e8c96b'];
const CONFETTI_PARTICLES = [
  { id: 'confetti-a', left: 42, top: 29, yEnd: -156, xEnd: 23,  delay: 0.5 },
  { id: 'confetti-b', left: 55, top: 38, yEnd: -134, xEnd: -12, delay: 0.6 },
  { id: 'confetti-c', left: 38, top: 32, yEnd: -189, xEnd: 45,  delay: 0.7 },
  { id: 'confetti-d', left: 63, top: 25, yEnd: -112, xEnd: -38, delay: 0.8 },
  { id: 'confetti-e', left: 47, top: 41, yEnd: -167, xEnd: 8,   delay: 0.9 },
  { id: 'confetti-f', left: 58, top: 27, yEnd: -145, xEnd: -25, delay: 1 },
  { id: 'confetti-g', left: 35, top: 36, yEnd: -178, xEnd: 33,  delay: 1.1 },
  { id: 'confetti-h', left: 51, top: 44, yEnd: -123, xEnd: -47, delay: 1.2 },
];

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { href } = useStorefrontPath();
  const orderId = searchParams.get('order');
  const customer = useStorefrontAuthStore((s) => s.customer);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-8 text-center pt-8">

        {/* ── Success animation ── */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
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
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-2xl shadow-primary/30 border border-primary/50">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle className="w-14 h-14 text-primary-foreground" />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Confetti particles ── */}
        {CONFETTI_PARTICLES.map((p, i) => (
          <motion.div
            key={p.id}
            className="absolute w-2 h-2 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, p.yEnd],
              x: [p.xEnd],
            }}
            transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
          />
        ))}

        <motion.h1
          className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thank you! <span className="inline-block">🎉</span>
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-lg mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Your order has been placed successfully and is being processed.
        </motion.p>

        {/* ── Order ID pill ── */}
        {orderId && (
          <motion.div
            className="inline-flex items-center gap-3 bg-card border border-border rounded-full px-6 py-3 mb-10 shadow-lg shadow-black/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Package className="w-5 h-5 text-primary" />
            <span className="text-base font-bold text-card-foreground">Order #{orderId}</span>
          </motion.div>
        )}

        {/* ── Logged-in customer info banner ── */}
        {customer && (
          <motion.div
            className="mb-8 mx-auto max-w-md p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <ClipboardList className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Order saved to your account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You can view and track this order anytime in <span className="font-semibold text-primary">My Orders</span>.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── CTA buttons ── */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* "View My Orders" — only for logged-in users */}
          {customer && (
            <Link href={href('/account/orders')} className="w-full sm:w-auto">
              <MagneticButton
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all"
              >
                <ClipboardList className="w-5 h-5" /> View My Orders
              </MagneticButton>
            </Link>
          )}

          <Link href={href('/products')} className="w-full sm:w-auto">
            <MagneticButton
              className={`w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${
                customer
                  ? 'text-foreground border-2 border-border hover:bg-muted'
                  : 'bg-primary text-primary-foreground text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]'
              }`}
            >
              <ShoppingBag className="w-5 h-5" /> Continue Shopping
            </MagneticButton>
          </Link>

          <Link href={href('/')} className="w-full sm:w-auto">
            <MagneticButton
              className="w-full inline-flex items-center justify-center gap-2 text-foreground px-8 py-4 rounded-2xl font-bold border-2 border-border hover:bg-muted transition-all"
            >
              Back to Home <ArrowRight className="w-4 h-4" />
            </MagneticButton>
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
