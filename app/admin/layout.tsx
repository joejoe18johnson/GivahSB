"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { LayoutDashboard, Megaphone, Users, Heart, ArrowLeft, Clock, Bell, LogOut, Trophy, FileText } from "lucide-react";
import Image from "next/image";
import {
  getCampaignsUnderReviewCountCached,
  getCampaignsUnderReviewCached,
  getCampaignsCached,
  getUsersCached,
  getDonationsCached,
} from "@/lib/supabase/adminCache";
import type { CampaignUnderReviewDoc } from "@/lib/supabase/database";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading, adminCheckDone, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<CampaignUnderReviewDoc[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [sectionCounts, setSectionCounts] = useState({
    campaigns: 0,
    users: 0,
    donations: 0,
    underReview: 0,
    phonePending: 0,
    pendingDonations: 0,
    addressPending: 0,
    idPending: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification total = actual items needing action; goes to 0 when all dealt with
  const notificationTotal =
    sectionCounts.underReview +
    sectionCounts.phonePending +
    sectionCounts.pendingDonations +
    sectionCounts.addressPending +
    sectionCounts.idPending;
  // Order action items by count descending (most needing action first)
  const actionItemsSorted = [
    { key: "underReview", label: "Campaigns under review", count: sectionCounts.underReview, href: "/admin/under-review" },
    { key: "pendingDonations", label: "Pending donations to approve", count: sectionCounts.pendingDonations, href: "/admin/donations" },
    { key: "phonePending", label: "Phone numbers to review", count: sectionCounts.phonePending, href: "/admin/users" },
    { key: "addressPending", label: "Address documents to review", count: sectionCounts.addressPending, href: "/admin/users" },
    { key: "idPending", label: "Identity documents to review", count: sectionCounts.idPending, href: "/admin/users" },
  ].sort((a, b) => b.count - a.count);

  const sevenDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.getTime();
  };

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      try {
        const [underReviewCount, list, campaigns, users, donations] = await Promise.all([
          getCampaignsUnderReviewCountCached(),
          getCampaignsUnderReviewCached(),
          getCampaignsCached(),
          getUsersCached(),
          getDonationsCached(),
        ]);
        const underReviewNewestFirst = [...list].sort(
          (a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
        );
        setNotifications(underReviewNewestFirst.slice(0, 10));
        const since = sevenDaysAgo();
        const phonePending = users.filter((u) => u.phoneNumber && !u.phoneVerified).length;
        const addressPending = users.filter((u) => u.addressDocument && !u.addressVerified).length;
        const idPending = users.filter((u) => u.idDocument && u.idPending).length;
        const pendingDonations = donations.filter((d) => d.status === "pending").length;
        setSectionCounts({
          underReview: underReviewCount,
          campaigns: campaigns.filter((c) => new Date(c.createdAt).getTime() >= since).length,
          users: users.filter((u) => u.createdAt && new Date(u.createdAt).getTime() >= since).length,
          donations: donations.filter((d) => new Date(d.createdAt).getTime() >= since).length,
          phonePending,
          pendingDonations,
          addressPending,
          idPending,
        });
      } catch {
        setNotifications([]);
        setSectionCounts({
          campaigns: 0,
          users: 0,
          donations: 0,
          underReview: 0,
          phonePending: 0,
          pendingDonations: 0,
          addressPending: 0,
          idPending: 0,
        });
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotificationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (!adminCheckDone) return; // wait for server admin check before redirecting
    if (!isAdmin) {
      router.replace("/");
      return;
    }
  }, [user, isAdmin, isLoading, adminCheckDone, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // middleware or auth will redirect to login
  }

  // Wait for server admin check so we don't redirect admins away before isAdmin is set
  if (!adminCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Checking access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access denied</h1>
          <p className="text-gray-600 mb-4">
            Your account does not have admin access. You must set <code className="text-sm bg-gray-100 px-1 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code> (comma-separated) in your <code className="text-sm bg-gray-100 px-1 rounded">.env</code> and in Vercel Environment Variables, then <strong>redeploy</strong> so the client gets the list. After that, sign out and sign in again.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Signed in as <strong>{user.email}</strong>. Add this exact email to <code className="text-sm bg-gray-100 px-1 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code> (e.g. <code className="text-sm bg-gray-100 px-1 rounded">NEXT_PUBLIC_ADMIN_EMAILS=you@example.com</code>). Note: <code className="text-sm bg-gray-100 px-1 rounded">ADMIN_EMAILS</code> alone does not work for the dashboard—the browser needs <code className="text-sm bg-gray-100 px-1 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code>.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 shadow-sm z-40 overflow-y-auto flex flex-col">
        <nav className="p-4 space-y-1 flex-1 pb-24">
          <div className="flex flex-col items-center gap-3 py-4 border-b border-gray-100">
            <Image src="/givah-logo.png" alt="GivahBz" width={120} height={36} className="h-8 w-auto" priority />
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full text-center inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white font-medium text-sm hover:bg-accent-700 transition-colors shadow-sm"
            >
              Back to site
            </button>
          </div>
          <div className="pt-4">
            {/* Notification bell - next to sidebar sections */}
            <div className="relative mb-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotificationDropdown((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left transition-colors ${
                  notificationTotal > 0
                    ? "bg-red-50 border border-red-200 text-red-800 hover:bg-red-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label="Notifications"
              >
                <Bell className={`w-4 h-4 shrink-0 ${notificationTotal > 0 ? "text-red-600" : ""}`} />
                <span className="flex-1 font-medium">Notifications</span>
                {notificationTotal > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium animate-pulse">
                    {notificationTotal > 99 ? "99+" : notificationTotal}
                  </span>
                )}
              </button>
              {showNotificationDropdown && (
                <div className="absolute left-0 top-full mt-1 w-72 max-h-[20rem] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">Items that need your attention</p>
                  </div>
                  <div className="py-2 px-2 space-y-1">
                    {actionItemsSorted
                      .filter((item) => item.count > 0)
                      .map((item) => (
                        <Link
                          key={item.key}
                          href={item.href}
                          onClick={() => setShowNotificationDropdown(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <span className="text-sm text-amber-900 font-medium">{item.label}</span>
                          <span className="rounded-full bg-red-500 text-white text-xs font-medium min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                            {item.count > 99 ? "99+" : item.count}
                          </span>
                        </Link>
                      ))}
                    {actionItemsSorted.every((item) => item.count === 0) && (
                      <p className="px-3 py-4 text-sm text-gray-500 text-center">No items needing action</p>
                    )}
                    <div className="border-t border-gray-100 pt-2 mt-1">
                      <p className="px-3 py-1 text-xs text-gray-500">Quick links</p>
                      <Link href="/admin/campaigns" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                        Campaigns
                      </Link>
                      <Link href="/admin/users" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                        Users
                      </Link>
                      <Link href="/admin/donations" onClick={() => setShowNotificationDropdown(false)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                        Donations
                      </Link>
                    </div>
                  </div>
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                      <p className="px-4 text-xs text-gray-500 mb-2">Campaigns awaiting review</p>
                      <ul className="max-h-40 overflow-y-auto">
                        {notifications.slice(0, 5).map((n) => (
                          <li key={n.id}>
                            <Link href="/admin/under-review" onClick={() => setShowNotificationDropdown(false)} className="block px-4 py-2 hover:bg-gray-50 text-left text-sm text-gray-900 truncate">
                              {n.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : notificationTotal > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="flex-1">Dashboard</span>
              {notificationTotal > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {notificationTotal > 99 ? "99+" : notificationTotal}
                </span>
              )}
            </Link>
            <Link
              href="/admin/site-info"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/site-info" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <FileText className="w-4 h-4" />
              <span className="flex-1">Edit site info</span>
            </Link>
            <Link
              href="/admin/campaigns"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/campaigns"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : sectionCounts.campaigns > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span className="flex-1">Campaigns</span>
              {sectionCounts.campaigns > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {sectionCounts.campaigns > 99 ? "99+" : sectionCounts.campaigns}
                </span>
              )}
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/users"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : (sectionCounts.phonePending + sectionCounts.addressPending + sectionCounts.idPending) > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="flex-1">Users</span>
              {(sectionCounts.phonePending + sectionCounts.addressPending + sectionCounts.idPending) > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {(sectionCounts.phonePending + sectionCounts.addressPending + sectionCounts.idPending) > 99 ? "99+" : sectionCounts.phonePending + sectionCounts.addressPending + sectionCounts.idPending}
                </span>
              )}
            </Link>
            <Link
              href="/admin/donations"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/donations"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : sectionCounts.pendingDonations > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span className="flex-1">Donations</span>
              {sectionCounts.pendingDonations > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {sectionCounts.pendingDonations > 99 ? "99+" : sectionCounts.pendingDonations}
                </span>
              )}
            </Link>
            <Link
              href="/admin/under-review"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/under-review"
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : sectionCounts.underReview > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="flex-1">Under review</span>
              {sectionCounts.underReview > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {sectionCounts.underReview > 99 ? "99+" : sectionCounts.underReview}
                </span>
              )}
            </Link>
            <Link
              href="/admin/completed-campaigns"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/completed-campaigns" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Trophy className="w-4 h-4" />
              <span className="flex-1">Completed campaigns</span>
            </Link>
          </div>
          
          {/* Profile Section at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
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
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      <main className="pl-56 pt-6 min-h-screen">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
