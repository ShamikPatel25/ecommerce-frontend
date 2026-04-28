'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useStoreStore } from '@/store/storeStore';
import { notificationAPI } from '@/lib/api';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || (
  process.env.NODE_ENV === 'production' && typeof window !== 'undefined'
    ? (() => { throw new Error('NEXT_PUBLIC_WS_URL is required in production'); })()
    : 'ws://localhost:8000'
);

export function useNotificationSocket() {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { addNotification, setNotifications } = useNotificationStore();
  const activeStore = useStoreStore((state) => state.activeStore);
  const [tokenReady, setTokenReady] = useState(false);

  // Fetch notifications first — this goes through the API interceptor which
  // handles 401 → token refresh automatically. Once this succeeds the
  // access_token in localStorage is guaranteed to be fresh.
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.list();
      setNotifications(res.data?.results || res.data || []);
      setTokenReady(true);
    } catch {
      // API call failed even after refresh — token is unusable, skip WS
      setTokenReady(false);
    }
  }, [setNotifications]);

  useEffect(() => {
    if (activeStore?.id) fetchNotifications();
  }, [fetchNotifications, activeStore?.id]);

  // Only open the WebSocket AFTER a successful API call proves the token works
  useEffect(() => {
    const storeId = activeStore?.id;
    if (!storeId || !tokenReady) return;

    let retryCount = 0;
    const maxRetries = 5;

    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const url = `${WS_BASE_URL}/ws/notifications/${storeId}/?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount = 0;
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          addNotification(notification);
        } catch {
          /* non-JSON WS message, ignored */
        }
      };

      ws.onclose = (event) => {
        if (event.code === 1000) return;
        if (retryCount >= maxRetries) return;
        retryCount++;
        const delay = Math.min(3000 * retryCount, 15000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [activeStore?.id, addNotification, tokenReady]);
}
