"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/lib/data";
import { AdminDonation } from "@/lib/adminData";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import { getDonationsCached, getCampaignsUnderReviewCountCached, getUsersCached, invalidateUsersCache } from "@/lib/supabase/adminCache";
import type { AdminUserDoc, UserStatus } from "@/lib/supabase/database";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Megaphone, Users, Heart, DollarSign, ArrowRight, Clock, Phone, PauseCircle, PlayCircle, Trash2, UserX, UserCheck, MapPin, FileText, ExternalLink } from "lucide-react";

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const { confirm, alert } = useThemedModal();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [users, setUsers] = useState<AdminUserDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [underReviewCount, setUnderReviewCount] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [fetchedCampaigns, fetchedDonations, count, userList] = await Promise.all([
        fetchCampaignsFromAPI(),
        getDonationsCached(),
        getCampaignsUnderReviewCountCached(),
        getUsersCached(),
      ]);
      // Sort all dashboard data by date (newest first)
      const campaignsNewestFirst = [...fetchedCampaigns].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      const donationsNewestFirst = [...fetchedDonations].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      const usersNewestFirst = [...userList].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setCampaigns(campaignsNewestFirst);
      setDonations(donationsNewestFirst);
      setUnderReviewCount(count);
      setUsers(usersNewestFirst);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetStatus = async (userId: string, status: UserStatus) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own status.", { variant: "error" });
      return;
    }
    setUpdatingUserId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }), credentials: "include" });
      invalidateUsersCache();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status.", { variant: "error" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handlePutOnHold = async (userId: string, name: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot put yourself on hold.", { variant: "error" });
      return;
    }
    const ok = await confirm(
      `Put "${name}" on hold? They will not be able to create or edit campaigns until you remove hold.`,
      { title: "Put user on hold", confirmLabel: "Put on hold", variant: "warning" }
    );
    if (ok) await handleSetStatus(userId, "on_hold");
  };

  const handleRemoveHold = async (userId: string) => {
    await handleSetStatus(userId, "active");
  };

  const handleDisableUser = async (userId: string, name: string, email: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot disable your own account.", { variant: "error" });
      return;
    }
    const ok = await confirm(
      `Disable user "${name}" (${email})? They will not be able to create or edit campaigns. You can reinstate them later.`,
      { title: "Disable User", confirmLabel: "Disable", variant: "warning" }
    );
    if (ok) {
      await handleSetStatus(userId, "deleted");
    }
  };

  const handleReinstateUser = async (userId: string, name: string) => {
    const ok = await confirm(
      `Reinstate user "${name}"? They will be able to create and edit campaigns again.`,
      { title: "Reinstate User", confirmLabel: "Reinstate", variant: "success" }
    );
    if (ok) {
      await handleSetStatus(userId, "active");
    }
  };

  const handleDeleteUserPermanently = async (userId: string, name: string, email: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account.", { variant: "error" });
      return;
    }
    const ok = await confirm(
      `Permanently delete user "${name}" (${email})? This will completely remove them from the system and cannot be undone. This action is irreversible.`,
      { title: "Permanently Delete User", confirmLabel: "Delete Permanently", variant: "danger" }
    );
    if (ok) {
      setUpdatingUserId(userId);
      try {
        await fetch(`/api/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
        invalidateUsersCache();
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        alert(`User "${name}" has been permanently deleted from the system.`, { variant: "success" });
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again.", { variant: "error" });
      } finally {
        setUpdatingUserId(null);
      }
    }
  };

  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalDonations = donations.filter((d) => d.status === "completed").reduce((sum, d) => sum + d.amount, 0);

  const byNewest = <T,>(arr: T[], getDate: (x: T) => string | undefined) =>
    [...arr].sort((a, b) => new Date(getDate(b) ?? 0).getTime() - new Date(getDate(a) ?? 0).getTime());

  const recentCampaigns = byNewest(campaigns, (c) => c.createdAt).slice(0, 5);
  const recentUsers = byNewest(users, (u) => u.createdAt).slice(0, 5);
  const recentDonations = byNewest(donations, (d) => d.createdAt).slice(0, 8);

  const phonePendingCount = users.filter((u) => u.phoneNumber && !u.phoneVerified).length;
  const addressPendingCount = users.filter((u) => u.addressDocument && !u.addressVerified).length;
  const idPendingCount = users.filter((u) => u.idDocument && u.idPending).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of all platform data</p>
      </div>

      {/* Stats - 4 cards in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Campaigns</p>
              <p className="text-xl font-semibold text-gray-900">{campaigns.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-verified-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-verified-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Raised</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalRaised)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Users</p>
              <p className="text-xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Donations</p>
              <p className="text-xl font-semibold text-gray-900">{donations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links - 4 cards in one row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/under-review"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm block hover:border-primary-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Under review</p>
              <p className="text-xl font-semibold text-gray-900">{underReviewCount}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm block hover:border-primary-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone numbers to review</p>
              <p className="text-xl font-semibold text-gray-900">{phonePendingCount}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm block hover:border-primary-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Address documents to review</p>
              <p className="text-xl font-semibold text-gray-900">{addressPendingCount}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm block hover:border-primary-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Identity documents to review</p>
              <p className="text-xl font-semibold text-gray-900">{idPendingCount}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
            <Link href="/admin/campaigns" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Creator</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 max-w-[180px] truncate">{c.title}</td>
                    <td className="px-5 py-3 text-gray-600">{c.creator}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(c.raised)}</td>
                    <td className="px-5 py-3">
                      <span className={c.verified ? "text-verified-600" : "text-amber-600"}>{c.verified ? "Verified" : "Pending"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Phone approved</th>
                  <th className="px-5 py-3 font-medium">Docs</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-900">{u.name}</td>
                      <td className="px-5 py-3 text-gray-600 truncate max-w-[160px]">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={
                          u.status === "active" ? "text-verified-600" :
                          u.status === "on_hold" ? "text-amber-600" : "text-red-600"
                        }>
                          {u.status === "active" ? "Active" : u.status === "on_hold" ? "On hold" : "Deleted"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{u.phoneNumber || "—"}</td>
                      <td className="px-5 py-3">
                        {u.phoneVerified ? (
                          <span className="text-verified-600">Yes</span>
                        ) : u.phoneNumber ? (
                          <span className="text-amber-600">Review</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.idDocument ? (
                            <a
                              href={u.idDocument}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs"
                              title="View ID document"
                            >
                              <FileText className="w-3 h-3" /> ID
                            </a>
                          ) : null}
                          {u.addressDocument ? (
                            <a
                              href={u.addressDocument}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs"
                              title="View address document"
                            >
                              <FileText className="w-3 h-3" /> Addr
                            </a>
                          ) : null}
                          {!u.idDocument && !u.addressDocument && <span className="text-gray-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {u.status === "active" && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handlePutOnHold(u.id, u.name)}
                              disabled={updatingUserId === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                            >
                              <PauseCircle className="w-3 h-3" />
                              Hold
                            </button>
                          )}
                          {u.status === "on_hold" && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleRemoveHold(u.id)}
                              disabled={updatingUserId === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                            >
                              <PlayCircle className="w-3 h-3" />
                              Remove hold
                            </button>
                          )}
                          {u.status === "deleted" && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleReinstateUser(u.id, u.name)}
                              disabled={updatingUserId === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                            >
                              <UserCheck className="w-3 h-3" />
                              Reinstate
                            </button>
                          )}
                          {u.status !== "deleted" && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDisableUser(u.id, u.name, u.email)}
                              disabled={updatingUserId === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                            >
                              <UserX className="w-3 h-3" />
                              Disable
                            </button>
                          )}
                          {u.status !== "deleted" && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUserPermanently(u.id, u.name, u.email)}
                              disabled={updatingUserId === u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs font-medium disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Donations</h2>
          <Link href="/admin/donations" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Ref</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Donor</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((d) => (
                <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    {d.referenceNumber ? (
                      <Link href={`/campaigns/${d.campaignId}`} className="font-mono font-medium text-primary-600 hover:underline">
                        {d.referenceNumber}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-gray-900 max-w-[200px] truncate">{d.campaignTitle}</td>
                  <td className="px-5 py-3 text-gray-600">{d.anonymous ? "Anonymous" : d.donorName}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(d.amount)}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{d.method === "ekyash" ? "E-Kyash" : d.method.replace("-", " ")}</td>
                  <td className="px-5 py-3">
                    <span className={d.status === "completed" ? "text-verified-600" : d.status === "pending" ? "text-amber-600" : "text-red-600"}>{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
