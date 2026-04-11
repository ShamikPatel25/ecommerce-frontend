'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, Search } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar({ storeName, onOpenAuth, onOpenCart }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const { href } = useStorefrontPath();
  const customer = useStorefrontAuthStore((state) => state.customer);
  const accessToken = useStorefrontAuthStore((state) => state.accessToken);
  const logout = useStorefrontAuthStore((state) => state.logout);
  const isLoggedIn = !!(customer && accessToken);
  
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <Link href={href('/')} className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href={href('/products')} className="text-muted-foreground hover:text-foreground transition-colors">Products</Link>
            {isLoggedIn && (
              <Link href={href('/account/orders')} className="text-muted-foreground hover:text-foreground transition-colors">Orders</Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="w-5 h-5" />
            <span className="sr-only">Search</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative group" onClick={onOpenCart}>
            <ShoppingCart className="w-5 h-5 group-hover:text-foreground transition-colors" />
            {isMounted && itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary">
                {itemCount}
              </Badge>
            )}
            <span className="sr-only">Cart</span>
          </Button>

          <div className="hidden sm:flex items-center">
            {isMounted && isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full border-none bg-transparent hover:bg-muted focus:outline-none">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
                      {(customer.first_name || customer.email || '?').charAt(0).toUpperCase()}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{customer.first_name} {customer.last_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href={href('/account/orders')} className="w-full h-full block">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 font-medium cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <>
                 <Button variant="ghost" onClick={() => onOpenAuth('signin')} className="mr-2">Sign In</Button>
                 <Button onClick={() => onOpenAuth('signup')} className="rounded-full">Sign Up</Button>
               </>
            )}
          </div>

          <Sheet>
            <SheetTrigger id="mobile-menu-trigger" className="md:hidden flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="flex flex-col gap-6 mt-10">
                <Link href={href('/')} className="text-lg font-medium hover:text-primary transition-colors">Home</Link>
                <Link href={href('/products')} className="text-lg font-medium hover:text-primary transition-colors">Products</Link>
                <button onClick={onOpenCart} className="text-lg font-medium flex items-center justify-between hover:text-primary transition-colors w-full text-left">
                  Cart 
                  {isMounted && itemCount > 0 && <Badge className="rounded-full">{itemCount}</Badge>}
                </button>
                {isMounted && isLoggedIn && (
                  <Link href={href('/account/orders')} className="text-lg font-medium hover:text-primary transition-colors">Orders</Link>
                )}
                <hr className="my-2 border-border" />
                {isMounted && isLoggedIn ? (
                  <>
                    <Link href={href('/account')} className="text-lg font-medium hover:text-primary transition-colors">Account</Link>
                    <button onClick={logout} className="text-lg font-medium text-red-500 hover:text-red-600 transition-colors w-full text-left">Sign Out</button>
                  </>
                ) : (
                  <button onClick={() => onOpenAuth('signin')} className="text-lg font-medium hover:text-primary transition-colors w-full text-left">Sign In / Sign Up</button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
