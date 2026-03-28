'use client';

import { useThemeStore } from '@/store/themeStore';
import { Sun, Moon } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function TopBar() {
  const { theme, toggleTheme } = useThemeStore();

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
      <NotificationBell variant="topbar" />
    </div>
  );
}
