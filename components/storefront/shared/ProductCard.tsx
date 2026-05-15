'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { calcDiscountPercent, formatCurrency } from '@/lib/utils';
import { useStoreInfo } from '@/lib/StorefrontContext';
import { toast } from 'sonner';

export function ProductCard({ product, href }) {
  const addItem = useCartStore((state) => state.addItem);
  const storeInfo = useStoreInfo();
  const currency = storeInfo?.currency;

  const hasDiscount = product.compare_at_price && Number.parseFloat(product.compare_at_price) > Number.parseFloat(product.price);
  const discount = calcDiscountPercent(product.price, product.compare_at_price);
  const isOutOfStock = (product.total_stock ?? product.stock) <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const cartItem = {
      product: product.id,
      variant: null,
      quantity: 1,
      unitPrice: Number.parseFloat(product.price),
      name: product.name,
      variantLabel: null,
      thumbnail: product.thumbnail,
      slug: product.slug,
    };

    addItem(cartItem);
    toast.success(`${product.name} added to cart!`, {
      description: 'You can review your cart anytime.',
    });
  };

  return (
    <div className="group relative bg-background rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-border">
      <Link href={href(`/products/${product.slug}`)} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <span className="text-5xl font-bold text-muted-foreground/30 uppercase">
                {product.name?.charAt(0)}
              </span>
            </div>
          )}

          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-destructive text-white text-xs font-bold px-2.5 py-1 rounded-full z-10 shadow-lg">
              -{discount}%
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-20 flex items-center justify-center">
              <span className="bg-foreground text-background text-xs tracking-wider uppercase font-semibold py-2 px-5 rounded-full">
                Sold Out
              </span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 z-30">
            <button
              className="p-2.5 bg-background/95 backdrop-blur-sm rounded-full text-muted-foreground hover:text-destructive hover:bg-background shadow-lg transition-all"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              className="p-2.5 bg-background/95 backdrop-blur-sm rounded-full text-muted-foreground hover:text-primary hover:bg-background shadow-lg transition-all"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {!isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 transition-all duration-300 z-30">
              <Button
                className="w-full rounded-xl h-11 font-medium shadow-lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
          </div>

          {product.category_name && (
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
              {product.category_name}
            </p>
          )}

          <h3 className="font-semibold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-foreground">
              {formatCurrency(product.price, currency)}
            </p>
            {hasDiscount && (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price, currency)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
