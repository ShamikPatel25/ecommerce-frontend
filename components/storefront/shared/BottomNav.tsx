'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface BottomNavProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenCart: () => void;
}

export function BottomNav({ onOpenAuth, onOpenCart }: BottomNavProps) {
  const { href } = useStorefrontPath();
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const customer = useStorefrontAuthStore((state) => state.customer);
  const accessToken = useStorefrontAuthStore((state) => state.accessToken);
  const isLoggedIn = !!(customer && accessToken);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setIsMounted(true));
  }, []);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isActive = (path: string) => {
    const fullPath = href(path);
    if (path === '/') return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
      isLink: true,
    },
    {
      icon: Search,
      label: 'Products',
      href: '/products',
      isLink: true,
    },
    {
      icon: ShoppingBag,
      label: 'Cart',
      href: '/cart',
      isLink: false,
      onClick: () => {
        if (isLoggedIn) {
          onOpenCart();
        } else {
          onOpenAuth('signin');
        }
      },
      badge: isLoggedIn ? itemCount : 0,
    },
    {
      icon: User,
      label: 'Account',
      href: '/account',
      isLink: isLoggedIn,
      onClick: !isLoggedIn ? () => onOpenAuth('signin') : undefined,
    },
  ];

  if (!isMounted) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isLink && isActive(item.href);

          if (item.isLink) {
            return (
              <Link
                key={item.label}
                href={href(item.href)}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  {item.badge && item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center p-0 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center p-0 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
