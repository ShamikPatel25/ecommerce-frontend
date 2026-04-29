'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { storeAPI } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '@/store/themeStore';
import {
  Sun, Moon, LayoutGrid, Activity, ShoppingBag, Package,
  FolderOpen, Tag, Users, Home, Bell, Settings,
  ChevronDown, LogOut, Lock, Plus, X, Menu, BookOpen, User,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import StoreDeactivatedModal from '@/components/StoreDeactivatedModal';


export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { activeStore, stores, setActiveStore, setStores } = useStoreStore();
  const { theme, toggleTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Dropdowns
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const storeDropdownRef = useRef(null);
  const settingsAccountRef = useRef(null);

  // Close sidebar on route change (mobile)
  /* eslint-disable react-hooks/set-state-in-effect -- reset UI on route change */
  useEffect(() => {
    setOpen(false);
    setStoreDropdownOpen(false);
    setSettingsExpanded(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Close dropdowns on outside click/tap
  useEffect(() => {
    const handleClick = (e) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target)) {
        setStoreDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, []);

  // Fetch user's stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await storeAPI.myStores();
        const storeList = res.data?.stores || res.data || [];
        setStores(storeList);
        if (!activeStore && storeList.length > 0) {
          setActiveStore(storeList[0]);
        }
        if (activeStore && storeList.length > 0) {
          const found = storeList.find((s) => s.id === activeStore.id);
          if (!found) setActiveStore(storeList[0]);
        }
        if (storeList.length === 0 && activeStore) {
          setActiveStore(null);
        }
      } catch {
        /* fail silently */
      }
    };
    fetchStores();
  }, [activeStore, setActiveStore, setStores]);

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

  // Pending orders count for badge
  const pendingOrdersBadge = null; // Could be wired to notification store if needed

  const menuSections = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid, alwaysEnabled: true },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { name: 'Orders', href: '/orders', icon: ShoppingBag, badge: pendingOrdersBadge },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Catalogs', href: '/catalogs', icon: BookOpen },
        { name: 'Categories', href: '/categories', icon: FolderOpen },
        { name: 'Attributes', href: '/attributes', icon: Tag },
      ],
    },
    {
      label: 'People',
      items: [
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Stores', href: '/stores', icon: Home, alwaysEnabled: true },
      ],
    },
  ];

  const hasStore = !!activeStore;
  const storeName = activeStore?.name || 'No Store';
  const storeInitial = storeName.charAt(0).toUpperCase();

  // User initials for footer
  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Admin';
  const userInitials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const renderNavContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white flex-shrink-0">
            {storeInitial}
          </div>
          <span className="text-base font-semibold text-slate-900 dark:text-slate-100">E-Com Admin</span>
        </div>
      </div>

      {/* Store Switcher */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800" ref={storeDropdownRef}>
        {stores.length === 0 && !activeStore ? (
          <Link
            href="/stores/create"
            className="flex items-center gap-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No Store Found</p>
              <p className="text-xs text-orange-500">Create your first store</p>
            </div>
          </Link>
        ) : (
        <>
        <button
          onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
          className="flex items-center gap-3 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
        >
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {storeInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{storeName}</p>
            <p className="text-xs text-gray-500">Store Owner</p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${storeDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Store Dropdown */}
        {storeDropdownOpen && (
          <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
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
                          ? 'bg-orange-500/10 text-orange-500'
                          : 'text-slate-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {store.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${!store.is_active ? 'text-gray-400 dark:text-gray-500' : ''}`}>{store.name}</p>
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

      {/* Nav Sections */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.label}>
            <div className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const disabled = !hasStore && !item.alwaysEnabled;
              const Icon = item.icon;

              if (disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 dark:text-gray-600 cursor-not-allowed mb-0.5"
                    title="Create a store first"
                  >
                    <Icon className="w-[18px] h-[18px] opacity-40" />
                    <span className="text-sm font-medium opacity-40">{item.name}</span>
                    <Lock className="w-3.5 h-3.5 ml-auto opacity-30" />
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm mb-0.5 ${
                    isActive
                      ? 'bg-gray-200 dark:bg-slate-200 text-slate-900 font-medium'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-slate-900' : ''}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-gray-200 dark:bg-gray-700 text-slate-500 dark:text-slate-400 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Account section — mobile only */}
        <div className="md:hidden" ref={settingsAccountRef}>
          <div className="px-3 pt-4 pb-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Account
          </div>
          <button
            onClick={() => {
              const next = !settingsExpanded;
              setSettingsExpanded(next);
              if (next) {
                setTimeout(() => {
                  const el = settingsAccountRef.current;
                  if (el) {
                    const nav = el.closest('nav');
                    if (nav) nav.scrollTo({ top: nav.scrollHeight, behavior: 'smooth' });
                  }
                }, 100);
              }
            }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
              pathname.startsWith('/settings')
                ? 'bg-gray-200 dark:bg-slate-200 text-slate-900 font-medium'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Settings className={`w-[18px] h-[18px] flex-shrink-0 ${pathname.startsWith('/settings') ? 'text-slate-900' : ''}`} />
            <span>Settings</span>
            <ChevronDown className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${settingsExpanded ? 'rotate-180' : ''}`} />
          </button>
          {settingsExpanded && (
            <div className="ml-4 flex flex-col gap-0.5">
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === '/settings'
                    ? 'bg-gray-200 dark:bg-slate-200 text-slate-900 font-medium'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <User className="w-[18px] h-[18px] flex-shrink-0" />
                <span>Profile</span>
              </Link>
              <Link
                href="/settings/change-password"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === '/settings/change-password'
                    ? 'bg-gray-200 dark:bg-slate-200 text-slate-900 font-medium'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Lock className="w-[18px] h-[18px] flex-shrink-0" />
                <span>Change Password</span>
              </Link>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm mb-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </nav>

      {/* Footer: User Info */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">{userName}</p>
            <p className="text-[11px] text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 text-slate-900 dark:text-white flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white">
            {storeInitial}
          </div>
          <span className="font-bold text-base">E-Com Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-gray-500" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>
          <NotificationBell />
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-64 bg-white dark:bg-[#0f1629] text-slate-900 dark:text-white z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {renderNavContent()}
      </div>

      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:flex w-64 bg-white dark:bg-[#0f1629] text-slate-900 dark:text-white min-h-screen flex-col fixed left-0 top-0 border-r border-gray-200 dark:border-gray-800">
        {renderNavContent()}
      </div>

      <StoreDeactivatedModal
        open={showDeactivatedModal}
        onClose={() => setShowDeactivatedModal(false)}
      />
    </>
  );
}
