'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Settings, User, Lock, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/orders': 'Orders',
  '/products': 'Products',
  '/catalogs': 'Catalogs',
  '/categories': 'Categories',
  '/attributes': 'Attributes',
  '/customers': 'Customers',
  '/stores': 'Stores',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path + '/')) return title;
  }
  return 'Dashboard';
}

export default function TopBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const title = getPageTitle(pathname);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Close on route change
  useEffect(() => {
    setSettingsOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, []);

  return (
    <div className="hidden md:flex items-center justify-between h-14 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-500" />
          ) : (
            <Sun className="w-5 h-5 text-amber-400" />
          )}
        </button>

        {/* Notification Bell */}
        <NotificationBell variant="topbar" />

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-2 rounded-lg transition-colors ${
              settingsOpen
                ? 'bg-gray-100 dark:bg-gray-800 text-orange-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden z-50">
              <Link
                href="/settings"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                <span>Profile</span>
              </Link>
              <Link
                href="/settings/change-password"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
              >
                <Lock className="w-4 h-4 text-gray-400" />
                <span>Change Password</span>
              </Link>
              <button
                onClick={() => { setSettingsOpen(false); logout(); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
