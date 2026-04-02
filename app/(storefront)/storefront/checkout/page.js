'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { storefrontAPI } from '@/lib/storefrontApi';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ShoppingBag, Shield, Lock, CreditCard } from 'lucide-react';
import { PageTransition, MagneticButton } from '@/components/storefront/animations';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
  });

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);

  useEffect(() => { setHydrated(true); }, []);

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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-28 h-28 mx-auto rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">No items to checkout</h2>
          <Link href="/products" className="text-orange-600 font-bold hover:underline">
            Browse Products
          </Link>
        </div>
      </PageTransition>
    );
  }

  const validate = () => {
    const errs = {};
    if (!form.customer_name.trim()) errs.customer_name = 'Full name is required';
    if (!form.customer_email.trim()) {
      errs.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      errs.customer_email = 'Enter a valid email address';
    }
    if (!form.customer_phone.trim()) {
      errs.customer_phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.customer_phone)) {
      errs.customer_phone = 'Enter a valid 10-digit phone number';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = Object.values(errs)[0];
      toast.error(first);
      return;
    }
    setSubmitting(true);

    const orderData = {
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      notes: form.notes || undefined,
      items: items.map((item) => ({
        product: item.product,
        variant: item.variant || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    };

    try {
      const res = await storefrontAPI.createOrder(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/order-confirmation?order=${res.data.id}`);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to place order. Please try again.';
      if (data) {
        if (typeof data.error === 'string') {
          msg = data.error;
        } else if (typeof data.detail === 'string') {
          msg = data.detail;
        } else if (data.items) {
          // DRF nested serializer errors: { items: [{ product: [...] }] }
          const firstItem = Array.isArray(data.items) ? data.items[0] : data.items;
          msg = typeof firstItem === 'string' ? firstItem : JSON.stringify(firstItem);
        } else if (data.customer_name || data.customer_email || data.customer_phone) {
          // Field-level validation errors
          const fieldErrors = data.customer_name || data.customer_email || data.customer_phone;
          msg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
        } else if (typeof data === 'string') {
          msg = data;
        } else {
          // Fallback: try to extract any string from the response
          const values = Object.values(data);
          if (values.length > 0) {
            const first = values[0];
            msg = Array.isArray(first) ? first[0] : (typeof first === 'string' ? first : JSON.stringify(data));
          }
        }
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 md:pt-28">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 mb-8 font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <span className="text-orange-500 font-bold text-xs uppercase tracking-[0.2em] mb-2 block">Secure</span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Checkout</span>
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-white rounded-3xl border border-gray-100 p-7 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-black text-gray-900 text-xl">Customer Information</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.customer_name}
                      onChange={(e) => { setForm({ ...form, customer_name: e.target.value }); setErrors({ ...errors, customer_name: '' }); }}
                      placeholder="John Doe"
                      className={`w-full px-5 py-4 rounded-2xl border-2 focus:outline-none focus:ring-0 text-sm font-medium transition-colors placeholder:text-gray-300 ${errors.customer_name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-orange-500 hover:border-gray-300'}`}
                    />
                    {errors.customer_name && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.customer_name}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.customer_email}
                        onChange={(e) => { setForm({ ...form, customer_email: e.target.value }); setErrors({ ...errors, customer_email: '' }); }}
                        placeholder="john@example.com"
                        className={`w-full px-5 py-4 rounded-2xl border-2 focus:outline-none focus:ring-0 text-sm font-medium transition-colors placeholder:text-gray-300 ${errors.customer_email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-orange-500 hover:border-gray-300'}`}
                      />
                      {errors.customer_email && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.customer_email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={form.customer_phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setForm({ ...form, customer_phone: val });
                          setErrors({ ...errors, customer_phone: '' });
                        }}
                        placeholder="9876543210"
                        className={`w-full px-5 py-4 rounded-2xl border-2 focus:outline-none focus:ring-0 text-sm font-medium transition-colors placeholder:text-gray-300 ${errors.customer_phone ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-orange-500 hover:border-gray-300'}`}
                      />
                      {errors.customer_phone && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.customer_phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Order Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any special instructions..."
                      rows={3}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-0 focus:border-orange-500 text-sm font-medium resize-none transition-colors hover:border-gray-300 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {/* Security badges */}
                <div className="mt-8 flex items-center gap-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <Lock className="w-3.5 h-3.5" /> SSL Encrypted
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <Shield className="w-3.5 h-3.5" /> Secure Checkout
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-7 sticky top-28 border border-gray-100">
                <h2 className="font-black text-gray-900 text-xl mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="flex gap-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                        {item.variantLabel && <p className="text-[10px] text-gray-400 font-medium">{item.variantLabel}</p>}
                        <p className="text-[10px] text-gray-400 font-medium">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-gray-900 flex-shrink-0">
                        ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </div>
                <div className="border-t-2 border-gray-200/50 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="font-medium">Shipping</span>
                    <span className="text-green-600 font-bold">Free</span>
                  </div>
                  <div className="border-t-2 border-gray-200/50 pt-3 flex justify-between">
                    <span className="font-black text-gray-900 text-lg">Total</span>
                    <span className="font-black text-gray-900 text-2xl">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-7 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AnimatePresence mode="wait">
                    {submitting ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Placing Order...
                      </motion.span>
                    ) : (
                      <motion.span key="place" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Place Order
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
