'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { useThemeStore } from '@/store/themeStore';
import { storeAPI } from '@/lib/api';
import { getSubdomain } from '@/lib/subdomain';
import Sidebar from '@/components/Sidebar';
import { useNotificationSocket } from '@/lib/useNotificationSocket';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const theme = useThemeStore((state) => state.theme);
  const { activeStore, setActiveStore, setStores } = useStoreStore();
  const [ready, setReady] = useState(false);
  const [storeResolved, setStoreResolved] = useState(false);

  // Connect to notification WebSocket
  useNotificationSocket();

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
      setReady(true);
    }
  }, [hasHydrated, user, token, router]);

  // Resolve active store before rendering pages
  useEffect(() => {
    if (!ready) return;

    const resolveStore = async () => {
      try {
        const res = await storeAPI.myStores();
        const storeList = res.data?.stores || res.data || [];
        setStores(storeList);

        // If on a subdomain (e.g., nike.localhost:3000), auto-select that store
        const subdomain = getSubdomain(window.location.host);
        if (subdomain && storeList.length > 0) {
          const subdomainStore = storeList.find(s => s.subdomain === subdomain);
          if (subdomainStore) {
            setActiveStore(subdomainStore);
          } else if (!activeStore || !storeList.find(s => s.id === activeStore.id)) {
            setActiveStore(storeList[0]);
          }
        } else if (storeList.length > 0) {
          // No subdomain: keep current activeStore if valid, else pick first
          const currentValid = activeStore && storeList.find(s => s.id === activeStore.id);
          if (!currentValid) {
            setActiveStore(storeList[0]);
          }
        } else if (activeStore) {
          setActiveStore(null);
        }
      } catch {
        /* no stores — that's fine */
      } finally {
        setStoreResolved(true);
      }
    };
    resolveStore();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !storeResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <main className="flex-1 pt-14 md:pt-0 md:ml-64 min-w-0">
        {children}
      </main>
    </div>
  );
}
