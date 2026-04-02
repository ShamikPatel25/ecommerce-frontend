'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationAPI } from '@/lib/api';

function formatTimeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ICON_MAP = {
  order_created: '🛒',
  order_status_changed: '📦',
  product_created: '✨',
  product_updated: '📝',
  product_deleted: '🗑️',
  product_low_stock: '⚠️',
  category_created: '📁',
  category_deleted: '🗑️',
  attribute_created: '🏷️',
  attribute_deleted: '🗑️',
  store_created: '🏪',
  store_updated: '⚙️',
};

export default function NotificationBell({ variant = 'sidebar' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    markAllAsRead();
    try { await notificationAPI.markAllRead(); } catch { /* silent */ }
  };

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
      try { await notificationAPI.markRead(notif.id); } catch { /* silent */ }
    }
  };

  const buttonCls = variant === 'topbar'
    ? 'relative p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm'
    : 'p-2 rounded-lg hover:bg-gray-800 transition relative text-gray-400 hover:text-white';

  const iconCls = variant === 'topbar'
    ? 'w-5 h-5 text-slate-600 dark:text-gray-300'
    : 'w-5 h-5';

  // All unread + max 10 read
  const MAX_READ = 10;
  const visibleNotifications = useMemo(() => {
    const unread = notifications.filter((n) => !n.is_read);
    const read = notifications.filter((n) => n.is_read);
    return [...unread, ...read.slice(0, MAX_READ)];
  }, [notifications]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={buttonCls}
        title="Notifications"
      >
        <Bell className={iconCls} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs font-normal text-slate-400">({unreadCount})</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#ff6600] hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-gray-500">No notifications yet</p>
              </div>
            ) : (
              visibleNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                    !notif.is_read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5 flex-shrink-0">
                      {ICON_MAP[notif.notification_type] || '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-[#ff6600] rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
                        {formatTimeAgo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
