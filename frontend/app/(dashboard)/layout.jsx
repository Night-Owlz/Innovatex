'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import ThemeToggle from '@/components/common/ThemeToggle';
import { Settings, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils-cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Listen to sidebar collapse state changes
  useEffect(() => {
    const handleSidebarChange = (e) => {
      setSidebarCollapsed(e.detail.collapsed);
    };
    window.addEventListener('sidebar-collapse', handleSidebarChange);
    return () => window.removeEventListener('sidebar-collapse', handleSidebarChange);
  }, []);

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

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header - Full Width */}
      <header className="sticky top-0 z-50 glass border-b border-gray-800/50 backdrop-blur-md">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">FoodFlow</h1>
              <p className="text-xs text-gray-500">Premium</p>
            </div>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:ring-offset-0">
                    <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-teal-500/30 transition-all duration-300">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-semibold">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass border-gray-800" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{user?.full_name}</p>
                      <p className="text-xs leading-none text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content Area with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
