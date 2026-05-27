'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { X, Heart, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useStoreInfo } from '@/lib/StorefrontContext';

export default function FavoritesSidebar({ open, onClose }) {
  const items = useFavoritesStore((s) => s.items);
  const removeItem = useFavoritesStore((s) => s.removeItem);
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);
  const { href } = useStorefrontPath();
  const router = useRouter();
  const storeInfo = useStoreInfo();
  const currency = storeInfo?.currency;

  const handleProductClick = (slug) => {
    onClose();
    router.push(href(`/products/${slug}`));
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close favorites"
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
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h2 className="text-2xl font-bold tracking-tight">Favorites</h2>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">({items.length})</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Heart className="w-20 h-20 text-muted-foreground opacity-20 mb-6" />
            <p className="text-xl font-bold text-card-foreground mb-2">No favorites yet</p>
            <p className="text-muted-foreground mb-8">Items you heart will appear here.</p>
            <Button onClick={onClose} size="lg" className="rounded-full shadow-lg shadow-primary/20">
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  {/* Thumbnail */}
                  <div
                    className="w-24 h-24 shrink-0 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center relative cursor-pointer"
                    onClick={() => handleProductClick(item.slug)}
                  >
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={item.name} fill sizes="96px" className="object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground opacity-30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => handleProductClick(item.slug)}
                        >
                          <h4 className="font-semibold text-card-foreground line-clamp-2 leading-tight hover:text-primary transition-colors">
                            {item.name}
                          </h4>
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {item.category_name && (
                        <p className="text-xs text-muted-foreground mt-1">{item.category_name}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">
                          {formatCurrency(item.price, currency)}
                        </p>
                        {item.compare_at_price && Number(item.compare_at_price) > Number(item.price) && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(item.compare_at_price, currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-card">
              <div className="grid grid-cols-1 gap-3">
                <Button
                  size="lg"
                  className="w-full font-bold text-lg rounded-xl"
                  onClick={() => {
                    onClose();
                    router.push(href('/products'));
                  }}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={clearFavorites}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Favorites
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
