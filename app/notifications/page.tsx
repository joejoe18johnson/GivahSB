"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
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
import { Bell, CheckCircle2 } from "lucide-react";

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/notifications");
      return;
    }
    if (!user?.id) return;
    let cancelled = false;
    fetch("/api/notifications", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { notifications: [] })
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications ?? []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, isLoading, router]);

  const handleClick = async (n: UserNotification) => {
    if (!n.read) {
      try {
        await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH", credentials: "include" });
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        // ignore
      }
    }
    if (n.campaignId) router.push(`/campaigns/${n.campaignId}`);
    else router.push("/my-campaigns");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
            <Link href="/my-campaigns" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              My Campaigns
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No notifications yet</p>
              <p className="text-gray-500 text-sm mt-1">When your campaign is approved or you get updates, they’ll show here.</p>
              <Link
                href="/my-campaigns"
                className="inline-block mt-4 text-primary-600 font-medium hover:text-primary-700"
              >
                View my campaigns
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full text-left bg-white rounded-xl border p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/30 ${!n.read ? "border-primary-200 bg-primary-50/30" : "border-gray-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success-100 flex items-center justify-center text-success-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{n.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
