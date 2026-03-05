"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, CheckCircle2, Trash2, CheckCheck } from "lucide-react";

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

const NOTIFICATIONS_PAGE_LIMIT = 200;

function NotificationListItem({
  notification: n,
  onMarkAsRead,
  onHover,
  onHoverEnd,
  onClick,
  onRemove,
  formatDate,
}: {
  notification: UserNotification;
  onMarkAsRead: (n: UserNotification) => void;
  onHover: (n: UserNotification) => void;
  onHoverEnd: () => void;
  onClick: (n: UserNotification) => void;
  onRemove: (e: React.MouseEvent, n: UserNotification) => void;
  formatDate: (iso: string) => string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (n.read) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onMarkAsRead(n);
      },
      { threshold: 0.1, rootMargin: "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [n.id, n.read, onMarkAsRead, n]);

  return (
    <li ref={ref} className="relative">
      <button
        type="button"
        onClick={() => onClick(n)}
        onMouseEnter={() => onHover(n)}
        onMouseLeave={onHoverEnd}
        className={`w-full text-left bg-white rounded-xl border border-gray-200 p-4 pr-12 transition-colors hover:bg-primary-50/30 hover:border-primary-200 ${!n.read ? "border-primary-200 bg-primary-50/20" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success-100 flex items-center justify-center text-success-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
            <p className="text-xs text-gray-400 mt-2">{formatDate(n.createdAt)}</p>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => onRemove(e, n)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        aria-label="Remove notification"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const hoverReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/notifications");
      return;
    }
    if (!user?.id) return;
    let cancelled = false;
    fetch(`/api/notifications?limit=${NOTIFICATIONS_PAGE_LIMIT}`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : { notifications: [] })
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications ?? []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, isLoading, router]);

  const markAsRead = useCallback(async (n: UserNotification) => {
    if (n.read) return;
    try {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH", credentials: "include" });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    } catch {
      // ignore
    }
  }, []);

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

  const handleClick = async (n: UserNotification) => {
    if (!n.read) {
      try {
        await fetch(`/api/notifications/${n.id}`, { method: "PATCH", credentials: "include" });
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
      } catch {
        // ignore
      }
    }
    if (n.campaignId && n.type === "donation") router.push(`/my-campaigns/${n.campaignId}/donations`);
    else if (n.campaignId && n.type === "payout_completed") router.push("/my-campaigns");
    else if (n.type === "goal_reached") router.push("/my-campaigns");
    else if (n.type === "verification_approved" || n.type === "verification_rejected") router.push("/verification-center");
    else if (n.campaignId) router.push(`/campaigns/${n.campaignId}`);
    else router.push("/my-campaigns");
  };

  const handleRemove = async (e: React.MouseEvent, n: UserNotification) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await fetch(`/api/notifications/${n.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setNotifications((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      // ignore
    }
  };

  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAllRead(true);
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => fetch(`/api/notifications/${n.id}`, { method: "PATCH", credentials: "include" }))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAllRead(false);
    }
  };
  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    setClearingAll(true);
    try {
      await Promise.all(
        notifications.map((n) => fetch(`/api/notifications/${n.id}`, { method: "DELETE", credentials: "include" }))
      );
      setNotifications([]);
    } catch {
      // ignore
    } finally {
      setClearingAll(false);
    }
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h1>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markingAllRead || unreadCount === 0}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCheck className="w-4 h-4" />
                    {markingAllRead ? "Marking…" : "Mark all read"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={clearingAll}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {clearingAll ? "Clearing…" : "Clear all"}
                  </button>
                </>
              )}
              <Link href="/my-campaigns" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                My Campaigns
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-6">Your notification history. Newest first.</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl gradient-border-1 p-12 text-center">
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
                <NotificationListItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                  onHover={handleNotificationHover}
                  onHoverEnd={handleNotificationHoverEnd}
                  onClick={handleClick}
                  onRemove={handleRemove}
                  formatDate={formatDate}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
