import Link from 'next/link';
import { Mail, Phone, ArrowRight, CreditCard, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer({ store, categories, href }) {
  const storeName = store?.name || 'Store';
  const currentYear = new Date().getFullYear();

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
    { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
    { icon: RotateCcw, title: 'Easy Returns', desc: '30-day policy' },
    { icon: CreditCard, title: 'Flexible Payment', desc: 'Multiple options' },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-b border-border/50">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 py-12 lg:py-16">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href={href('/')} className="inline-flex items-center gap-2 font-bold text-xl tracking-tight mb-4">
              <span className="bg-primary text-primary-foreground w-9 h-9 rounded-lg flex items-center justify-center text-lg font-black">
                {storeName.charAt(0).toUpperCase()}
              </span>
              {storeName}
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
              {store?.description || 'Discover quality products curated for you. We bring the best selection with exceptional service and fast delivery.'}
            </p>
            <div className="flex gap-2">
              {['facebook', 'twitter', 'instagram', 'youtube'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all text-xs font-bold uppercase"
                >
                  {social.charAt(0)}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm text-foreground mb-4">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link href={href('/products')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              {categories?.slice(0, 4).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={href(`/products?category=${cat.slug}`)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm text-foreground mb-4">Account</h4>
            <ul className="space-y-3">
              <li>
                <Link href={href('/account')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href={href('/account/orders')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link href={href('/cart')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href={href('/checkout')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <h4 className="font-semibold text-sm text-foreground mb-4">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe for exclusive deals, new arrivals, and insider-only discounts.
            </p>
            <form className="flex gap-2 mb-6">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full h-11 bg-background border border-border text-foreground pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <Button type="submit" size="icon" className="h-11 w-11 rounded-xl flex-shrink-0">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (800) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@{storeName.toLowerCase().replace(/\s+/g, '')}.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t border-border/50 text-sm text-muted-foreground">
          <p>&copy; {currentYear} {storeName}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <span className="cursor-pointer hover:text-primary transition-colors">Privacy Policy</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Terms of Service</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Shipping Info</span>
            <span className="cursor-pointer hover:text-primary transition-colors">Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
