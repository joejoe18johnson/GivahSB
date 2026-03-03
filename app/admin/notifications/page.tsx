"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Megaphone, Users, Heart, Banknote, Clock } from "lucide-react";
import {
  getCampaignsUnderReviewCached,
  getUsersCached,
  getDonationsCached,
} from "@/lib/supabase/adminCache";

const actionItemConfig = [
  { key: "underReview", label: "Campaigns under review", href: "/admin/under-review", icon: Clock },
  { key: "pendingDonations", label: "Pending donations to approve", href: "/admin/donations", icon: Heart },
  { key: "pendingPayouts", label: "Payout requests", href: "/admin/payouts", icon: Banknote },
  { key: "phonePending", label: "Phone numbers to review", href: "/admin/users", icon: Users },
  { key: "addressPending", label: "Address documents to review", href: "/admin/users", icon: Users },
  { key: "idPending", label: "Identity documents to review", href: "/admin/users", icon: Users },
];

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    underReview: 0,
    pendingDonations: 0,
    pendingPayouts: 0,
    phonePending: 0,
    addressPending: 0,
    idPending: 0,
  });
  const [underReviewList, setUnderReviewList] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [underReview, users, donations, payoutsRes] = await Promise.all([
          getCampaignsUnderReviewCached(),
          getUsersCached(),
          getDonationsCached(),
          fetch("/api/admin/payouts", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
        ]);
        if (cancelled) return;
        const payouts = Array.isArray(payoutsRes) ? payoutsRes : [];
        const phonePending = users.filter((u) => u.phoneNumber && !u.phoneVerified).length;
        const addressPending = users.filter((u) => u.addressDocument && !u.addressVerified).length;
        const idPending = users.filter((u) => u.idDocument && u.idPending).length;
        const pendingDonations = donations.filter((d) => d.status === "pending").length;
        const pendingPayouts = payouts.filter((p: { status?: string }) => p.status === "pending").length;
        setCounts({
          underReview: underReview.length,
          pendingDonations,
          pendingPayouts,
          phonePending,
          addressPending,
          idPending,
        });
        const sorted = [...underReview].sort(
          (a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
        );
        setUnderReviewList(sorted.map((n) => ({ id: n.id, title: n.title })));
      } catch {
        if (!cancelled) setCounts({ underReview: 0, pendingDonations: 0, pendingPayouts: 0, phonePending: 0, addressPending: 0, idPending: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const itemsWithCount = actionItemConfig.map((item) => ({
    ...item,
    count: counts[item.key as keyof typeof counts] ?? 0,
  })).filter((item) => item.count > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Loading notifications…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <Bell className="w-7 h-7 text-primary-600" />
        Notifications
      </h1>
      <p className="text-gray-600 mb-8">
        Items that need your attention.
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Action items</h2>
        {itemsWithCount.length === 0 ? (
          <p className="text-gray-500 py-4">No items needing action.</p>
        ) : (
          <ul className="space-y-2">
            {itemsWithCount.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <span className="flex items-center gap-3 text-amber-900 font-medium">
                      <Icon className="w-5 h-5 text-amber-600 shrink-0" />
                      {item.label}
                    </span>
                    <span className="rounded-full bg-red-500 text-white text-sm font-medium min-w-[1.75rem] h-7 px-2 flex items-center justify-center">
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/campaigns" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
            <Megaphone className="w-4 h-4" />
            Campaigns
          </Link>
          <Link href="/admin/users" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
            <Users className="w-4 h-4" />
            Users
          </Link>
          <Link href="/admin/donations" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
            <Heart className="w-4 h-4" />
            Donations
          </Link>
          <Link href="/admin/payouts" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
            <Banknote className="w-4 h-4" />
            Payouts
          </Link>
        </div>
      </section>

      {underReviewList.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Campaigns awaiting review</h2>
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden bg-white">
            {underReviewList.map((n) => (
              <li key={n.id}>
                <Link
                  href="/admin/under-review"
                  className="block px-4 py-3 hover:bg-gray-50 text-gray-900 font-medium"
                >
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
