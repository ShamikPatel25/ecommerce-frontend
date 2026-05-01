'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 landing-nav-glass">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-extrabold landing-gradient-text">
          StoreScale
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex space-x-10">
          <a href="#features" className="font-medium text-gray-700 hover:text-purple-600 transition-colors">
            Features
          </a>
          <a href="#howitworks" className="font-medium text-gray-700 hover:text-purple-600 transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="font-medium text-gray-700 hover:text-purple-600 transition-colors">
            Pricing
          </a>
          <a href="#testimonials" className="font-medium text-gray-700 hover:text-purple-600 transition-colors">
            Testimonials
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="hidden md:inline font-medium text-gray-700 hover:text-purple-600 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="landing-gradient-bg text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity landing-shadow-soft text-sm"
          >
            Start Free Trial
          </Link>
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-6 py-5 space-y-4">
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="block font-medium text-gray-700 hover:text-purple-600"
            >
              Features
            </a>
            <a
              href="#howitworks"
              onClick={() => setMobileOpen(false)}
              className="block font-medium text-gray-700 hover:text-purple-600"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="block font-medium text-gray-700 hover:text-purple-600"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileOpen(false)}
              className="block font-medium text-gray-700 hover:text-purple-600"
            >
              Testimonials
            </a>
            <Link
              href="/login"
              className="block font-medium text-gray-700 hover:text-purple-600"
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
