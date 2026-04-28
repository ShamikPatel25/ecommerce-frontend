import Link from 'next/link';
import { Facebook, Twitter, Instagram, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer({ store, categories, href }) {
  const storeName = store?.name || 'Provision';
  
  return (
    <footer className="bg-card border-t border-border pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <Link href={href('/')} className="font-black text-3xl tracking-tighter mb-6 inline-block text-foreground">
              {storeName}<span className="text-primary">.</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm">
              {store?.description || 'We design and curate premium products for modern professionals. Minimalist, functional, and built to last. Experience luxury in everyday essentials.'}
            </p>
            <div className="flex gap-5">
              <a href="#" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold mb-6 text-sm tracking-widest uppercase text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Shop
            </h4>
            <ul className="space-y-4 text-sm">
              <li><Link href={href('/products')} className="text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
              {categories?.slice(0, 4).map((cat) => (
                <li key={cat.id}><Link href={href(`/products?category=${cat.slug}`)} className="text-muted-foreground hover:text-primary transition-colors">{cat.name}</Link></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold mb-6 text-sm tracking-widest uppercase text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Account
            </h4>
            <ul className="space-y-4 text-sm">
              <li><Link href={href('/account/orders')} className="text-muted-foreground hover:text-primary transition-colors">My Orders</Link></li>
              <li><Link href={href('/cart')} className="text-muted-foreground hover:text-primary transition-colors">Cart</Link></li>
              <li><Link href={href('/checkout')} className="text-muted-foreground hover:text-primary transition-colors">Checkout</Link></li>
              <li><button className="text-muted-foreground hover:text-primary transition-colors">Sign In</button></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-bold mb-6 text-sm tracking-widest uppercase text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Newsletter
            </h4>
            <p className="text-muted-foreground text-sm mb-4">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex mt-2 relative">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full h-12 bg-background border border-border text-foreground px-4 rounded-xl focus:outline-none focus:border-primary transition-colors"
                required
              />
              <Button type="button" size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-lg">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border text-xs font-medium text-muted-foreground">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="cursor-pointer hover:text-primary transition-colors">Shipping & Returns</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Terms of Service</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
