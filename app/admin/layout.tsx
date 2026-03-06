"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LayoutDashboard, Megaphone, Users, Heart, ArrowLeft, Clock, Bell, LogOut, Trophy, Mail, Banknote, Baby } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import UserAvatar from "@/components/UserAvatar";
import {
  getCampaignsUnderReviewCached,
  getCampaignsCached,
  getUsersCached,
  getDonationsCached,
} from "@/lib/supabase/adminCache";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isLoading, adminCheckDone, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [sectionCounts, setSectionCounts] = useState({
    campaigns: 0,
    littleWarriors: 0,
    users: 0,
    donations: 0,
    underReview: 0,
    phonePending: 0,
    pendingDonations: 0,
    addressPending: 0,
    idPending: 0,
    pendingPayouts: 0,
  });
  // Notification total = actual items needing action; goes to 0 when all dealt with
  const notificationTotal =
    sectionCounts.underReview +
    sectionCounts.phonePending +
    sectionCounts.pendingDonations +
    sectionCounts.addressPending +
    sectionCounts.idPending +
    sectionCounts.pendingPayouts;
  // Order action items by count descending (most needing action first)
  const actionItemsSorted = [
    { key: "underReview", label: "Campaigns under review", count: sectionCounts.underReview, href: "/admin/under-review" },
    { key: "pendingDonations", label: "Pending donations to approve", count: sectionCounts.pendingDonations, href: "/admin/donations" },
    { key: "pendingPayouts", label: "Payout requests", count: sectionCounts.pendingPayouts, href: "/admin/payouts" },
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
        const [underReviewList, campaigns, users, donations] = await Promise.all([
          getCampaignsUnderReviewCached(),
          getCampaignsCached(),
          getUsersCached(),
          getDonationsCached(),
        ]);
        const since = sevenDaysAgo();
        const underReviewCount = underReviewList.length;
        const littleWarriors = underReviewList.filter((c) => c.isLittleWarriors).length;
        const phonePending = users.filter((u) => u.phoneNumber && !u.phoneVerified).length;
        const addressPending = users.filter((u) => u.addressDocument && !u.addressVerified).length;
        const idPending = users.filter((u) => u.idDocument && u.idPending).length;
        const pendingDonations = donations.filter((d) => d.status === "pending").length;
        let pendingPayouts = 0;
        try {
          const payoutsRes = await fetch("/api/admin/payouts", { credentials: "include" });
          if (payoutsRes.ok) {
            const payouts: { status: string }[] = await payoutsRes.json();
            pendingPayouts = payouts.filter((p) => p.status === "pending").length;
          }
        } catch {
          // ignore
        }
        setSectionCounts({
          underReview: underReviewCount,
          littleWarriors,
          campaigns: campaigns.filter((c) => new Date(c.createdAt).getTime() >= since).length,
          users: users.filter((u) => u.createdAt && new Date(u.createdAt).getTime() >= since).length,
          donations: donations.filter((d) => new Date(d.createdAt).getTime() >= since).length,
          phonePending,
          pendingDonations,
          addressPending,
          idPending,
          pendingPayouts,
        });
      } catch {
        setSectionCounts({
          campaigns: 0,
          littleWarriors: 0,
          users: 0,
          donations: 0,
          underReview: 0,
          phonePending: 0,
          pendingDonations: 0,
          addressPending: 0,
          idPending: 0,
          pendingPayouts: 0,
        });
      }
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // middleware or auth will redirect to login
  }

  // Wait for server admin check so we don't redirect admins away before isAdmin is set
  if (!adminCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Checking access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Access denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
      <aside className="w-full md:w-56 md:fixed md:left-0 md:top-0 md:bottom-0 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 shadow-sm z-40 overflow-y-auto flex flex-col">
        <nav className="p-4 space-y-1 flex-1 pb-24">
          <div className="flex flex-col items-center gap-3 py-4 border-b border-gray-100 dark:border-gray-700">
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
            <Link
              href="/admin/notifications"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/notifications"
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : notificationTotal > 0
                    ? "bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Bell className={`w-4 h-4 shrink-0 ${notificationTotal > 0 ? "text-red-600" : ""}`} />
              <span className="flex-1">Notifications</span>
              {notificationTotal > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {notificationTotal > 99 ? "99+" : notificationTotal}
                </span>
              )}
            </Link>
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin"
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : notificationTotal > 0
                    ? "bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              href="/admin/messages"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/messages" ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              <Mail className="w-4 h-4" />
              <span className="flex-1">Messages</span>
            </Link>
            <Link
              href="/admin/campaigns"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/campaigns"
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : sectionCounts.campaigns > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              href="/admin/little-warriors"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/little-warriors"
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : sectionCounts.littleWarriors > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Baby className="w-4 h-4" />
              <span className="flex-1">Little Warriors</span>
              {sectionCounts.littleWarriors > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {sectionCounts.littleWarriors > 99 ? "99+" : sectionCounts.littleWarriors}
                </span>
              )}
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/users"
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : (sectionCounts.phonePending + sectionCounts.addressPending + sectionCounts.idPending) > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : sectionCounts.pendingDonations > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              href="/admin/payouts"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/payouts"
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : sectionCounts.pendingPayouts > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span className="flex-1">Payouts</span>
              {sectionCounts.pendingPayouts > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {sectionCounts.pendingPayouts > 99 ? "99+" : sectionCounts.pendingPayouts}
                </span>
              )}
            </Link>
            <Link
              href="/admin/under-review"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                pathname === "/admin/under-review"
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium"
                  : sectionCounts.underReview > 0
                    ? "bg-amber-50/80 border border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${pathname === "/admin/completed-campaigns" ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              <Trophy className="w-4 h-4" />
              <span className="flex-1">Completed campaigns</span>
            </Link>
          </div>
          
          {/* Profile Section at Bottom */}
          <div className="p-4 pt-[60px] md:pt-[60px] border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 md:absolute md:bottom-0 md:left-0 md:right-0">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium flex-shrink-0">
                    <UserAvatar profilePhoto={user.profilePhoto} name={user.name} email={user.email} size={40} className="w-full h-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      <main className="min-h-screen pt-4 md:pt-6 md:pl-56 min-w-0 flex-1 flex flex-col">
        <div className="flex justify-end items-center pr-4 md:pr-6 lg:pr-8 pt-2 pb-1 shrink-0 min-h-[44px]">
          <ThemeSwitcher />
        </div>
        <div className="p-4 md:p-6 lg:p-8 min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
