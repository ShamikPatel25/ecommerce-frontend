'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
import { calcDiscountPercent, formatCurrency } from '@/lib/utils';
import { useStoreInfo } from '@/lib/StorefrontContext';
import { useFavoritesStore } from '@/store/favoritesStore';
import { toast } from 'sonner';

export function ProductCard({ product, href }) {
  const router = useRouter();
  const storeInfo = useStoreInfo();
  const currency = storeInfo?.currency;
  const toggleFavorite = useFavoritesStore((s) => s.toggleItem);
  const isFavorite = useFavoritesStore((s) => s.isFavorite(product.id));

  const hasDiscount = product.compare_at_price && Number.parseFloat(product.compare_at_price) > Number.parseFloat(product.price);
  const discount = calcDiscountPercent(product.price, product.compare_at_price);
  const isOutOfStock = (product.total_stock ?? product.stock) <= 0;
  const productUrl = href(`/products/${product.slug}`);

  const handleCardClick = () => {
    router.push(productUrl);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleFavorite({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_at_price: product.compare_at_price,
      thumbnail: product.thumbnail,
      category_name: product.category_name,
    });
    if (added) {
      toast.success('Added to favorites!');
    } else {
      toast.success('Removed from favorites');
    }
  };

  return (
    <div
      className="group relative bg-background rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-border cursor-pointer"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      {/* Image Section */}
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
          <span className="absolute top-3 left-3 bg-destructive text-white text-xs font-bold px-2.5 py-1 rounded-full z-10 shadow-lg pointer-events-none">
            -{discount}%
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-20 flex items-center justify-center pointer-events-none">
            <span className="bg-foreground text-background text-xs tracking-wider uppercase font-semibold py-2 px-5 rounded-full">
              Sold Out
            </span>
          </div>
        )}

        {/* Favorite button */}
        <button
          type="button"
          className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-all z-30 ${
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-background/95 backdrop-blur-sm text-muted-foreground hover:text-red-500 hover:bg-background opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0'
          }`}
          onClick={handleFavoriteClick}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Info */}
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
    </div>
  );
}
