"use client";

import { useState, useEffect, useMemo } from "react";
import { Campaign } from "@/lib/data";
import { getCampaignsForAdminCached, invalidateCampaignsCache } from "@/lib/supabase/adminCache";
import { formatCurrency } from "@/lib/utils";
import { useThemedModal } from "@/components/ThemedModal";
import Link from "next/link";
import { CheckCircle2, XCircle, Trash2, PauseCircle, PlayCircle, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 50;
type CampaignWithStatus = Campaign & { status?: string };
type SortKey = "created" | "goal" | "raised" | "title" | "creator" | "status" | "verified";
type SortDirection = "asc" | "desc";

export default function AdminCampaignsPage() {
  const { user: currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [onHoldId, setOnHoldId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithStatus | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", fullDescription: "", goal: "", raised: "" });
  const [savingText, setSavingText] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { confirm, alert } = useThemedModal();

  async function loadCampaigns() {
    setLoadError(null);
    setIsLoading(true);
    try {
      const fetchedCampaigns = await getCampaignsForAdminCached();
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  const filteredSortedCampaigns = useMemo(() => {
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
    const sorted = [...campaigns]
      .filter((c) => inRange(c.createdAt))
      .sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        const dateA = new Date(a.createdAt ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? 0).getTime();
        switch (sortKey) {
          case "goal":
            return ((a.goal ?? 0) - (b.goal ?? 0)) * dir;
          case "raised":
            return ((a.raised ?? 0) - (b.raised ?? 0)) * dir;
          case "title":
            return (a.title ?? "").localeCompare(b.title ?? "") * dir || (dateA - dateB) * dir;
          case "creator":
            return (a.creator ?? "").localeCompare(b.creator ?? "") * dir || (dateA - dateB) * dir;
          case "status":
            return (a.status ?? "").localeCompare(b.status ?? "") * dir || (dateA - dateB) * dir;
          case "verified": {
            const va = a.verified ? 1 : 0;
            const vb = b.verified ? 1 : 0;
            return (va - vb) * dir || (dateA - dateB) * dir;
          }
          case "created":
          default:
            return (dateA - dateB) * dir;
        }
      });
    return sorted;
  }, [campaigns, sortKey, sortDirection, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedCampaigns.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paginatedCampaigns = filteredSortedCampaigns.slice(start, start + PAGE_SIZE);

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

  const handleDelete = async (campaignId: string, title: string) => {
    const ok = await confirm(
      `Delete "${title}"? This will remove the campaign from the main site and cannot be undone.`,
      { title: "Delete campaign", confirmLabel: "Delete", cancelLabel: "Cancel", variant: "danger" }
    );
    if (!ok) return;
    setDeletingId(campaignId);
    try {
      await fetch(`/api/admin/campaigns/${campaignId}/delete`, { method: "DELETE", credentials: "include" });
      invalidateCampaignsCache();
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (err) {
      console.error("Error deleting campaign:", err);
      alert("Could not delete the campaign. Please try again.", { variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetOnHold = async (campaignId: string, onHold: boolean) => {
    setOnHoldId(campaignId);
    try {
      await fetch(`/api/admin/campaigns/${campaignId}/on-hold`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onHold }), credentials: "include" });
      invalidateCampaignsCache();
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: onHold ? "on_hold" : "live" } : c))
      );
    } catch (err) {
      console.error("Error updating campaign status:", err);
      alert("Could not update campaign status. Please try again.", { variant: "error" });
    } finally {
      setOnHoldId(null);
    }
  };

  const openEditText = (c: CampaignWithStatus) => {
    setEditingCampaign(c);
    setEditForm({
      title: c.title ?? "",
      description: c.description ?? "",
      fullDescription: c.fullDescription ?? "",
      goal: c.goal != null ? String(c.goal) : "",
      raised: c.raised != null ? String(c.raised) : "",
    });
  };

  const handleSaveText = async () => {
    if (!editingCampaign) return;
    if (!currentUser) {
      alert("You must be signed in to edit.", { variant: "error" });
      return;
    }
    setSavingText(true);
    try {
      const payload: Record<string, unknown> = {
        title: editForm.title,
        description: editForm.description,
        fullDescription: editForm.fullDescription,
      };
      const goalNum = editForm.goal === "" ? undefined : Number(editForm.goal);
      const raisedNum = editForm.raised === "" ? undefined : Number(editForm.raised);
      if (Number.isFinite(goalNum) && goalNum >= 0) payload.goal = goalNum;
      if (Number.isFinite(raisedNum) && raisedNum >= 0) payload.raised = raisedNum;

      const res = await fetch(`/api/admin/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "Failed to update campaign.", { variant: "error" });
        return;
      }
      invalidateCampaignsCache();
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                title: editForm.title,
                description: editForm.description,
                fullDescription: editForm.fullDescription,
                ...(Number.isFinite(goalNum) && goalNum >= 0 ? { goal: goalNum } : {}),
                ...(Number.isFinite(raisedNum) && raisedNum >= 0 ? { raised: raisedNum } : {}),
              }
            : c
        )
      );
      alert("Campaign updated.", { variant: "success" });
      setEditingCampaign(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update.", { variant: "error" });
    } finally {
      setSavingText(false);
    }
  };

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Campaigns</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium mb-2">Could not load campaigns</p>
          <p className="text-red-700 text-sm mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => loadCampaigns()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Campaigns</h1>
          <p className="text-gray-600 mt-1">{filteredSortedCampaigns.length} campaigns total</p>
          {filteredSortedCampaigns.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">Showing {start + 1}–{Math.min(start + PAGE_SIZE, filteredSortedCampaigns.length)}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Put a campaign on hold to hide it from the public site, or delete it. Use <strong>Release</strong> to make an on-hold campaign live again.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 text-sm">
          <span className="text-gray-500">Filter by created date:</span>
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
      </div>

      <div className="bg-white rounded-xl gradient-border-1 shadow-sm min-w-0">
        <p className="px-5 py-2 text-xs text-gray-500 border-b border-gray-100 md:sr-only" aria-hidden="true">
          Scroll horizontally to view Status, Verified, Actions, and Campaign ID columns.
        </p>
        <div className="overflow-x-auto min-w-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Campaign ID</th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("title")} className="inline-flex items-center gap-1">
                    Title <span className="text-xs">{sortIndicator("title")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("creator")} className="inline-flex items-center gap-1">
                    Creator <span className="text-xs">{sortIndicator("creator")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("goal")} className="inline-flex items-center gap-1">
                    Goal <span className="text-xs">{sortIndicator("goal")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("raised")} className="inline-flex items-center gap-1">
                    Raised <span className="text-xs">{sortIndicator("raised")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Donors</th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("created")} className="inline-flex items-center gap-1">
                    Created <span className="text-xs">{sortIndicator("created")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1">
                    Status <span className="text-xs">{sortIndicator("status")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("verified")} className="inline-flex items-center gap-1">
                    Verified <span className="text-xs">{sortIndicator("verified")}</span>
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Actions</th>
                <th className="px-5 py-3 font-medium">UUID</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-5 py-12 text-center text-gray-500">No campaigns yet</td>
                </tr>
              ) : (
                paginatedCampaigns.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-gray-700 whitespace-nowrap" title={c.id}>
                    {c.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/campaigns/${c.id}`} className="text-primary-600 hover:underline max-w-[200px] truncate block" title={c.title}>
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-900">{c.creator}</td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{c.creatorType}</td>
                  <td className="px-5 py-3 text-gray-600">{c.category}</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(c.goal)}</td>
                  <td className="px-5 py-3 font-medium text-verified-600">{formatCurrency(c.raised)}</td>
                  <td className="px-5 py-3">{c.backers}</td>
                  <td className="px-5 py-3 text-gray-600">{c.createdAt}</td>
                  <td className="px-5 py-3">
                    {c.status === "on_hold" ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">On hold</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-verified-600">Live</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {c.verified ? (
                      <span className="inline-flex items-center gap-1 text-verified-600"><CheckCircle2 className="w-4 h-4" /> Yes</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600"><XCircle className="w-4 h-4" /> No</span>
                    )}
                  </td>
                  <td className="px-5 py-3 flex flex-wrap items-center gap-2">
                    {c.status === "on_hold" ? (
                      <button
                        type="button"
                        onClick={() => handleSetOnHold(c.id, false)}
                        disabled={onHoldId === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium disabled:opacity-50"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        {onHoldId === c.id ? "Updating…" : "Release"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetOnHold(c.id, true)}
                        disabled={onHoldId === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-medium disabled:opacity-50"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        {onHoldId === c.id ? "Updating…" : "Put on hold"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditText(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 text-xs font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit text
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.title)}
                      disabled={deletingId === c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{c.id}</td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
        {campaigns.length > PAGE_SIZE && (
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

      {campaigns.some((c) => c.proofDocuments && c.proofDocuments.length > 0) && (
        <div className="bg-white rounded-xl gradient-border-1 shadow-sm overflow-hidden">
          <h2 className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900">Proof documents (by campaign)</h2>
          <div className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <p className="font-medium text-gray-900 mb-2">
                  {c.title} <span className="text-gray-500 font-normal">(Campaign ID: {c.id.slice(-6).toUpperCase()})</span>
                </p>
                {c.proofDocuments && c.proofDocuments.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {c.proofDocuments.map((doc) => (
                      <li key={doc.id}>
                        <span className="font-medium">{doc.name}</span> — {doc.type} — {doc.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No proof documents</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit campaign modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !savingText && setEditingCampaign(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit campaign</h2>
              <p className="text-sm text-gray-500 mt-0.5">Edit text, goal, or amount raised. Changes appear on the live campaign page.</p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal (BZ$)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editForm.goal}
                    onChange={(e) => setEditForm((f) => ({ ...f, goal: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Funding goal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount raised (BZ$)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editForm.raised}
                    onChange={(e) => setEditForm((f) => ({ ...f, raised: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Total donations"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Campaign title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description (shown on cards)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full description</label>
                <textarea
                  value={editForm.fullDescription}
                  onChange={(e) => setEditForm((f) => ({ ...f, fullDescription: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Full story (campaign detail page)"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !savingText && setEditingCampaign(null)}
                disabled={savingText}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveText}
                disabled={savingText}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {savingText ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
