'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BookOpen,
  User,
  LogOut,
  TrendingUp,
  Upload,
  Settings,
  ChevronRight,
  Bot,
  ScanLine,
  Award,
  Bell,
  Leaf,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Stats'
    },
    {
      href: '/insights',
      label: 'Insights',
      icon: TrendingUp,
      description: 'AI Analysis'
    },
    {
      href: '/impact',
      label: 'Impact Score',
      icon: Award,
      description: 'Sustainability Score'
    },
    {
      href: '/waste-estimation',
      label: 'Waste Estimation',
      icon: Leaf,
      description: 'AI Waste Analysis'
    },
    {
      href: '/meal-planner',
      label: 'Meal Planner',
      icon: ClipboardList,
      description: 'Weekly Meal Plans'
    },
    {
      href: '/nourishbot',
      label: 'NourishBot',
      icon: Bot,
      description: 'AI Chat Assistant'
    },
    {
      href: '/ocr-scan',
      label: 'OCR Scanner',
      icon: ScanLine,
      description: 'Extract from Images'
    },
    {
      href: '/alerts',
      label: 'Expiration Alerts',
      icon: Bell,
      description: 'Monitor Expiring Items'
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

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <a
              className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:p-0! flex items-center gap-3"
              data-slot="sidebar-menu-button"
              data-sidebar="menu-button"
              data-size="lg"
              data-active="false"
              href="/dashboard"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00FFB1]/10 via-transparent to-[#00FFB1]/0 flex items-center justify-center">
                <img
                  alt="InnovateX leaf logo"
                  loading="lazy"
                  width="44"
                  height="44"
                  decoding="async"
                  data-nimg="1"
                  className="rounded-2xl"
                  src="/logo.svg"
                  style={{ color: 'transparent' }}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">InnovateX FoodFlow</span>
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.label}
                      size="lg"
                      className={`
                        relative overflow-hidden transition-all duration-300
                        ${isActive
                          ? 'bg-gradient-to-r from-lime-500/20 to-lime-600/10 border-l-4 border-lime-500 font-bold'
                          : 'hover:bg-gradient-to-r hover:from-lime-500/10 hover:to-transparent hover:border-l-4 hover:border-lime-500/50'
                        }
                      `}
                    >
                      <Link href={link.href} className="flex items-center gap-3 w-full [&:hover_.icon-box]:bg-lime-500/20 [&:hover_.icon-box]:text-lime-400 [&:hover_.icon-box_.icon]:scale-110 [&:hover_.label]:text-lime-400 [&:hover_.label]:font-bold [&:hover_.description]:text-lime-400/70">
                        <div className={`
                          icon-box flex items-center justify-center rounded-lg p-2 transition-all duration-300
                          ${isActive
                            ? 'bg-gradient-to-br from-lime-500 to-lime-600 text-white'
                            : 'bg-muted/50 text-muted-foreground'
                          }
                        `}>
                          <Icon className={`
                            icon size-5 transition-transform duration-300
                            ${isActive ? 'scale-110' : ''}
                          `} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`
                            label block truncate transition-all duration-300
                            ${isActive
                              ? 'text-lime-400 font-bold text-base'
                              : 'font-semibold text-foreground/90'
                            }
                          `}>
                            {link.label}
                          </span>
                          <span className={`
                            description block text-xs truncate transition-all duration-300
                            ${isActive
                              ? 'text-lime-400/70'
                              : 'text-muted-foreground/70'
                            }
                          `}>
                            {link.description}
                          </span>
                        </div>
                        {isActive && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-lime-400 to-lime-600 rounded-l-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {user?.profile_image && (
                      <AvatarImage
                        src={`${process.env.NEXT_PUBLIC_API_URL}${user.profile_image}`}
                        alt={user?.full_name}
                      />
                    )}
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-lime-500 to-lime-600 text-white text-sm font-semibold">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.full_name}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-lime-500/30"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-r from-lime-500/10 to-transparent border border-lime-500/20">
                    <Avatar className="h-10 w-10 rounded-xl ring-2 ring-lime-500/30">
                      {user?.profile_image && (
                        <AvatarImage
                          src={`${process.env.NEXT_PUBLIC_API_URL}${user.profile_image}`}
                          alt={user?.full_name}
                        />
                      )}
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-lime-500 to-lime-600 text-white text-sm font-bold">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold text-foreground">{user?.full_name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer group/item">
                    <Settings className="mr-2 h-4 w-4 transition-transform group-hover/item:rotate-90" />
                    <span className="font-medium">Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10 cursor-pointer group/item"
                >
                  <LogOut className="mr-2 h-4 w-4 transition-transform group-hover/item:translate-x-1" />
                  <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
