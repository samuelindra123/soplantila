"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/auth/auth-primitives";
import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  SendIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/features/auth/context/auth-context";
import { useTheme } from "@/components/theme/theme-provider";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const MENU_ITEMS = [
  { icon: HomeIcon, label: "Feed", href: "/feed" },
  { icon: SearchIcon, label: "Explore", href: "/discovery" },
  { icon: UsersIcon, label: "Friends", href: "/friends" },
  { icon: BellIcon, label: "Notifications", href: "/notifications", showBadge: true },
  { icon: SendIcon, label: "Messages", href: "/messenger" },
  { icon: SettingsIcon, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { toggleTheme, theme, mounted } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate initials from profile
  const initials = user?.profile 
    ? `${user.profile.firstName[0] || ""}${user.profile.lastName[0] || ""}`.toUpperCase()
    : "U";

  const username = user?.profile?.username || "user";
  const profilePhoto = user?.profile?.fotoProfilUrl;
  const fullName = user?.profile 
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : "User";

  // Fetch unread count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get<{ count: number }>('/users/notifications/unread-count');
        setUnreadCount(response.count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll every 3 seconds for real-time feel
    const interval = setInterval(fetchUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Reset count when visiting notifications page
  useEffect(() => {
    if (pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 h-screen border-r border-border-soft flex flex-col py-6 lg:py-8 z-50 glass w-[70px] lg:w-[260px] transition-all duration-500 ease-in-out">
      {/* Logo */}
      <div className="px-4 lg:px-8 mb-10 flex justify-center lg:justify-start">
        <Logo className="h-8 w-8 text-accent animate-reveal" />
        <span className="hidden lg:block ml-3 text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
          Soplantila
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1.5">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.showBadge && unreadCount > 0;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                isActive
                  ? "bg-foreground text-background shadow-premium scale-[1.02]"
                  : "hover:bg-surface-dark text-muted hover:text-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className={`h-6 w-6 shrink-0 ${isActive ? "scale-110" : "group-hover:scale-110 transition-transform"}`} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`hidden lg:block font-bold text-[13px] uppercase tracking-[0.15em] ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Profile, Theme, Logout */}
      <div className="px-3 space-y-1.5 border-t border-border-soft pt-4">
        {/* Profile Section */}
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 group ${
            pathname === "/profile"
              ? "bg-accent/10 border border-accent/20"
              : "hover:bg-surface-dark"
          }`}
          aria-label={`Go to ${username}'s profile`}
        >
          {/* Profile Photo */}
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-border-soft group-hover:border-accent/30 transition-colors">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${username}'s profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                  <span className="text-sm font-bold text-accent">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
          </div>

          {/* Username & Name */}
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate">
              {fullName}
            </p>
            <p className="text-xs text-muted truncate">
              @{username}
            </p>
          </div>

          {/* Active indicator for mobile */}
          {pathname === "/profile" && (
            <div className="lg:hidden absolute -right-1 top-1/2 -translate-y-1/2 h-6 w-1 bg-accent rounded-l-full" />
          )}
        </Link>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-muted hover:text-foreground hover:bg-surface-dark transition-all group"
          aria-label={mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
        >
          <MoonIcon className="h-5 w-5 shrink-0 group-hover:rotate-12 transition-transform" />
          <span className="hidden lg:block font-medium text-xs uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
             {!mounted ? 'Theme' : (theme === 'dark' ? 'Light' : 'Dark')}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-2xl text-danger/60 hover:text-danger hover:bg-danger/5 transition-all group"
          aria-label="Logout"
        >
          <LogOutIcon className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" />
          <span className="hidden lg:block font-medium text-xs uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
