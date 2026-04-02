'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { PageTransition, MagneticButton } from '@/components/storefront/animations';

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);
  const { items, removeItem, updateQuantity } = useCartStore();

  useEffect(() => { setHydrated(true); }, []);

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-24">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-orange-500/30 border-t-orange-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center pt-32">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="w-28 h-28 mx-auto rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
          </motion.div>
          <motion.h2
            className="text-2xl font-black text-gray-900 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your cart is empty
          </motion.h2>
          <motion.p
            className="text-gray-500 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Looks like you haven&apos;t added anything yet.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/products">
              <MagneticButton
                as="div"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/25"
              >
                Continue Shopping <ArrowRight className="w-5 h-5" />
              </MagneticButton>
            </Link>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <span className="text-orange-500 font-bold text-xs uppercase tracking-[0.2em] mb-2 block">Shopping</span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            Your <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Cart</span>
          </h1>
          <p className="text-gray-500 mt-2">{items.reduce((s, i) => s + i.quantity, 0)} items in your cart</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={`${item.product}-${item.variant}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-5 bg-white rounded-3xl border border-gray-100 p-5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-shadow duration-500"
                >
                  {/* Thumbnail */}
                  <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                    <motion.div
                      className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                    >
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                    </motion.div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`} className="font-bold text-gray-900 hover:text-orange-600 transition-colors truncate block text-lg">
                      {item.name}
                    </Link>
                    {item.variantLabel && (
                      <p className="text-sm text-gray-400 mt-1 font-medium">{item.variantLabel}</p>
                    )}
                    <p className="text-lg font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-2">
                      ${parseFloat(item.unitPrice).toFixed(2)}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <div className="inline-flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden">
                        <motion.button
                          onClick={() => updateQuantity(item.product, item.variant, item.quantity - 1)}
                          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>
                        <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                        <motion.button
                          onClick={() => updateQuantity(item.product, item.variant, item.quantity + 1)}
                          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-gray-900 text-lg">
                          ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                        </span>
                        <motion.button
                          onClick={() => removeItem(item.product, item.variant)}
                          className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-7 sticky top-28 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-black text-gray-900 text-xl mb-6">Order Summary</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span className="font-medium">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="font-medium">Shipping</span>
                  <span className="text-green-600 font-bold">Free</span>
                </div>
                <div className="border-t-2 border-gray-200/50 pt-4 flex justify-between">
                  <span className="font-black text-gray-900 text-lg">Total</span>
                  <span className="font-black text-gray-900 text-2xl">${subtotal.toFixed(2)}</span>
                </div>
              </div>
              <Link href="/checkout">
                <MagneticButton
                  as="div"
                  className="mt-7 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/25 cursor-pointer"
                >
                  Checkout <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </Link>
              <Link
                href="/products"
                className="mt-4 w-full flex items-center justify-center text-sm text-gray-500 hover:text-orange-600 font-semibold py-3 rounded-2xl hover:bg-white transition-all"
              >
                Continue Shopping
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
