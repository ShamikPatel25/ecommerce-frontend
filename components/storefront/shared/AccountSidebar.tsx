'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, KeyRound, LogOut } from 'lucide-react';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { href } = useStorefrontPath();
  const customer = useStorefrontAuthStore((state) => state.customer);
  const logoutFn = useStorefrontAuthStore((state) => state.fullLogout);

  const handleLogout = () => {
    logoutFn();
    router.push(href('/'));
  };

  const isActive = (path: string) => {
    const fullPath = href(path);
    return pathname === fullPath;
  };

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      href: '/account',
      description: 'Manage your info',
    },
    {
      icon: KeyRound,
      label: 'Change Password',
      href: '/account/change-password',
      description: 'Update security',
    },
  ];

  return (
    <div className="bg-background border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        {customer && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
              {(customer.first_name || customer.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {customer.first_name ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Welcome'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={href(item.href)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium">Logout</p>
        </button>
      </div>
    </div>
  );
}
