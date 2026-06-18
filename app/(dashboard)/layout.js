'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { useThemeStore } from '@/store/themeStore';
import { storeAPI } from '@/lib/api';
import { getSubdomain } from '@/lib/subdomain';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useNotificationSocket } from '@/lib/useNotificationSocket';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const theme = useThemeStore((state) => state.theme);
  const { activeStore, setActiveStore, setStores } = useStoreStore();
  const [ready, setReady] = useState(false);
  const [storeResolved, setStoreResolved] = useState(false);
  const abortControllerRef = useRef(null);

  // Connect to notification WebSocket (only after store is resolved)
  useNotificationSocket(storeResolved);

  // Apply dark class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth check
  useEffect(() => {
    if (!hasHydrated) return;
    const accessToken = token || localStorage.getItem('access_token');
    if (!user || !accessToken) {
      router.push('/login');
    } else {
      queueMicrotask(() => setReady(true));
    }
  }, [hasHydrated, user, token, router]);

  // Resolve active store before rendering pages
  useEffect(() => {
    if (!ready) return;

    // If we already have a valid active store, skip the API call
    if (activeStore?.id) {
      queueMicrotask(() => setStoreResolved(true));
      return;
    }

    // Cancel any pending request from previous render
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    let cancelled = false;

    const resolveStore = async () => {
      try {
        const res = await storeAPI.myStores({ signal });
        if (cancelled) return;

        const storeList = res.data?.stores || res.data || [];
        setStores(storeList);

        const subdomain = getSubdomain(window.location.host);
        if (subdomain && storeList.length > 0) {
          const subdomainStore = storeList.find(s => s.subdomain === subdomain);
          if (subdomainStore) {
            setActiveStore(subdomainStore);
          } else if (!activeStore || !storeList.find(s => s.id === activeStore.id)) {
            setActiveStore(storeList[0]);
          }
        } else if (storeList.length > 0) {
          const currentValid = activeStore && storeList.find(s => s.id === activeStore.id);
          if (!currentValid) {
            setActiveStore(storeList[0]);
          }
        } else if (activeStore) {
          setActiveStore(null);
        }
        setStoreResolved(true);
      } catch (err) {
        if (cancelled || err.name === 'CanceledError') return;
        setStoreResolved(true);
      }
    };
    resolveStore();

    return () => {
      cancelled = true;
      abortControllerRef.current?.abort();
    };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !storeResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }

  const storeFreePaths = ['/dashboard', '/stores', '/settings'];
  const needsStore = !storeFreePaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (!activeStore && needsStore) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Sidebar />
        <div className="flex-1 pt-14 xl:pt-0 xl:ml-64 min-w-0 flex flex-col">
          <main className="flex-1 min-w-0 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="w-20 h-20 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🏪</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Your Store First</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">You need to create a store before you can manage products, orders, and more.</p>
              <button
                onClick={() => router.push('/stores/create')}
                className="px-8 py-3 bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-600 transition-all"
              >
                Create Store
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <main className="flex-1 pt-14 xl:pt-0 xl:ml-64 min-w-0">
        <TopBar />
        {children}
      </main>
    </div>
  );
}
