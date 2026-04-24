'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { storeAPI } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { Sun, Moon } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import StoreDeactivatedModal from '@/components/StoreDeactivatedModal';


export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const { activeStore, stores, setActiveStore, setStores } = useStoreStore();
  const { theme, toggleTheme } = useThemeStore();
  const [open, setOpen] = useState(false);

  // Dropdowns
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const storeDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
    setStoreDropdownOpen(false);
    setSettingsDropdownOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target)) {
        setStoreDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch user's stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await storeAPI.myStores();
        const storeList = res.data?.stores || res.data || [];
        setStores(storeList);
        // Auto-select first store if none active
        if (!activeStore && storeList.length > 0) {
          setActiveStore(storeList[0]);
        }
        // If active store no longer in list, reset
        if (activeStore && storeList.length > 0) {
          const found = storeList.find((s) => s.id === activeStore.id);
          if (!found) setActiveStore(storeList[0]);
        }
        // If user has no stores, clear active store
        if (storeList.length === 0 && activeStore) {
          setActiveStore(null);
        }
      } catch {
        /* fail silently */
      }
    };
    fetchStores();
  }, []);

  const handleStoreSwitch = (store) => {
    if (!store.is_active) {
      setStoreDropdownOpen(false);
      setShowDeactivatedModal(true);
      return;
    }
    setActiveStore(store);
    setStoreDropdownOpen(false);
    globalThis.location.reload();
  };

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Orders', href: '/orders', icon: '🛒' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Catalogs', href: '/catalogs', icon: '📚' },
    { name: 'Customers', href: '/customers', icon: '👥' },
    { name: 'Stores', href: '/stores', icon: '🏪' },
    { name: 'Categories', href: '/categories', icon: '📁' },
    { name: 'Attributes', href: '/attributes', icon: '🏷️' },
  ];

  const storeName = activeStore?.name || 'No Store';
  const storeInitial = storeName.charAt(0).toUpperCase();

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            🛍️
          </div>
          <div>
            <h1 className="text-lg font-bold">E-Commerce</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Store Switcher */}
      <div className="p-4 border-b border-gray-800" ref={storeDropdownRef}>
        {stores.length === 0 && !activeStore ? (
          <Link
            href="/stores/create"
            className="flex items-center gap-3 w-full text-left hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-400">No Store Found</p>
              <p className="text-xs text-orange-500">Create your first store</p>
            </div>
          </Link>
        ) : (
        <>
        <button
          onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
          className="flex items-center gap-3 w-full text-left hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
        >
          <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {storeInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{storeName}</p>
            <p className="text-xs text-gray-400">Store Owner</p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${storeDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Store Dropdown */}
        {storeDropdownOpen && (
          <div className="mt-2 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Switch Store</p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {stores.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-500 text-center">No stores found</p>
              ) : (
                stores.map((store) => {
                  const isActive = activeStore?.id === store.id;
                  return (
                    <button
                      key={store.id}
                      onClick={() => handleStoreSwitch(store)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {store.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${!store.is_active ? 'text-gray-500' : ''}`}>{store.name}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] text-gray-500">{store.subdomain}</p>
                          {!store.is_active && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Inactive</span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings Dropdown at Bottom */}
      <div className="p-4 border-t border-gray-800" ref={settingsDropdownRef}>
        <div className="relative">
          <button
            onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition w-full ${
              settingsDropdownOpen || pathname.startsWith('/settings')
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span className="font-medium flex-1 text-left">Settings</span>
            <svg
              className={`w-4 h-4 transition-transform ${settingsDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Settings Dropdown */}
          {settingsDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
              <Link
                href="/settings"
                onClick={() => setSettingsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">Edit Profile</span>
              </Link>
              <Link
                href="/settings/change-password"
                onClick={() => setSettingsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">Change Password</span>
              </Link>
              <div className="border-t border-gray-700">
                <button
                  onClick={() => { setSettingsDropdownOpen(false); logout(); }}
                  className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-colors w-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile Topbar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 dark:bg-gray-950 text-white flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-lg">
            🛍️
          </div>
          <span className="font-bold text-base">E-Commerce</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-800 transition"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>
          <NotificationBell />
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800 transition"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Overlay ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-gray-900 dark:bg-gray-950 text-white z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <NavContent />
      </div>

      {/* ── Desktop Fixed Sidebar ── */}
      <div className="hidden md:flex w-64 bg-gray-900 dark:bg-gray-950 text-white min-h-screen flex-col fixed left-0 top-0 border-r border-gray-800">
        <NavContent />
      </div>

      <StoreDeactivatedModal
        open={showDeactivatedModal}
        onClose={() => setShowDeactivatedModal(false)}
      />
    </>
  );
}
