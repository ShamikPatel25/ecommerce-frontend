'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShoppingBag, Package } from 'lucide-react';
import { PageTransition, MagneticButton } from '@/components/storefront/animations';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center pt-32">
        {/* Success animation */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Animated rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 to-emerald-400/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/10 to-emerald-400/10"
            animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/30">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle className="w-14 h-14 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Confetti-like particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${30 + Math.random() * 40}%`,
              top: `${20 + Math.random() * 30}%`,
              background: ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'][i % 5],
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -100 - Math.random() * 100],
              x: [-50 + Math.random() * 100],
            }}
            transition={{ duration: 2, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
          />
        ))}

        <motion.h1
          className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Thank you! <span className="inline-block">🎉</span>
        </motion.h1>
        <motion.p
          className="text-gray-500 text-lg mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Your order has been placed successfully.
        </motion.p>
        {orderId && (
          <motion.div
            className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Package className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-gray-600">Order #{orderId}</span>
          </motion.div>
        )}

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link href="/products">
            <MagneticButton
              as="div"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/25"
            >
              <ShoppingBag className="w-5 h-5" /> Continue Shopping
            </MagneticButton>
          </Link>
          <Link href="/">
            <MagneticButton
              as="div"
              className="inline-flex items-center gap-2 text-gray-600 px-8 py-4 rounded-2xl font-bold border-2 border-gray-200 hover:bg-gray-50 transition-all"
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
            className="w-16 h-16 rounded-full border-2 border-green-500/30 border-t-green-500"
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
