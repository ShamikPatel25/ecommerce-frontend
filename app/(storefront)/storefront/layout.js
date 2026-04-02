'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { storefrontAPI } from '@/lib/storefrontApi';
import { useCartStore } from '@/store/cartStore';
import { ShoppingCart, Menu, X, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Toaster } from 'sonner';

export default function StorefrontLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Server & first client render: simple shell (no motion, no store data)
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl" />
              <div className="flex items-center gap-1">
                <div className="p-2.5"><ShoppingCart className="w-5 h-5 text-white/90" /></div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // After hydration: full animated layout
  return <HydratedLayout>{children}</HydratedLayout>;
}

function HydratedLayout({ children }) {
  const pathname = usePathname();
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdown, setCategoryDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  useEffect(() => {
    storefrontAPI.getStoreInfo().then((res) => setStore(res.data)).catch(() => { });
    storefrontAPI.getCategories().then((res) => setCategories(res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoryDropdown(false);
  }, [pathname]);

  const storeName = store?.name || 'Store';
  const isHome = pathname === '/' || pathname === '/storefront';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Toaster position="top-right" richColors />

      {/* ─── Floating Navbar ─── */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled
            ? 'bg-white/70 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border-b border-gray-200/30'
            : isHome
              ? 'bg-transparent'
              : 'bg-white/70 backdrop-blur-2xl'
          }`}
        initial={false}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={storeName}
                  className="h-10 w-10 rounded-2xl object-cover ring-2 ring-white/50 shadow-lg"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/30">
                  {storeName.charAt(0)}
                </div>
              )}
              <div className="flex flex-col">
                <span className={`text-lg font-black tracking-tight transition-colors leading-tight ${!scrolled && isHome ? 'text-white' : 'text-gray-900'
                  }`}>
                  {storeName}
                </span>
                <span className={`text-[9px] uppercase tracking-[0.2em] font-bold transition-colors ${!scrolled && isHome ? 'text-white/50' : 'text-gray-400'
                  }`}>
                  Premium Store
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/', label: 'Home', match: (p) => p === '/' || p === '/storefront' },
                { href: '/products', label: 'Products', match: (p) => p.startsWith('/products') },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${item.match(pathname)
                      ? (!scrolled && isHome ? 'text-white bg-white/10' : 'text-orange-600 bg-orange-50')
                      : (!scrolled && isHome ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')
                    }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Category Dropdown */}
              {categories.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setCategoryDropdown(true)}
                  onMouseLeave={() => setCategoryDropdown(false)}
                >
                  <button className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${!scrolled && isHome ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}>
                    Categories
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {categoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-3 w-72 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-gray-100 py-3 overflow-hidden"
                      >
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/products?category=${cat.slug}`}
                            className="group flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 hover:text-orange-600 transition-all"
                          >
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-orange-500 font-bold text-xs group-hover:scale-110 transition-transform">
                              {cat.name.charAt(0)}
                            </span>
                            <div>
                              <p className="font-semibold">{cat.name}</p>
                              {cat.children?.length > 0 && (
                                <p className="text-[10px] text-gray-400">{cat.children.length} subcategories</p>
                              )}
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {/* Cart */}
              <Link href="/cart">
                <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${!scrolled && isHome
                    ? 'text-white/90 hover:bg-white/10'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* Mobile Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2.5 rounded-2xl ${!scrolled && isHome ? 'text-white' : 'text-gray-600'
                  }`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-1">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/products', label: 'All Products' },
                  { href: '/cart', label: 'Cart' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-gray-700 hover:text-orange-600 rounded-2xl hover:bg-orange-50 transition-all">
                    {item.label}
                    <ArrowUpRight className="w-4 h-4 text-gray-300" />
                  </Link>
                ))}
                <div className="pt-3 border-t border-gray-100 mt-3">
                  <p className="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Categories</p>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-orange-600 rounded-2xl hover:bg-orange-50 transition-all"
                    >
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-orange-500 font-bold text-[10px]">
                        {cat.name.charAt(0)}
                      </span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ─── Main Content ─── */}
      <main className="flex-1">{children}</main>

      {/* ─── Footer ─── */}
      <footer className="relative bg-gray-950 text-gray-400 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/[0.03] rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-16">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20">
                  {storeName.charAt(0)}
                </div>
                <div>
                  <span className="text-white font-black text-xl block leading-tight">{storeName}</span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">Premium Store</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {store?.description || 'Discover amazing products with the best quality and prices. Your satisfaction is our priority.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 md:gap-16">
              <div>
                <h3 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.2em]">Quick Links</h3>
                <div className="space-y-3.5">
                  {[
                    { href: '/', label: 'Home' },
                    { href: '/products', label: 'Products' },
                    { href: '/cart', label: 'Shopping Cart' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-gray-500 hover:text-orange-400 transition-colors"
                    >
                      <span className="w-0 group-hover:w-3 h-px bg-orange-400 transition-all duration-300" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <h3 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.2em]">Categories</h3>
                  <div className="space-y-3.5">
                    {categories.slice(0, 5).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.slug}`}
                        className="group flex items-center gap-2 text-sm text-gray-500 hover:text-orange-400 transition-colors"
                      >
                        <span className="w-0 group-hover:w-3 h-px bg-orange-400 transition-all duration-300" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-600">
                &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
                Powered by E-Commerce Platform
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
