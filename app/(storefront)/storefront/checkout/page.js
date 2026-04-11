'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { storefrontAPI } from '@/lib/storefrontApi';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ShoppingBag, Shield, Lock, CreditCard, AlertTriangle } from 'lucide-react';
import { PageTransition } from '@/components/storefront/animations';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { Button, buttonVariants } from '@/components/ui/button';

function validateCheckoutForm(form) {
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
}

function extractItemsError(items) {
  const firstItem = Array.isArray(items) ? items[0] : items;
  return typeof firstItem === 'string' ? firstItem : JSON.stringify(firstItem);
}

function extractCustomerFieldError(data) {
  const fieldErrors = data.customer_name || data.customer_email || data.customer_phone;
  if (!fieldErrors) return null;
  return Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
}

function parseOrderError(data) {
  if (!data) return 'Failed to place order. Please try again.';

  if (typeof data.error === 'string') return data.error;
  if (typeof data.detail === 'string') return data.detail;

  if (data.items) return extractItemsError(data.items);

  const customerError = extractCustomerFieldError(data);
  if (customerError) return customerError;

  if (typeof data === 'string') return data;

  const values = Object.values(data);
  if (values.length > 0) {
    const first = values[0];
    const extracted = Array.isArray(first) ? first[0] : first;
    return typeof extracted === 'string' ? extracted : JSON.stringify(data);
  }

  return 'Failed to place order. Please try again.';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const updateItemStock = useCartStore((s) => s.updateItemStock);
  const { href } = useStorefrontPath();
  const customer = useStorefrontAuthStore((s) => s.customer);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockValidated, setStockValidated] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
  });

  // Compute after stock is validated
  const inStockItems = items.filter((i) => (i.maxStock ?? 1) > 0);
  const hasOutOfStockItems = stockValidated && items.some((i) => (i.maxStock ?? 1) <= 0);
  const subtotal = inStockItems.reduce((sum, item) => sum + Number.parseFloat(item.unitPrice || item.price || 0) * item.quantity, 0);

  useEffect(() => { setHydrated(true); }, []);

  // Live stock validation on mount — ensures maxStock is current before any order
  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setStockValidated(true); // nothing to validate
      return;
    }
    const uniqueSlugs = [...new Set(items.filter((i) => i.slug).map((i) => i.slug))];
    if (uniqueSlugs.length === 0) {
      setStockValidated(true);
      return;
    }
    Promise.allSettled(uniqueSlugs.map((slug) => storefrontAPI.getProduct(slug)))
      .then((results) => {
        results.forEach((result, idx) => {
          if (result.status !== 'fulfilled') return;
          const product = result.value.data;
          const slug = uniqueSlugs[idx];
          items.forEach((cartItem) => {
            if (cartItem.slug !== slug) return;
            let liveStock;
            if (cartItem.variant && product.variants?.length > 0) {
              const v = product.variants.find((pv) => pv.id === cartItem.variant);
              liveStock = v ? (v.stock ?? 0) : 0;
            } else {
              liveStock = product.stock ?? 0;
            }
            updateItemStock(cartItem.product, cartItem.variant, liveStock);
          });
        });
      })
      .finally(() => setStockValidated(true));
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill form from customer profile
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || [customer.first_name, customer.last_name].filter(Boolean).join(' '),
        customer_email: prev.customer_email || customer.email || '',
      }));
    }
  }, [customer]);

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-24">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary"
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
            <div className="w-28 h-28 mx-auto rounded-[2rem] bg-card border border-border flex items-center justify-center mb-6 shadow-2xl">
              <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-50" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-black text-foreground mb-4">No items to checkout</h2>
          <Link href={href('/products')} className={`${buttonVariants({ size: 'lg' })} rounded-full font-bold px-8 shadow-[0_0_15px_rgba(212,175,55,0.2)]`}>
            Browse Products
          </Link>
        </div>
      </PageTransition>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCheckoutForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = Object.values(errs)[0];
      toast.error(first);
      return;
    }
    if (!stockValidated) {
      toast.error('Validating stock, please wait a moment...');
      return;
    }
    setSubmitting(true);

    // Only send items that are confirmed in-stock
    const validItems = items.filter((i) => (i.maxStock ?? 0) > 0);
    if (validItems.length === 0) {
      toast.error('All items in your cart are out of stock.');
      setSubmitting(false);
      return;
    }
    if (hasOutOfStockItems) {
      toast.error('Remove out-of-stock items from your cart before placing an order.');
      setSubmitting(false);
      return;
    }

    const orderData = {
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      notes: form.notes || undefined,
      items: validItems.map((item) => ({
        product: item.product || item.id,
        variant: item.variant || null,
        quantity: item.quantity,
        unit_price: item.unitPrice || item.price,
      })),
    };

    try {
      const res = await storefrontAPI.createOrder(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      router.push(href(`/order-confirmation?order=${res.data.id}`));
    } catch (err) {
      const msg = parseOrderError(err.response?.data);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 md:pt-28">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href={href('/cart')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center md:text-left"
        >
          <span className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2 block">Secure</span>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
            Checkout
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Customer Information */}
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-card rounded-3xl border border-border p-7 md:p-10 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-primary shadow-[0_0_15px_rgba(212,175,55,0.1)] shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h2 className="font-black text-card-foreground text-2xl tracking-tight">Customer Information</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="customer-name" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      value={form.customer_name}
                      onChange={(e) => { setForm({ ...form, customer_name: e.target.value }); setErrors({ ...errors, customer_name: '' }); }}
                      placeholder="John Doe"
                      className={`w-full px-5 py-4 rounded-xl bg-background border ${errors.customer_name ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'} focus:outline-none text-sm font-medium transition-all placeholder:text-muted-foreground/50 text-foreground`}
                    />
                    {errors.customer_name && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.customer_name}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="customer-email" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer-email"
                        type="email"
                        required
                        readOnly={!!customer?.email}
                        value={form.customer_email}
                        onChange={(e) => { if (!customer?.email) { setForm({ ...form, customer_email: e.target.value }); setErrors({ ...errors, customer_email: '' }); } }}
                        placeholder="john@example.com"
                        className={`w-full px-5 py-4 rounded-xl bg-background border ${customer?.email ? 'opacity-60 cursor-not-allowed' : ''} ${errors.customer_email ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'} focus:outline-none text-sm font-medium transition-all placeholder:text-muted-foreground/50 text-foreground`}
                      />
                      {errors.customer_email && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.customer_email}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="customer-phone" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={form.customer_phone}
                        onChange={(e) => {
                          const val = e.target.value.replaceAll(/\D/g, '').slice(0, 10);
                          setForm({ ...form, customer_phone: val });
                          setErrors({ ...errors, customer_phone: '' });
                        }}
                        placeholder="9876543210"
                        className={`w-full px-5 py-4 rounded-xl bg-background border ${errors.customer_phone ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'} focus:outline-none text-sm font-medium transition-all placeholder:text-muted-foreground/50 text-foreground`}
                      />
                      {errors.customer_phone && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.customer_phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="order-notes" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Notes</label>
                    <textarea
                      id="order-notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any special instructions..."
                      rows={4}
                      className="w-full px-5 py-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-medium resize-none transition-all placeholder:text-muted-foreground/50 text-foreground leading-relaxed"
                    />
                  </div>
                </div>

                {/* Security badges */}
                <div className="mt-10 flex flex-wrap items-center gap-6 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <Lock className="w-4 h-4 text-primary" /> SSL Encrypted
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-primary" /> Secure Checkout
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-muted/30 rounded-3xl p-7 sticky top-32 border border-border">
                <h2 className="font-black text-foreground text-xl mb-6 pb-4 border-b border-border/50 tracking-tight">Order Summary</h2>
                <div className="space-y-5 mb-8">
                  {/* Out-of-stock warning in summary */}
                {hasOutOfStockItems && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                      <span>⚠️</span> Some items are out of stock — go back to cart to remove them.
                    </p>
                  </div>
                )}
                {items.map((item, idx) => (
                    <motion.div
                      key={`${item.product || item.id}-${item.variant || 'base'}`}
                      className="flex gap-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="w-16 h-16 bg-card rounded-xl overflow-hidden flex-shrink-0 border border-border flex items-center justify-center relative">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-muted-foreground opacity-30" />
                        )}
                        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-md z-10">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-bold text-card-foreground line-clamp-1">{item.name}</p>
                        {item.variantLabel && <p className="text-xs text-muted-foreground font-medium mt-0.5">{item.variantLabel}</p>}
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm font-black text-foreground flex-shrink-0">
                          ${((Number.parseFloat(item.unitPrice || item.price || 0)) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="border-t border-border pt-6 space-y-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-bold">Subtotal</span>
                    <span className="font-black text-foreground">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-bold">Shipping</span>
                    <span className="text-primary font-black">Free</span>
                  </div>
                  <div className="border-t border-border/50 pt-4 flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground">Total</span>
                    <span className="font-black text-foreground text-3xl">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || hasOutOfStockItems || !stockValidated}
                  className={`mt-8 w-full h-14 font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all ${hasOutOfStockItems ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <AnimatePresence mode="wait">
                    {!stockValidated ? (
                      <motion.span key="validating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Checking stock...
                      </motion.span>
                    ) : submitting ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                      </motion.span>
                    ) : hasOutOfStockItems ? (
                      <motion.span key="oos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Remove Out-of-Stock Items
                      </motion.span>
                    ) : (
                      <motion.span key="place" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                        Place Order
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
