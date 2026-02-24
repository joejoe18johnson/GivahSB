"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Heart, LogOut, Menu, X, Bell } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useHearted } from "./HeartedCampaigns";

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

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heartedCount, setHeartedCount] = useState(0);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = res.ok ? await res.json() : { notifications: [], unreadCount: 0 };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadNotifications();
    const interval = setInterval(() => user?.id && loadNotifications(), 60000);
    return () => clearInterval(interval);
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target as Node)) {
        setShowNotificationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: UserNotification) => {
    if (!n.read) {
      try {
        await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setShowNotificationDropdown(false);
    setMobileMenuOpen(false);
    if (n.campaignId) router.push(`/campaigns/${n.campaignId}`);
    else router.push("/my-campaigns");
  };
  
  const { heartedIds } = useHearted();
  useEffect(() => {
    setHeartedCount(heartedIds.length);
  }, [heartedIds.length]);


  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
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
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
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
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/campaigns"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Campaigns
            </Link>
            <Link
              href="/success-stories"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              Success Stories
            </Link>
            {!isAdminRoute && (
              <Link
                href="/how-it-works"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                How It Works
              </Link>
            )}
            {user ? (
              <>
                {!isAdminRoute && (
                  <Link
                    href="/campaigns/create"
                    className="text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Start Fundraising
                  </Link>
                )}
                <div className="relative" ref={notificationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotificationDropdown((v) => !v)}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors flex-shrink-0"
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
                    <div className="absolute right-0 top-full mt-1 w-80 max-h-[20rem] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="font-medium text-gray-900">Notifications</h3>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet</p>
                      ) : (
                        <ul className="py-2">
                          {notifications.map((n) => (
                            <li key={n.id}>
                              <button
                                type="button"
                                onClick={() => handleNotificationClick(n)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${!n.read ? "bg-primary-50/50" : ""}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-gray-900 flex-1 min-w-0">{n.title}</p>
                                  {!n.read && (
                                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.body}</p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link
                        href="/my-campaigns"
                        onClick={() => setShowNotificationDropdown(false)}
                        className="block px-4 py-2 text-center text-sm text-primary-600 font-medium hover:bg-gray-50"
                      >
                        My Campaigns
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  href="/liked-campaigns"
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="View liked campaigns"
                >
                  <Heart className="w-5 h-5" />
                  {heartedCount > 0 && (
                    <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {heartedCount > 9 ? "9+" : heartedCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      {user.profilePhoto ? (
                        <Image 
                          src={user.profilePhoto} 
                          alt={user.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span>{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="hidden md:inline">{user.name}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                          {user.profilePhoto ? (
                            <Image 
                              src={user.profilePhoto} 
                              alt={user.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-sm">{user.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/my-campaigns"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Campaigns
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50"
                          onClick={() => setShowUserMenu(false)}
                        >
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
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-success-500 text-white px-4 py-2 rounded-full font-medium hover:bg-success-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button and profile picture */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            {user && (
              <Link
                href="/profile"
                className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                {user.profilePhoto ? (
                  <Image 
                    src={user.profilePhoto} 
                    alt={user.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-sm">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
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
              <Link href="/" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Home</Link>
              <Link href="/campaigns" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Campaigns</Link>
              <Link href="/success-stories" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Success Stories</Link>
              {!isAdminRoute && (
                <Link href="/how-it-works" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>How It Works</Link>
              )}
              {user ? (
                <>
                  {!isAdminRoute && (
                    <Link
                      href="/campaigns/create"
                      className="px-4 py-3 rounded-lg bg-success-500 text-white font-medium hover:bg-success-600 text-center"
                      onClick={closeMobileMenu}
                    >
                      Create Campaign
                    </Link>
                  )}
                  <Link href="/liked-campaigns" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-2" onClick={closeMobileMenu}>
                    <Heart className="w-4 h-4" />
                    Liked Campaigns
                    {heartedCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {heartedCount > 9 ? "9+" : heartedCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/profile" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>My Profile</Link>
                  <Link href="/my-campaigns" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>My Campaigns</Link>
                  {isAdmin && (
                    <Link href="/admin" className="px-4 py-3 rounded-lg text-primary-600 font-medium hover:bg-primary-50" onClick={closeMobileMenu}>Admin</Link>
                  )}
                  <Link href="/notifications" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-2" onClick={closeMobileMenu}>
                    <Bell className="w-4 h-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-primary-600 text-white text-xs font-medium rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>Sign In</Link>
                  <Link href="/auth/signup" className="mx-4 mt-2 block text-center bg-success-500 text-white py-3 rounded-full font-medium" onClick={closeMobileMenu}>Sign Up</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
