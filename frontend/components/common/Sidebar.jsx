'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Upload,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils-cn';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    // Dispatch event for layout to listen
    window.dispatchEvent(new CustomEvent('sidebar-collapse', { detail: { collapsed: newState } }));
  };

  const navLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Stats'
    },
    {
      href: '/inventory',
      label: 'Inventory',
      icon: Package,
      description: 'Manage Food Items'
    },
    {
      href: '/uploads',
      label: 'Uploads',
      icon: Upload,
      description: 'Manage Images'
    },
    {
      href: '/logs',
      label: 'Consumption Logs',
      icon: ClipboardList,
      description: 'Track Usage'
    },
    {
      href: '/resources',
      label: 'Resources',
      icon: BookOpen,
      description: 'Learning Center'
    },
  ];

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const renderSidebarContent = () => (
    <>
      {/* Top spacing for header */}
      <div className="h-16"></div>

      {/* User Profile Section */}
      <div className="px-4 mb-6 mt-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 transition-all duration-300 w-full hover:bg-gray-800/50 rounded-xl",
              !collapsed ? "p-3" : "p-2 justify-center"
            )}>
              <Avatar className={cn(
                "transition-all duration-300",
                !collapsed ? "h-10 w-10" : "h-12 w-12"
              )}>
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-semibold">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 slide-in-right text-left">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              )}
            </button>
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

      {/* Navigation Links */}
      <nav className="px-4 space-y-2 flex-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "sidebar-link flex items-center gap-3 px-4 py-3 text-sm font-medium",
                isActive && "sidebar-link-active",
                !isActive && "text-gray-400 hover:text-white",
                collapsed && "justify-center"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive && "text-teal-400"
              )} />
              {!collapsed && (
                <div className="flex-1 slide-in-right">
                  <div className={cn(
                    "font-semibold",
                    isActive && "text-teal-400"
                  )}>
                    {link.label}
                  </div>
                  <div className="text-xs text-gray-500">{link.description}</div>
                </div>
              )}
              {!collapsed && isActive && (
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4" />

      {/* Bottom Actions */}
      <div className="px-4 pb-6 space-y-2">
        <button
          onClick={logout}
          className={cn(
            "sidebar-link w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="slide-in-right">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle - Modern Design */}
      <button
        onClick={handleCollapse}
        className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-gray-900 text-white hover:scale-110 transition-all shadow-lg z-50"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft className={cn(
          "w-4 h-4 transition-transform",
          collapsed && "rotate-180"
        )} />
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col sidebar fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-40",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="glass border-b border-gray-800/50 sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text">FoodFlow</h1>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="sidebar absolute left-0 top-0 h-screen w-72 flex flex-col fade-in">
              {renderSidebarContent()}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
