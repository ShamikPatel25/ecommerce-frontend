'use client';

import Link from 'next/link';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

export function ProductCard({ product, href }) {
  const addItem = useCartStore((state) => state.addItem);

  const hasDiscount = product.compare_at_price && Number.parseFloat(product.compare_at_price) > Number.parseFloat(product.price);
  const discount = hasDiscount
    ? Math.round((1 - Number.parseFloat(product.price) / Number.parseFloat(product.compare_at_price)) * 100)
    : 0;
  const isOutOfStock = (product.total_stock ?? product.stock) <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
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
    <div className="group relative rounded-2xl bg-card border border-border p-4 transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={href(`/products/${product.slug}`)}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-card border border-border mb-4 flex items-center justify-center">
          {product.thumbnail ? (
             <img
              src={product.thumbnail}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
             />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-4xl font-bold uppercase transition-transform duration-500 group-hover:scale-105">
              {product.name?.charAt(0)}
            </div>
          )}
          
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-sm z-10">
              -{discount}%
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <span className="bg-foreground text-background text-[10px] tracking-widest uppercase font-bold py-1.5 px-4">
                Sold Out
              </span>
            </div>
          )}

          <button className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 z-30" onClick={(e) => e.preventDefault()}>
            <Heart className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-1 mt-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>4.9</span>
            <span className="text-muted-foreground">(24)</span>
          </div>
          
          <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors text-card-foreground">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-1 min-h-[20px]">{product.category_name || ''}</p>
          
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
               <p className="font-bold text-lg">${Number.parseFloat(product.price).toFixed(2)}</p>
               {hasDiscount && (
                 <p className="text-muted-foreground text-sm line-through">${Number.parseFloat(product.compare_at_price).toFixed(2)}</p>
               )}
            </div>
            {!isOutOfStock && (
              <Button 
                size="sm" 
                className="rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add
              </Button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    compare_at_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    slug: PropTypes.string,
    thumbnail: PropTypes.string,
    stock: PropTypes.number,
    total_stock: PropTypes.number,
    category_name: PropTypes.string,
    sku: PropTypes.string,
    vendor: PropTypes.string,
    type: PropTypes.string
  }).isRequired,
  href: PropTypes.func.isRequired,
};
