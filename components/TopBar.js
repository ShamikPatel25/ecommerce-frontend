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

const HIDE_TITLE_PATHS = [
  '/orders',
  '/products',
  '/catalogs',
  '/categories',
  '/attributes',
  '/customers',
  '/stores'
];

export default function TopBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const title = getPageTitle(pathname);
  
  const shouldHideTitle = HIDE_TITLE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Close on route change
  useEffect(() => {
    queueMicrotask(() => setSettingsOpen(false));
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
      <div className="flex-1">
        {!shouldHideTitle && (
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
        )}
      </div>

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
                ? 'bg-gray-100 dark:bg-gray-800 text-violet-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Settings</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage your account</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link
                  href="/settings"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Profile</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">View and edit profile</p>
                  </div>
                </Link>
                <Link
                  href="/settings/change-password"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Update your security</p>
                  </div>
                </Link>
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => { setSettingsOpen(false); logout(); }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <p className="font-medium">Logout</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
