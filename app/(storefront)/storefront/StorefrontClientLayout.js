'use client';

import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Outfit } from 'next/font/google';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { StoreInfoProvider } from '@/lib/StorefrontContext';
import AuthModal from '@/components/storefront/AuthModal';
import CartSidebar from '@/components/storefront/CartSidebar';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/storefront/shared/theme-provider';
import { Navbar } from '@/components/storefront/shared/Navbar';
import { Footer } from '@/components/storefront/shared/Footer';

import '@/app/provision-theme.css';

const outfit = Outfit({ subsets: ["latin"] });

export default function StorefrontClientLayout({ children }) {
  const [store, setStore] = useState(null);
  const [storeNotFound, setStoreNotFound] = useState(false);
  const [categories, setCategories] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [cartOpen, setCartOpen] = useState(false);
  const { href } = useStorefrontPath();

  useEffect(() => {
    storefrontAPI.getStoreInfo()
      .then((res) => setStore(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setStoreNotFound(true);
        }
      });
    storefrontAPI.getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  if (storeNotFound) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        forcedTheme="dark"
      >
        <div className={`storefront-theme ${outfit.className} min-h-screen flex flex-col items-center justify-center antialiased bg-background text-foreground`}>
          <div className="text-center max-w-md px-6">
            <div className="mb-6 text-6xl font-extrabold text-muted-foreground/30">404</div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">Store not found</h1>
            <p className="text-muted-foreground mb-8">
              The store you&apos;re looking for doesn&apos;t exist or is no longer available.
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
    >
      <StoreInfoProvider store={store}>
      <div className={`storefront-theme ${outfit.className} min-h-screen flex flex-col antialiased bg-background text-foreground`}>
        <Navbar
          storeName={store?.name}
          onOpenAuth={(tab = 'signin') => { setAuthTab(tab); setAuthOpen(true); }}
          onOpenCart={() => setCartOpen(true)}
        />

        <main className="flex-grow pt-16">
            {children}
        </main>

        <Footer store={store} categories={categories} href={href} />

        <AuthModal open={authOpen} onClose={closeAuth} initialTab={authTab} />
        <CartSidebar open={cartOpen} onClose={closeCart} />
        <Toaster />
      </div>
      </StoreInfoProvider>
    </ThemeProvider>
  );
}

StorefrontClientLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
