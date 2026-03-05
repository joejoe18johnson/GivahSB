"use client";

import { useState, useEffect, useMemo } from "react";
import { getUsersCached, invalidateUsersCache } from "@/lib/supabase/adminCache";
import type { AdminUserDoc, UserStatus } from "@/lib/supabase/database";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";
import { CheckCircle2, XCircle, Phone, PauseCircle, PlayCircle, Trash2, Shield, AlertTriangle, UserX, UserCheck, FileText, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;
type SortKey = "name" | "email" | "role" | "status" | "created";
type SortDirection = "asc" | "desc";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { confirm, alert } = useThemedModal();
  const [users, setUsers] = useState<AdminUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [rejectModal, setRejectModal] = useState<{ userId: string; userName: string; type: "id" | "address" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const list = await getUsersCached();
      // Filter out disabled users (status === "deleted")
      const activeUsers = list.filter((u) => u.status !== "deleted");
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredSortedUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
    const inRange = (createdAt?: string) => {
      if (!createdAt) return true;
      const d = new Date(createdAt);
      if (Number.isNaN(d.getTime())) return true;
      if (from && d < from) return false;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    };
    const matchesSearch = (u: AdminUserDoc) => {
      if (!term) return true;
      const name = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const phone = (u.phoneNumber ?? "").toLowerCase();
      const status = (u.status ?? "").toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        status.includes(term)
      );
    };
    const sorted = [...users]
      .filter((u) => inRange(u.createdAt) && matchesSearch(u))
      .sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const dateA = new Date(a.createdAt ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? 0).getTime();
        switch (sortKey) {
          case "name":
            return (a.name ?? "").localeCompare(b.name ?? "") * dir || (dateA - dateB) * dir;
          case "email":
            return (a.email ?? "").localeCompare(b.email ?? "") * dir || (dateA - dateB) * dir;
          case "role":
            return (a.role ?? "").localeCompare(b.role ?? "") * dir || (dateA - dateB) * dir;
          case "status": {
            const sa = a.status ?? "active";
            const sb = b.status ?? "active";
            return sa.localeCompare(sb) * dir || (dateA - dateB) * dir;
          }
          case "created":
          default:
            return (dateA - dateB) * dir;
        }
      });
    return sorted;
  }, [users, sortKey, sortDirection, startDate, endDate, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedUsers.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paginatedUsers = filteredSortedUsers.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const toggleSort = (key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDirection("asc");
      return key;
    });
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDirection === "asc" ? "▲" : "▼") : "";

  const handleApprovePhone = async (userId: string) => {
    setUpdatingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneVerified: true }), credentials: "include" });
      invalidateUsersCache();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, phoneVerified: true } : u)));
    } catch (error) {
      console.error("Error approving phone:", error);
      alert("Failed to approve phone.", { variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveId = async (userId: string) => {
    setUpdatingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idVerified: true }), credentials: "include" });
      invalidateUsersCache();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, idVerified: true, idPending: false } : u)));
    } catch (error) {
      console.error("Error approving ID:", error);
      alert("Failed to approve ID.", { variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveAddress = async (userId: string) => {
    setUpdatingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addressVerified: true }), credentials: "include" });
      invalidateUsersCache();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, addressVerified: true, addressPending: false } : u)));
    } catch (error) {
      console.error("Error approving address:", error);
      alert("Failed to approve address.", { variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const openRejectModal = (userId: string, userName: string, type: "id" | "address") => {
    setRejectModal({ userId, userName, type });
    setRejectReason("");
  };

  const closeRejectModal = () => {
    setRejectModal(null);
    setRejectReason("");
  };

  const handleRejectWithReason = async () => {
    if (!rejectModal) return;
    const { userId, type } = rejectModal;
    setUpdatingId(userId);
    try {
      const body: Record<string, unknown> =
        type === "id"
          ? { idVerified: false, idRejectionReason: rejectReason.trim() }
          : { addressVerified: false, addressRejectionReason: rejectReason.trim() };
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      invalidateUsersCache();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, ...(type === "id" ? { idVerified: false, idPending: false } : { addressVerified: false, addressPending: false }) }
            : u
        )
      );
      closeRejectModal();
      alert("The user has been notified. They can upload a new document from their Verification Center.", { variant: "success" });
    } catch (error) {
      console.error("Error rejecting verification:", error);
      alert("Failed to reject. Please try again.", { variant: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetStatus = async (userId: string, status: UserStatus) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own status.", { variant: "error" });
      return;
    }
    setUpdatingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }), credentials: "include" });
      invalidateUsersCache();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status.", { variant: "error" });
    } finally {
      setUpdatingId(null);
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
      setUpdatingId(userId);
      try {
        await fetch(`/api/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
        invalidateUsersCache();
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        alert(`User "${name}" has been permanently deleted from the system.`, { variant: "success" });
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again.", { variant: "error" });
      } finally {
        setUpdatingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">All Users</h1>
        <p className="text-gray-600 mt-1">
          Review and approve phone numbers and ID verification. Users cannot create or edit campaigns until both their phone number and ID are approved by an admin.
        </p>
        {users.length > 0 && (
          <p className="text-gray-500 text-sm mt-1">
            {filteredSortedUsers.length} users total · Showing {start + 1}–{Math.min(start + PAGE_SIZE, filteredSortedUsers.length)}
          </p>
        )}
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-gray-500">Filter by signup date:</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-500">Search users:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone, or status"
            className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl gradient-border-1 shadow-sm min-w-0">
        <p className="px-5 py-2 text-xs text-gray-500 border-b border-gray-100 md:sr-only" aria-hidden="true">Scroll horizontally to view all columns.</p>
        <div className="overflow-x-auto min-w-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1">
                    Name <span className="text-xs">{sortIndicator("name")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("email")} className="inline-flex items-center gap-1">
                    Email <span className="text-xs">{sortIndicator("email")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("role")} className="inline-flex items-center gap-1">
                    Role <span className="text-xs">{sortIndicator("role")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1">
                    Status <span className="text-xs">{sortIndicator("status")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Phone approved</th>
                <th className="px-5 py-3 font-medium">ID verified</th>
                <th className="px-5 py-3 font-medium">Address verified</th>
                <th className="px-5 py-3 font-medium">Documents</th>
                <th className="px-5 py-3 font-medium bg-gray-50 sticky right-0 z-10 min-w-[220px] w-[220px] shadow-[-4px_0_8px_rgba(0,0,0,0.08)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-500">No users yet</td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const status = u.status ?? "active";
                const statusLabel = status === "active" ? "Active" : status === "on_hold" ? "On hold" : "Disabled";
                return (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]" title={u.email}>{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={u.role === "admin" ? "text-primary-600 font-medium" : "text-gray-600"}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={
                        status === "active" ? "text-verified-600" :
                        status === "on_hold" ? "text-amber-600" : "text-red-600"
                      }>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.phoneNumber || "—"}</td>
                    <td className="px-5 py-3">
                      {u.phoneVerified ? (
                        <span className="text-verified-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      ) : u.phonePending ? (
                        <span className="text-amber-600 inline-flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Pending
                        </span>
                      ) : (
                        <span className="text-gray-400 inline-flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Not submitted
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {u.idVerified ? (
                        <span className="text-verified-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Verified</span>
                      ) : u.idPending ? (
                        <span className="text-amber-600 inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Pending</span>
                      ) : (
                        <span className="text-gray-400 inline-flex items-center gap-1"><XCircle className="w-4 h-4" /> Not submitted</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {u.addressVerified ? (
                        <span className="text-verified-600 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Verified</span>
                      ) : u.addressPending ? (
                        <span className="text-amber-600 inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Pending</span>
                      ) : (
                        <span className="text-gray-400 inline-flex items-center gap-1"><XCircle className="w-4 h-4" /> Not submitted</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.idDocument ? (
                          <a
                            href={u.idDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-medium"
                            title="View ID document"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View ID
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                        {u.addressDocument ? (
                          <a
                            href={u.addressDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-medium"
                            title="View address document"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View address
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                        {!u.idDocument && !u.addressDocument && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top bg-white sticky right-0 z-10 min-w-[220px] w-[220px] shadow-[-4px_0_8px_rgba(0,0,0,0.08)]">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSelf ? (
                          <span className="text-gray-400 text-xs">(You)</span>
                        ) : null}
                        {u.phoneNumber && !u.phoneVerified && (
                          <button
                            type="button"
                            onClick={() => handleApprovePhone(u.id)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {updatingId === u.id ? "…" : "Approve phone"}
                          </button>
                        )}
                        {u.idDocument && !u.idVerified && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveId(u.id)}
                              disabled={updatingId === u.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {updatingId === u.id ? "…" : "Approve ID"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(u.id, u.name ?? "User", "id")}
                              disabled={updatingId === u.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject ID
                            </button>
                          </>
                        )}
                        {u.addressDocument && !u.addressVerified && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveAddress(u.id)}
                              disabled={updatingId === u.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {updatingId === u.id ? "…" : "Approve Address"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(u.id, u.name ?? "User", "address")}
                              disabled={updatingId === u.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject Address
                            </button>
                          </>
                        )}
                        {status === "active" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handlePutOnHold(u.id, u.name)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            Put on hold
                          </button>
                        )}
                        {status === "on_hold" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRemoveHold(u.id)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Remove hold
                          </button>
                        )}
                        {status === "deleted" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleReinstateUser(u.id, u.name)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {updatingId === u.id ? "…" : "Reinstate"}
                          </button>
                        )}
                        {status !== "deleted" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDisableUser(u.id, u.name, u.email)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            {updatingId === u.id ? "…" : "Disable"}
                          </button>
                        )}
                        {status !== "deleted" && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUserPermanently(u.id, u.name, u.email)}
                            disabled={updatingId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-medium disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {updatingId === u.id ? "…" : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
        {users.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject verification modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeRejectModal}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Reject {rejectModal.type === "id" ? "ID document" : "Address document"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              The user will be notified and can upload a new document from their Verification Center.
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              Reason for rejection (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Document is blurry, name does not match, expired..."
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRejectModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectWithReason}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
