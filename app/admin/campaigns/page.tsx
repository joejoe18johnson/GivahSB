"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/lib/data";
import { getCampaignsForAdminCached, invalidateCampaignsCache } from "@/lib/supabase/adminCache";
import { formatCurrency } from "@/lib/utils";
import { useThemedModal } from "@/components/ThemedModal";
import Link from "next/link";
import { CheckCircle2, XCircle, Trash2, PauseCircle, PlayCircle, Pencil, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 50;
type CampaignWithStatus = Campaign & { status?: string };

export default function AdminCampaignsPage() {
  const { user: currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [onHoldId, setOnHoldId] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithStatus | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", fullDescription: "" });
  const [savingText, setSavingText] = useState(false);
  const [page, setPage] = useState(1);
  const { confirm, alert } = useThemedModal();

  async function loadCampaigns() {
    setLoadError(null);
    setIsLoading(true);
    try {
      const fetchedCampaigns = await getCampaignsForAdmin();
      const sorted = [...fetchedCampaigns].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setCampaigns(sorted);
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

  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paginatedCampaigns = campaigns.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

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
      const res = await fetch(`/api/admin/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "Failed to update campaign text.", { variant: "error" });
        return;
      }
      invalidateCampaignsCache();
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id
            ? { ...c, title: editForm.title, description: editForm.description, fullDescription: editForm.fullDescription }
            : c
        )
      );
      alert("Campaign text updated.", { variant: "success" });
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
          <p className="text-gray-600 mt-1">{campaigns.length} campaigns total</p>
          {campaigns.length > 0 && (
            <p className="text-gray-500 text-sm mt-1">Showing {start + 1}–{Math.min(start + PAGE_SIZE, campaigns.length)}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Put a campaign on hold to hide it from the public site, or delete it. Use <strong>Release</strong> to make an on-hold campaign live again.
          </p>
        </div>
        <Link
          href="/admin/campaigns/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Create campaign
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Goal</th>
                <th className="px-5 py-3 font-medium">Raised</th>
                <th className="px-5 py-3 font-medium">Backers</th>
                <th className="px-5 py-3 font-medium">Days left</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Verified</th>
                <th className="px-5 py-3 font-medium">Actions</th>
                <th className="px-5 py-3 font-medium">ID</th>
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
                  <td className="px-5 py-3">{c.daysLeft}</td>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="px-5 py-4 border-b border-gray-200 font-semibold text-gray-900">Proof documents (by campaign)</h2>
          <div className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <p className="font-medium text-gray-900 mb-2">
                  {c.title} <span className="text-gray-500 font-normal">(ID: {c.id})</span>
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

      {/* Edit campaign text modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !savingText && setEditingCampaign(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit campaign text</h2>
              <p className="text-sm text-gray-500 mt-0.5">Fix grammar or spelling. Changes appear on the live campaign page.</p>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
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
