'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { getBaseUrl } from '@/lib/subdomain';
import { Toaster } from 'sonner';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#pricing', label: 'Pricing' },
];

export default function ProvisionLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 20));
  useEffect(() => { setMounted(true); }, []);

  const base = mounted ? getBaseUrl() : 'http://localhost:3000';

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Toaster position="top-right" richColors />

      {/* ─── Navbar ─── */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? 'bg-gray-950/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
        initial={false}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight">Provision</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-5 py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-300"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              <a
                href={`${base}/login`}
                className="hidden md:inline-flex px-5 py-2.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                Login
              </a>
              <a
                href={`${base}/register`}
                className="hidden md:inline-flex px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-orange-500 to-pink-500 rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
              >
                Get Started
              </a>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 rounded-2xl text-white/80"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="md:hidden bg-gray-950/95 backdrop-blur-2xl border-t border-white/[0.06] overflow-hidden"
            >
              <div className="px-4 py-6 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3.5 text-sm font-semibold text-white/70 hover:text-orange-400 rounded-2xl hover:bg-white/[0.04] transition-all"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-4 border-t border-white/[0.06] mt-4 space-y-2">
                  <a href={`${base}/login`} className="block px-4 py-3 text-sm font-semibold text-white/60 hover:text-white transition-colors">
                    Login
                  </a>
                  <a href={`${base}/register`} className="block mx-4 text-center py-3 text-sm font-bold bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl">
                    Get Started Free
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ─── Main ─── */}
      <main className="flex-1">{children}</main>

      {/* ─── Footer ─── */}
      <footer className="relative bg-gray-950 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/[0.03] rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-black text-xl">Provision</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                The modern multi-tenant e-commerce platform. Launch your online store in minutes.
              </p>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR'] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.2em]">{col.title}</h3>
                <div className="space-y-3.5">
                  {col.links.map((link) => (
                    <a key={link} href="#" className="group flex items-center gap-2 text-sm text-gray-500 hover:text-orange-400 transition-colors">
                      <span className="w-0 group-hover:w-3 h-px bg-orange-400 transition-all duration-300" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Provision. All rights reserved.</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
                Built with Next.js &amp; Django
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
