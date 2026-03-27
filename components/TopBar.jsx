'use client';

import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { Sun, Moon, Bell } from 'lucide-react';

export default function TopBar() {
  const { theme, toggleTheme } = useThemeStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Sample notifications - in real app these would come from an API
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New order #1024 received', time: '2 min ago', read: false },
    { id: 2, text: 'Product "Nike Air Max" is low on stock', time: '15 min ago', read: false },
    { id: 3, text: 'Order #1020 has been delivered', time: '1 hr ago', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="relative p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-slate-600" />
        ) : (
          <Sun className="w-5 h-5 text-amber-400" />
        )}
      </button>

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#ff6600] hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notif.read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.read && (
                        <span className="mt-1.5 w-2 h-2 bg-[#ff6600] rounded-full flex-shrink-0" />
                      )}
                      <div className={!notif.read ? '' : 'ml-5'}>
                        <p className="text-sm text-slate-700 dark:text-gray-200">{notif.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
