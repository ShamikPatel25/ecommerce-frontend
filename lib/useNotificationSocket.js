'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useStoreStore } from '@/store/storeStore';
import { notificationAPI } from '@/lib/api';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useNotificationSocket() {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { addNotification, setNotifications } = useNotificationStore();
  const activeStore = useStoreStore((state) => state.activeStore);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.list();
      setNotifications(res.data?.results || res.data || []);
    } catch {
      // silent fail
    }
  }, [setNotifications]);

  useEffect(() => {
    if (activeStore?.id) fetchNotifications();
  }, [fetchNotifications, activeStore?.id]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storeId = activeStore?.id;

    if (!token || !storeId) return;

    const connect = () => {
      const url = `${WS_BASE_URL}/ws/notifications/${storeId}/?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          addNotification(notification);
        } catch {
          // ignore
        }
      };

      ws.onclose = (event) => {
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
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
  }, [activeStore?.id, addNotification]);
}
