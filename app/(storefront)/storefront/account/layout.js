'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';
import { useStorefrontPath } from '@/lib/useStorefrontPath';
import { AccountSidebar } from '@/components/storefront/shared/AccountSidebar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';

export default function AccountLayout({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const customer = useStorefrontAuthStore((state) => state.customer);
  const accessToken = useStorefrontAuthStore((state) => state.accessToken);
  const isLoggedIn = !!(customer && accessToken);
  const router = useRouter();
  const { href } = useStorefrontPath();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push(href('/'));
    }
  }, [isMounted, isLoggedIn, router, href]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header with Menu Button */}
      <div className="md:hidden sticky top-14 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-background" showCloseButton={false}>
            <SheetTitle className="sr-only">Account Menu</SheetTitle>
            <div onClick={() => setSidebarOpen(false)}>
              <AccountSidebar />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold text-foreground">My Account</h1>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 lg:w-80 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <AccountSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
