'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { storefrontAPI } from '@/lib/storefrontApi';
import { X, ShoppingBag, Minus, Plus, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useStoreInfo } from '@/lib/StorefrontContext';

export default function CartSidebar({ open, onClose }) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const removeOutOfStock = useCartStore((s) => s.removeOutOfStock);
  const updateItemStock = useCartStore((s) => s.updateItemStock);
  const { href } = useStorefrontPath();
  const storeInfo = useStoreInfo();
  const currency = storeInfo?.currency;

  const [validating, setValidating] = useState(false);
  const lastValidatedRef = useRef(null);

  // Validate live stock from API whenever cart opens
  /* eslint-disable react-hooks/set-state-in-effect -- async validation */
  useEffect(() => {
    if (!open || items.length === 0) return;

    // Build a fingerprint of current items to avoid redundant fetches
    const fingerprint = items.map((i) => `${i.product}-${i.variant}`).join(',');
    if (lastValidatedRef.current === fingerprint) return;
    lastValidatedRef.current = fingerprint;

    setValidating(true);

    // Fetch each unique product (by slug) in parallel
    const uniqueSlugs = [...new Set(items.filter((i) => i.slug).map((i) => i.slug))];

    Promise.allSettled(uniqueSlugs.map((slug) => storefrontAPI.getProduct(slug)))
      .then((results) => {
        results.forEach((result, idx) => {
          if (result.status !== 'fulfilled') return;
          const product = result.value.data;
          const slug = uniqueSlugs[idx];

          // Update maxStock for all cart items that match this product
          items.forEach((cartItem) => {
            if (cartItem.slug !== slug) return;

            let liveStock;
            if (cartItem.variant && product.attribute_groups?.length > 0) {
              // Find variant stock from attribute_groups structure
              liveStock = 0;
              for (const group of product.attribute_groups) {
                for (const val of group.values || []) {
                  // Check direct variant (single-attribute products)
                  if (val.variant?.variant_id === cartItem.variant) {
                    liveStock = val.variant.stock ?? 0;
                  }
                  // Check available_variants (multi-attribute products)
                  for (const av of val.available_variants || []) {
                    for (const v of av.available_values || []) {
                      if (v.variant_id === cartItem.variant) {
                        liveStock = v.stock ?? 0;
                      }
                    }
                  }
                }
              }
            } else {
              liveStock = product.stock ?? 0;
            }

            updateItemStock(cartItem.product, cartItem.variant, liveStock);
          });
        });
      })
      .finally(() => setValidating(false));
  }, [open, items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  // Only count in-stock items toward total
  const total = items.reduce((sum, item) => {
    if ((item.maxStock ?? 1) <= 0) return sum;
    return sum + (item.unitPrice || item.price) * item.quantity;
  }, 0);

  const hasOutOfStockItems = items.some((i) => (i.maxStock ?? 1) <= 0);
  const allOutOfStock = items.length > 0 && items.every((i) => (i.maxStock ?? 1) <= 0);

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close cart"
        className={`fixed inset-0 z-[100] w-full h-full bg-background/80 backdrop-blur-sm transition-opacity duration-300 border-none cursor-default ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[101] h-full w-full sm:w-[400px] bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Your Cart</h2>
            {validating && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking stock…
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Out-of-stock banner */}
        {hasOutOfStockItems && !validating && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-500">Some items are out of stock</p>
              <p className="text-xs text-muted-foreground mt-0.5">Remove them to proceed to checkout.</p>
            </div>
            <button
              onClick={removeOutOfStock}
              className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors whitespace-nowrap shrink-0 underline underline-offset-2"
            >
              Remove all
            </button>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-20 h-20 text-muted-foreground opacity-20 mb-6" />
            <p className="text-xl font-bold text-card-foreground mb-2">Your cart is empty</p>
            <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything yet.</p>
            <Button onClick={onClose} size="lg" className="rounded-full shadow-lg shadow-primary/20">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              {items.map((item, idx) => {
                const uniqueKey = `${item.product || item.id}-${item.variant || 'base'}-${idx}`;
                const isOutOfStock = (item.maxStock ?? 1) <= 0;
                return (
                  <div key={uniqueKey} className={`flex gap-4 group ${isOutOfStock ? 'opacity-70' : ''}`}>
                    {/* Thumbnail */}
                    <div className="w-24 h-24 shrink-0 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center relative">
                      {item.thumbnail ? (
                        <Image src={item.thumbnail} alt={item.name} fill sizes="96px" className="object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground opacity-30" />
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-[9px] tracking-widest uppercase font-bold text-red-400 text-center px-1">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-card-foreground line-clamp-2 leading-tight">{item.name}</h4>
                          <button
                            onClick={() => removeItem(item.product || item.id, item.variant)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {item.variantLabel && (
                          <p className="text-xs text-muted-foreground mt-1">{item.variantLabel}</p>
                        )}
                        {isOutOfStock && (
                          <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> No longer available
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {isOutOfStock ? (
                          <button
                            onClick={() => removeItem(item.product || item.id, item.variant)}
                            className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors underline underline-offset-2"
                          >
                            Remove item
                          </button>
                        ) : (
                          <div className="flex items-center border border-border rounded-lg bg-background">
                            <button
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-l-lg transition-colors"
                              onClick={() => {
                                if (item.quantity <= 1) removeItem(item.product || item.id, item.variant);
                                else updateQuantity(item.product || item.id, item.variant, item.quantity - 1);
                              }}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-r-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              onClick={() => updateQuantity(item.product || item.id, item.variant, item.quantity + 1)}
                              disabled={item.maxStock != null && item.quantity >= item.maxStock}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className={`font-bold ${isOutOfStock ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {formatCurrency((item.unitPrice || item.price || 0) * item.quantity, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-card">
              <div className="flex items-center justify-between font-black text-xl mb-2">
                <span>Total</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Taxes and shipping calculated at checkout</p>
              <div className="grid grid-cols-1 gap-3">
                {allOutOfStock ? (
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-full font-bold text-lg rounded-xl"
                    onClick={removeOutOfStock}
                  >
                    Clear Cart
                  </Button>
                ) : (
                  <Link
                    href={hasOutOfStockItems || validating ? '#' : href('/checkout')}
                    onClick={hasOutOfStockItems || validating ? (e) => e.preventDefault() : onClose}
                    aria-disabled={hasOutOfStockItems || validating}
                    className={`${buttonVariants({ size: 'lg' })} w-full font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] ${
                      hasOutOfStockItems || validating ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    {validating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Validating…
                      </span>
                    ) : (
                      'Proceed to Checkout'
                    )}
                  </Link>
                )}
                <Button variant="outline" size="lg" className="w-full rounded-xl" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
