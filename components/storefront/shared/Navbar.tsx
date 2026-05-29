'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, LogOut, User, Heart, KeyRound } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import FavoritesSidebar from '@/components/storefront/FavoritesSidebar';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            : 'bg-background/80 backdrop-blur-sm'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-14 md:h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href={href('/')}
              className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight text-foreground"
            >
              <span className="bg-primary text-primary-foreground w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-sm md:text-base font-black">
                {(storeName || 'S').charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{storeName || 'Store'}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
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

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* Favorites Button - Always visible */}
              <button
                type="button"
                onClick={() => setFavoritesOpen(true)}
                className="relative h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
              >
                <Heart className="h-5 w-5" />
                {isMounted && favoritesCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 md:h-5 md:min-w-5 flex items-center justify-center p-0 rounded-full bg-red-500 text-white text-[10px] md:text-xs font-semibold hover:bg-red-500">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </Badge>
                )}
                <span className="sr-only">Favorites</span>
              </button>

              {isMounted && isLoggedIn ? (
                <>
                  {/* Cart - Desktop only (mobile has bottom nav) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex relative h-10 w-10 rounded-full text-foreground/70 hover:text-foreground hover:bg-muted"
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

                  {/* User Avatar/Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 p-1 md:px-2 md:py-1.5 rounded-full hover:bg-muted transition-colors outline-none">
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
                </>
              ) : (
                /* Not Logged In - Show Login/Signup buttons */
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenAuth('signin')}
                    className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-medium text-foreground/70 hover:text-foreground"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onOpenAuth('signup')}
                    className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm font-medium rounded-full"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Favorites Sidebar */}
      <FavoritesSidebar open={favoritesOpen} onClose={() => setFavoritesOpen(false)} />
    </>
  );
}
