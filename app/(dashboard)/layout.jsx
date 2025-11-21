'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AppSidebar from '@/components/common/AppSidebar';
import ThemeToggle from '@/components/common/ThemeToggle';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';


export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Get page title based on pathname
  const getPageTitle = () => {
    const path = pathname.split('/').pop() || 'dashboard';
    const titles = {
      'dashboard': 'Dashboard',
      'insights': 'Insights',
      'impact': 'Impact Score',
      'meal-planner': 'Meal Planner',
      'nourishbot': 'NourishBot',
      'ocr-scan': 'OCR Scanner',
      'alerts': 'Expiration Alerts',
      'inventory': 'Inventory',
      'uploads': 'Uploads',
      'logs': 'Consumption Logs',
      'resources': 'Resources',
      'profile': 'Profile',
    };
    return titles[path] || 'Dashboard';
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-4 flex-1">
            <a className="flex items-center gap-3" href="/dashboard">
              <img
                alt="InnovateX leaf logo"
                loading="lazy"
                width="40"
                height="40"
                decoding="async"
                data-nimg="1"
                className="rounded-2xl shadow-[0_18px_30px_rgba(0,255,177,0.15)] rotate-2"
                src="/logo.svg"
                style={{ color: 'transparent' }}
              />
            </a>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-300/70">{getPageTitle()}</p>
              <h1 className="text-lg font-semibold">InnovateX FoodFlow</h1>
            </div>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
