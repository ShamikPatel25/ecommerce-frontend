'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, LogOut } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export function Navbar({ storeName, onOpenAuth, onOpenCart }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const { href } = useStorefrontPath();
  const pathname = usePathname();
  const router = useRouter();
  const customer = useStorefrontAuthStore((state) => state.customer);
  const accessToken = useStorefrontAuthStore((state) => state.accessToken);
  const logoutFn = useStorefrontAuthStore((state) => state.fullLogout);
  const isLoggedIn = !!(customer && accessToken);

  const handleLogout = () => {
    logoutFn();
    router.push(href('/'));
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- SSR hydration + scroll listener */
  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isActive = (path: string) => {
    const fullPath = href(path);
    if (path === '/') return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-md border-border shadow-sm py-3'
          : 'bg-background border-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={href('/')} className="font-bold text-2xl tracking-tighter">
            {storeName || 'Provision'}<span className="text-zinc-400">.</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href={href('/')} className={`transition-colors ${isActive('/') ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Home</Link>
            <Link href={href('/products')} className={`transition-colors ${isActive('/products') ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Products</Link>
            {isLoggedIn && (
              <Link href={href('/account/orders')} className={`transition-colors ${isActive('/account/orders') ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Orders</Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="relative group h-9 w-9" onClick={onOpenCart}>
            <ShoppingCart className="h-4 w-4 group-hover:text-foreground transition-colors" />
            {isMounted && itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary">
                {itemCount}
              </Badge>
            )}
            <span className="sr-only">Cart</span>
          </Button>

          <div className="hidden sm:flex items-center gap-1">
            {isMounted && isLoggedIn ? (
              <>
                <Link href={href('/account')} className="flex items-center justify-center h-9 w-9 rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm hover:ring-2 hover:ring-primary/50 transition-all">
                    {(customer.first_name || customer.email || '?').charAt(0).toUpperCase()}
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-muted-foreground hover:text-red-500" title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
               <>
                 <Button variant="ghost" onClick={() => onOpenAuth('signin')} className="mr-2">Sign In</Button>
                 <Button onClick={() => onOpenAuth('signup')} className="rounded-full">Sign Up</Button>
               </>
            )}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger id="mobile-menu-trigger" className="md:hidden flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-border p-6" style={{ backgroundColor: 'oklch(0.205 0 0)' }}>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="flex flex-col gap-2 mt-10">
                <Link href={href('/')} onClick={() => setMobileMenuOpen(false)} className={`text-lg font-medium transition-colors rounded-lg px-4 py-3 ${isActive('/') ? 'text-primary font-bold bg-primary/10' : 'hover:text-primary hover:bg-white/5'}`}>Home</Link>
                <Link href={href('/products')} onClick={() => setMobileMenuOpen(false)} className={`text-lg font-medium transition-colors rounded-lg px-4 py-3 ${isActive('/products') ? 'text-primary font-bold bg-primary/10' : 'hover:text-primary hover:bg-white/5'}`}>Products</Link>
                <button onClick={() => { setMobileMenuOpen(false); onOpenCart(); }} className="text-lg font-medium flex items-center justify-between hover:text-primary hover:bg-white/5 transition-colors w-full text-left rounded-lg px-4 py-3">
                  Cart
                  {isMounted && itemCount > 0 && <Badge className="rounded-full">{itemCount}</Badge>}
                </button>
                {isMounted && isLoggedIn && (
                  <Link href={href('/account/orders')} onClick={() => setMobileMenuOpen(false)} className={`text-lg font-medium transition-colors rounded-lg px-4 py-3 ${isActive('/account/orders') ? 'text-primary font-bold bg-primary/10' : 'hover:text-primary hover:bg-white/5'}`}>Orders</Link>
                )}
                <hr className="my-3 border-border" />
                {isMounted && isLoggedIn ? (
                  <>
                    <Link href={href('/account')} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary hover:bg-white/5 transition-colors rounded-lg px-4 py-3">Account</Link>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="text-lg font-medium text-red-500 hover:text-red-600 hover:bg-red-500/5 transition-colors w-full text-left rounded-lg px-4 py-3">Sign Out</button>
                  </>
                ) : (
                  <button onClick={() => { setMobileMenuOpen(false); onOpenAuth('signin'); }} className="text-lg font-medium hover:text-primary hover:bg-white/5 transition-colors w-full text-left rounded-lg px-4 py-3">Sign In / Sign Up</button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
