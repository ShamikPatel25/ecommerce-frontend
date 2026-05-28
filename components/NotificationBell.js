'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ShoppingCart, Package, Sparkles, Pencil, Trash2, AlertTriangle, FolderPlus, Tag, Store, Settings, Check } from 'lucide-react';
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

const NOTIFICATION_CONFIG = {
  order_created: {
    icon: ShoppingCart,
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  order_status_changed: {
    icon: Package,
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  product_created: {
    icon: Sparkles,
    bgColor: 'bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  product_updated: {
    icon: Pencil,
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  product_deleted: {
    icon: Trash2,
    bgColor: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  product_low_stock: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  category_created: {
    icon: FolderPlus,
    bgColor: 'bg-cyan-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  category_deleted: {
    icon: Trash2,
    bgColor: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  attribute_created: {
    icon: Tag,
    bgColor: 'bg-pink-500/10',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  attribute_deleted: {
    icon: Trash2,
    bgColor: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  store_created: {
    icon: Store,
    bgColor: 'bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  store_updated: {
    icon: Settings,
    bgColor: 'bg-slate-500/10',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  bgColor: 'bg-gray-500/10',
  iconColor: 'text-gray-600 dark:text-gray-400',
};

export default function NotificationBell({ variant = 'sidebar' }) {
  const router = useRouter();
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
    if ((notif.notification_type === 'order_created' || notif.notification_type === 'order_status_changed') && notif.data?.order_id) {
      setOpen(false);
      router.push(`/orders/${notif.data.order_id}`);
    }
  };

  const buttonCls = variant === 'topbar'
    ? 'relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
    : 'p-2 rounded-lg hover:bg-gray-800 transition relative text-gray-400 hover:text-white';

  const iconCls = variant === 'topbar'
    ? 'w-5 h-5 text-gray-500 dark:text-gray-400'
    : 'w-5 h-5';

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
      >
        <Bell className={iconCls} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-2">
                {visibleNotifications.map((notif) => {
                  const config = NOTIFICATION_CONFIG[notif.notification_type] || DEFAULT_CONFIG;
                  const IconComponent = config.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`p-3 rounded-xl mb-1 last:mb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        !notif.is_read ? 'bg-violet-50/50 dark:bg-violet-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium text-gray-900 dark:text-white ${!notif.is_read ? 'font-semibold' : ''}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">
                            {formatTimeAgo(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
