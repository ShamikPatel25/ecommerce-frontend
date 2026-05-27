'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Menu, LogOut, User, Heart, KeyRound } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import FavoritesSidebar from '@/components/storefront/FavoritesSidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';

export function Navbar({ storeName, onOpenAuth, onOpenCart }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const favoriteItems = useFavoritesStore((state) => state.items);
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
  const favoritesCount = favoriteItems.length;

  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- SSR hydration + scroll listener */
  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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

  const navLinkClass = (path: string) =>
    `relative px-1 py-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-primary'
        : 'text-foreground/70 hover:text-foreground'
    }`;

  return (
    <>
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-lg shadow-sm border-b border-border/50'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href={href('/')}
              className="flex items-center gap-2 font-bold text-xl md:text-2xl tracking-tight text-foreground"
            >
              <span className="bg-primary text-primary-foreground w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-base md:text-lg font-black">
                {(storeName || 'S').charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{storeName || 'Store'}</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link href={href('/')} className={navLinkClass('/')}>
                Home
                {isActive('/') && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
              <Link href={href('/products')} className={navLinkClass('/products')}>
                Products
                {isActive('/products') && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
              {isLoggedIn && (
                <Link href={href('/account/orders')} className={navLinkClass('/account/orders')}>
                  Orders
                  {isActive('/account/orders') && (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Favorites Button */}
            <button
              type="button"
              onClick={() => setFavoritesOpen(true)}
              className="relative h-10 w-10 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            >
              <Heart className="h-5 w-5" />
              {isMounted && favoritesCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-500">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </Badge>
              )}
              <span className="sr-only">Favorites</span>
            </button>

            {isMounted && isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted"
                onClick={onOpenCart}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary">
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            )}

            {isMounted && isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted transition-colors outline-none">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      {(customer.first_name || customer.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground/80 hidden xl:block">
                      {customer.first_name || 'Account'}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={12} className="w-64 p-0 overflow-hidden border-0 shadow-xl">
                    {/* User Header */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-md">
                          {(customer.first_name || customer.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {customer.first_name ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Welcome'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <DropdownMenuItem className="rounded-lg px-3 py-2.5 focus:bg-primary/10">
                        <Link href={href('/account')} className="flex items-center gap-3 w-full">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Profile</p>
                            <p className="text-xs text-muted-foreground">Manage your account</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg px-3 py-2.5 focus:bg-primary/10">
                        <Link href={href('/account/change-password')} className="flex items-center gap-3 w-full">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Change Password</p>
                            <p className="text-xs text-muted-foreground">Update your security</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-0" />

                    {/* Sign Out */}
                    <div className="p-2">
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="rounded-lg px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <p className="font-medium text-sm">Sign Out</p>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => onOpenAuth('signin')}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => onOpenAuth('signup')}
                  className="rounded-full px-5 text-sm font-medium shadow-sm"
                >
                  Get Started
                </Button>
              </div>
            )}

            {isMounted && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors">
                  <Menu className="w-5 h-5 text-foreground" />
                  <span className="sr-only">Toggle Menu</span>
                </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[350px] border-l border-border bg-background p-0"
              >
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border">
                    <Link
                      href={href('/')}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 font-bold text-xl tracking-tight"
                    >
                      <span className="bg-primary text-primary-foreground w-9 h-9 rounded-lg flex items-center justify-center text-lg font-black">
                        {(storeName || 'S').charAt(0).toUpperCase()}
                      </span>
                      {storeName || 'Store'}
                    </Link>
                  </div>

                  <nav className="flex flex-col p-4 gap-1 flex-grow">
                    <Link
                      href={href('/')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 text-base font-medium transition-colors rounded-xl px-4 py-3.5 ${
                        isActive('/')
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/80 hover:bg-muted'
                      }`}
                    >
                      Home
                    </Link>
                    <Link
                      href={href('/products')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 text-base font-medium transition-colors rounded-xl px-4 py-3.5 ${
                        isActive('/products')
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/80 hover:bg-muted'
                      }`}
                    >
                      Products
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setFavoritesOpen(true);
                      }}
                      className="flex items-center justify-between text-base font-medium text-foreground/80 hover:bg-muted transition-colors w-full text-left rounded-xl px-4 py-3.5"
                    >
                      <span className="flex items-center gap-3">
                        <Heart className="w-5 h-5" />
                        Favorites
                      </span>
                      {isMounted && favoritesCount > 0 && (
                        <Badge className="rounded-full bg-red-500 text-white">
                          {favoritesCount}
                        </Badge>
                      )}
                    </button>
                    {isMounted && isLoggedIn && (
                      <>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onOpenCart();
                          }}
                          className="flex items-center justify-between text-base font-medium text-foreground/80 hover:bg-muted transition-colors w-full text-left rounded-xl px-4 py-3.5"
                        >
                          <span className="flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5" />
                            Cart
                          </span>
                          {itemCount > 0 && (
                            <Badge className="rounded-full bg-primary text-primary-foreground">
                              {itemCount}
                            </Badge>
                          )}
                        </button>
                        <Link
                          href={href('/account/orders')}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 text-base font-medium transition-colors rounded-xl px-4 py-3.5 ${
                            isActive('/account/orders')
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground/80 hover:bg-muted'
                          }`}
                        >
                          Orders
                        </Link>
                      </>
                    )}
                  </nav>

                  <div className="p-4 border-t border-border mt-auto">
                    {isMounted && isLoggedIn ? (
                      <div className="space-y-2">
                        <Link
                          href={href('/account')}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-base font-medium text-foreground/80 hover:bg-muted transition-colors rounded-xl px-4 py-3.5 w-full"
                        >
                          <User className="w-5 h-5" />
                          Profile
                        </Link>
                        <Link
                          href={href('/account/change-password')}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-base font-medium text-foreground/80 hover:bg-muted transition-colors rounded-xl px-4 py-3.5 w-full"
                        >
                          <KeyRound className="w-5 h-5" />
                          Change Password
                        </Link>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 text-base font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left rounded-xl px-4 py-3.5"
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onOpenAuth('signin');
                          }}
                          variant="outline"
                          className="w-full rounded-xl h-12 text-base font-medium"
                        >
                          Sign In
                        </Button>
                        <Button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onOpenAuth('signup');
                          }}
                          className="w-full rounded-xl h-12 text-base font-medium"
                        >
                          Create Account
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>)}
          </div>
        </div>
      </div>
    </header>

      {/* Favorites Sidebar */}
      <FavoritesSidebar open={favoritesOpen} onClose={() => setFavoritesOpen(false)} />
    </>
  );
}
