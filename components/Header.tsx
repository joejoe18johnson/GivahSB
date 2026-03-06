"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Heart, LogOut, Menu, X, Bell, Shield, User, FolderOpen, Settings, ChevronDown, Megaphone, Trophy, BookOpen, Trash2, CheckCheck, Baby } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useHearted } from "./HeartedCampaigns";
import UserAvatar from "./UserAvatar";
import ThemeSwitcher from "./ThemeSwitcher";

interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  campaignId?: string;
  read: boolean;
  createdAt: string;
}

function NotificationDropdownRow({
  notification: n,
  markAsRead,
  scrollContainerRef,
  isOpen,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onRemove,
}: {
  notification: UserNotification;
  markAsRead: (n: UserNotification) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const liRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!n.read && isOpen && scrollContainerRef.current && liRef.current) {
      const root = scrollContainerRef.current;
      const el = liRef.current;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) markAsRead(n);
        },
        { root, threshold: 0.1 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }
  }, [n.id, n.read, isOpen, markAsRead, n, scrollContainerRef]);
  return (
    <li ref={liRef} className="relative group">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`w-full text-left px-4 py-3 pr-10 hover:bg-gray-50 ${!n.read ? "bg-primary-50/50" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 min-w-0">{n.title}</p>
          {!n.read && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.body}</p>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
        aria-label="Remove notification"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heartedCount, setHeartedCount] = useState(0);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalNotificationCount, setTotalNotificationCount] = useState(0);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const notificationScrollContainerRef = useRef<HTMLDivElement>(null);
  const campaignsDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showCampaignsDropdown, setShowCampaignsDropdown] = useState(false);
  const [mobileCampaignsOpen, setMobileCampaignsOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = res.ok ? await res.json() : { notifications: [], unreadCount: 0, totalCount: 0 };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      setTotalNotificationCount(data.totalCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
      setTotalNotificationCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadNotifications();
    const interval = setInterval(() => user?.id && loadNotifications(), 60000);
    return () => clearInterval(interval);
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(target)) {
        setShowNotificationDropdown(false);
      }
      if (campaignsDropdownRef.current && !campaignsDropdownRef.current.contains(target)) {
        setShowCampaignsDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = useCallback(async (n: UserNotification) => {
    if (n.read) return;
    try {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH", credentials: "include" });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const hoverReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNotificationHover = useCallback(
    (n: UserNotification) => {
      if (hoverReadTimeoutRef.current) clearTimeout(hoverReadTimeoutRef.current);
      hoverReadTimeoutRef.current = setTimeout(() => markAsRead(n), 400);
    },
    [markAsRead]
  );
  const handleNotificationHoverEnd = useCallback(() => {
    if (hoverReadTimeoutRef.current) {
      clearTimeout(hoverReadTimeoutRef.current);
      hoverReadTimeoutRef.current = null;
    }
  }, []);


  const handleNotificationClick = async (n: UserNotification) => {
    if (!n.read) {
      try {
        await fetch(`/api/notifications/${n.id}`, { method: "PATCH", credentials: "include" });
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setShowNotificationDropdown(false);
    setMobileMenuOpen(false);
    if (n.campaignId && n.type === "donation") router.push(`/my-campaigns/${n.campaignId}/donations`);
    else if (n.campaignId && n.type === "payout_completed") router.push("/my-campaigns");
    else if (n.type === "goal_reached") router.push("/my-campaigns");
    else if (n.type === "verification_approved" || n.type === "verification_rejected") router.push("/verification-center");
    else if (n.campaignId) router.push(`/campaigns/${n.campaignId}`);
    else router.push("/my-campaigns");
  };

  const handleRemoveNotification = async (e: React.MouseEvent, n: UserNotification) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await fetch(`/api/notifications/${n.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((x) => x.id !== n.id));
        setTotalNotificationCount((c) => Math.max(0, c - 1));
        if (!n.read) setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    }
  };

  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setMarkingAllRead(true);
    try {
      await Promise.all(
        unread.map((n) => fetch(`/api/notifications/${n.id}`, { method: "PATCH", credentials: "include" }))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setMarkingAllRead(false);
    }
  };
  const handleClearAllNotifications = async () => {
    if (notifications.length === 0) return;
    setClearingAll(true);
    try {
      await Promise.all(
        notifications.map((n) => fetch(`/api/notifications/${n.id}`, { method: "DELETE", credentials: "include" }))
      );
      setNotifications([]);
      setUnreadCount(0);
      setTotalNotificationCount(0);
    } catch {
      // ignore
    } finally {
      setClearingAll(false);
    }
  };

  const { heartedIds } = useHearted();
  useEffect(() => {
    setHeartedCount(heartedIds.length);
  }, [heartedIds.length]);


  const handleLogout = async () => {
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    await logout();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/campaigns?q=${encodeURIComponent(query)}`);
      setMobileMenuOpen(false);
    } else {
      router.push("/campaigns");
    }
  };

  if (isAdminRoute) return null;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/givah-logo.png"
              alt="GivahBz"
              width={140}
              height={40}
              className="h-8 w-auto sm:h-10"
              priority
            />
          </Link>

          {/* Search Bar - desktop only */}
          <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-md mx-4 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Search campaigns"
              />
            </div>
          </form>

          {/* Desktop Navigation — no Admin link in public nav */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-200 dark:hover:text-primary-400 hover:text-primary-600 transition-colors duration-300 ease-in-out"
            >
              Home
            </Link>
            <div className="relative flex items-center" ref={campaignsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCampaignsDropdown((v) => !v)}
                aria-label="Toggle campaigns menu"
                className={`flex items-center gap-1 text-gray-700 dark:text-white hover:text-primary-600 dark:hover:text-primary-300 transition-colors duration-300 ease-in-out ${pathname?.startsWith("/campaigns") || pathname?.startsWith("/success-stories") || pathname?.startsWith("/how-it-works") ? "text-primary-600 dark:text-white font-medium" : ""}`}
              >
                Campaigns
                <ChevronDown className={`w-4 h-4 transition-transform ${showCampaignsDropdown ? "rotate-180" : ""}`} />
              </button>
              {showCampaignsDropdown && (
                <div className="absolute left-0 top-full mt-1 w-56 z-[100]">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 gradient-border-1 w-full overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Campaigns</h3>
                    </div>
                    <Link
                      href="/campaigns/little-warriors"
                      onClick={() => setShowCampaignsDropdown(false)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-white text-sm"
                    >
                      <Baby className="w-4 h-4 text-pink-500 shrink-0" />
                      Little Warriors
                    </Link>
                    <Link
                      href="/campaigns"
                      onClick={() => setShowCampaignsDropdown(false)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-white text-sm"
                    >
                      <Megaphone className="w-4 h-4 text-primary-600 shrink-0" />
                      View All Campaigns
                    </Link>
                    <Link
                      href="/success-stories"
                      onClick={() => setShowCampaignsDropdown(false)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-white text-sm"
                    >
                      <Trophy className="w-4 h-4 text-primary-600 shrink-0" />
                      Success Stories
                    </Link>
                    <Link
                      href="/how-it-works"
                      onClick={() => setShowCampaignsDropdown(false)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-white text-sm"
                    >
                      <BookOpen className="w-4 h-4 text-primary-600 shrink-0" />
                      How It Works
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/campaigns/create"
              className="gradient-border-1 rounded-full px-4 py-2 font-medium bg-white text-primary-600 hover:bg-primary-50 transition-colors duration-300 ease-in-out shadow-sm"
            >
              Create A Campaign
            </Link>
            {user ? (
              <>
                <div className="relative flex items-center" ref={notificationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotificationDropdown((v) => !v)}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-300 ease-in-out flex-shrink-0"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-primary-600 text-white text-xs font-medium">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotificationDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-80 z-[100]">
                      <div
                        ref={notificationScrollContainerRef}
                        className="max-h-[20rem] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 border border-gray-200 dark:border-gray-600 w-full"
                      >
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                          {notifications.length > 0 && (
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                type="button"
                                onClick={handleMarkAllRead}
                                disabled={markingAllRead || notifications.every((n) => n.read)}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                {markingAllRead ? "Marking…" : "Mark all read"}
                              </button>
                              <button
                                type="button"
                                onClick={handleClearAllNotifications}
                                disabled={clearingAll}
                                className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {clearingAll ? "Clearing…" : "Clear all"}
                              </button>
                            </div>
                          )}
                        </div>
                        {notifications.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</p>
                        ) : (
                          <ul className="py-2">
                            {notifications.map((n) => (
                              <NotificationDropdownRow
                                key={n.id}
                                notification={n}
                                markAsRead={markAsRead}
                                scrollContainerRef={notificationScrollContainerRef}
                                isOpen={showNotificationDropdown}
                                onClick={() => handleNotificationClick(n)}
                                onMouseEnter={() => handleNotificationHover(n)}
                                onMouseLeave={handleNotificationHoverEnd}
                                onRemove={(e) => handleRemoveNotification(e, n)}
                              />
                            ))}
                          </ul>
                        )}
                        <Link
                          href="/notifications"
                          onClick={() => setShowNotificationDropdown(false)}
                          className="block px-4 py-2 text-center text-sm text-primary-600 font-medium hover:bg-gray-50 border-t border-gray-100"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  href="/liked-campaigns"
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-300 ease-in-out flex-shrink-0"
                  aria-label="View liked campaigns"
                >
                  <Heart className="w-5 h-5" />
                  {heartedCount > 0 && (
                    <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {heartedCount > 9 ? "9+" : heartedCount}
                    </span>
                  )}
                </Link>
                <div className="relative flex items-center" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors relative"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      <UserAvatar profilePhoto={user.profilePhoto} name={user.name} email={user.email} size={32} className="w-full h-full" />
                    </div>
                    <span className="hidden md:inline">{user.name}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 z-[100]">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg gradient-border-1 py-2 w-full">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                          <UserAvatar profilePhoto={user.profilePhoto} name={user.name} email={user.email} size={40} className="w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/verification-center"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Verification Center
                      </Link>
                      <Link
                        href="/my-campaigns"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FolderOpen className="w-4 h-4" />
                        My Campaigns
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 flex items-center gap-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href={pathname && !pathname.startsWith("/auth") ? `/auth/login?callbackUrl=${encodeURIComponent(pathname)}` : "/auth/login"}
                  className="bg-gradient-to-r from-primary-500 to-verified-500 text-white px-4 py-2 rounded-full font-medium hover:opacity-90 transition-opacity duration-300 ease-in-out shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  href={pathname && !pathname.startsWith("/auth") ? `/auth/signup?callbackUrl=${encodeURIComponent(pathname)}` : "/auth/signup"}
                  className="gradient-border-1 rounded-full px-4 py-2 font-medium bg-white text-primary-600 hover:bg-primary-50 transition-colors duration-300 ease-in-out shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile: notifications, hearted campaigns, profile picture and menu button */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            {user && (
              <>
                <Link
                  href="/notifications"
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-300 ease-in-out flex-shrink-0"
                  aria-label="Notifications"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Bell className="w-5 h-5" />
                  {totalNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-primary-600 text-white text-xs font-medium">
                      {totalNotificationCount > 99 ? "99+" : totalNotificationCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/liked-campaigns"
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-300 ease-in-out flex-shrink-0"
                  aria-label="Liked campaigns"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="w-5 h-5" />
                  {heartedCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                      {heartedCount > 99 ? "99+" : heartedCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserAvatar profilePhoto={user.profilePhoto} name={user.name} email={user.email} size={40} className="w-full h-full" />
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors duration-300 ease-in-out flex-shrink-0"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Theme switcher - desktop only; on mobile it's inside the burger menu */}
          <div className="hidden lg:flex shrink-0 min-w-[44px] min-h-[44px] items-center justify-center">
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-white">Theme</span>
              <ThemeSwitcher />
            </div>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Search campaigns"
              />
            </form>
            <nav className="flex flex-col gap-1">
              <Link href="/" className="px-4 py-3 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>Home</Link>
              <div className="rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileCampaignsOpen((v) => !v)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between bg-gradient-to-r from-primary-600 to-verified-500 text-white font-medium rounded-lg shadow-sm hover:opacity-95 active:opacity-90 transition-opacity duration-200"
                >
                  Campaigns
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCampaignsOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileCampaignsOpen && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-b-lg mt-1 border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden">
                    <Link href="/campaigns/little-warriors" className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600" onClick={closeMobileMenu}>
                      <Baby className="w-4 h-4 text-pink-500 dark:text-pink-400 shrink-0" />
                      Little Warriors
                    </Link>
                    <Link href="/campaigns" className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600" onClick={closeMobileMenu}>
                      <Megaphone className="w-4 h-4 text-primary-600 dark:text-white shrink-0" />
                      View All Campaigns
                    </Link>
                    <Link href="/success-stories" className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600" onClick={closeMobileMenu}>
                      <Trophy className="w-4 h-4 text-primary-600 dark:text-white shrink-0" />
                      Success Stories
                    </Link>
                    <Link href="/how-it-works" className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50" onClick={closeMobileMenu}>
                      <BookOpen className="w-4 h-4 text-primary-600 dark:text-white shrink-0" />
                      How It Works
                    </Link>
                  </div>
                )}
              </div>
              <Link href="/campaigns/create" className="mx-4 flex justify-center items-center gradient-border-1 rounded-full px-4 py-3 font-medium bg-white dark:bg-gray-800 text-primary-600 dark:text-white hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>
                Create A Campaign
              </Link>
              {user ? (
                <>
                  <Link href="/liked-campaigns" className="px-4 py-3 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>
                    <Heart className="w-4 h-4" />
                    Liked Campaigns
                    {heartedCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {heartedCount > 9 ? "9+" : heartedCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/profile" className="px-4 py-3 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link href="/verification-center" className="px-4 py-3 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>
                    <Shield className="w-4 h-4" />
                    Verification Center
                  </Link>
                  <Link href="/my-campaigns" className="px-4 py-3 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>
                    <FolderOpen className="w-4 h-4" />
                    My Campaigns
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="px-4 py-3 rounded-lg text-primary-600 dark:text-white font-medium hover:bg-primary-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>
                      <Settings className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Link href="/notifications" className="px-4 py-3 rounded-lg text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-300 ease-in-out" onClick={closeMobileMenu}>
                    <Bell className="w-4 h-4" />
                    Notifications
                    {totalNotificationCount > 0 && (
                      <span className="ml-auto bg-primary-600 text-white text-xs font-medium rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                        {totalNotificationCount > 99 ? "99+" : totalNotificationCount}
                      </span>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-3 rounded-lg text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-300 ease-in-out">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <div className="mx-4 mt-2 space-y-2">
                  <Link
                    href={pathname && !pathname.startsWith("/auth") ? `/auth/login?callbackUrl=${encodeURIComponent(pathname)}` : "/auth/login"}
                    className="block text-center bg-gradient-to-r from-primary-500 to-verified-500 text-white rounded-full py-3 px-4 font-medium hover:opacity-90 transition-opacity duration-300 ease-in-out shadow-sm"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    href={pathname && !pathname.startsWith("/auth") ? `/auth/signup?callbackUrl=${encodeURIComponent(pathname)}` : "/auth/signup"}
                    className="block text-center gradient-border-1 rounded-full py-3 px-4 font-medium bg-white text-primary-600 hover:bg-primary-50 transition-colors duration-300 ease-in-out"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
