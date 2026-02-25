"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCampaignsUnderReviewCached, invalidateUnderReviewCache, invalidateCampaignsCache } from "@/lib/supabase/adminCache";
import type { CampaignUnderReviewDoc } from "@/lib/supabase/database";
import { formatCurrency } from "@/lib/utils";
import { useThemedModal } from "@/components/ThemedModal";
import SafeImage from "@/components/SafeImage";
import { Clock, CheckCircle2, XCircle, X, FileText, User, Calendar, DollarSign, Image as ImageIcon } from "lucide-react";

export default function AdminUnderReviewPage() {
  const [list, setList] = useState<CampaignUnderReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignUnderReviewDoc | null>(null);
  const { alert, confirm } = useThemedModal();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCampaignsUnderReviewCached();
      const sorted = [...data].sort((a, b) =>
        new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
      );
      setList(sorted);
    } catch (error) {
      console.error("Error loading campaigns under review:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    const ok = await confirm("Approve this campaign? It will go live immediately and the creator will be notified.", {
      title: "Approve campaign",
      confirmLabel: "Approve",
      cancelLabel: "Cancel",
      variant: "success",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/admin/approve-campaign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ underReviewId: id }), credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to approve. Please try again.";
        throw new Error(msg);
      }
      invalidateUnderReviewCache();
      invalidateCampaignsCache();
      setList((prev) => prev.filter((c) => c.id !== id));
      setSelectedCampaign((prev) => (prev?.id === id ? null : prev));
    } catch (error) {
      console.error("Error approving:", error);
      const message = error instanceof Error ? error.message : "Failed to approve. Please try again.";
      alert(message, { variant: "error" });
    }
  };

  const handleReject = async (id: string) => {
    const ok = await confirm("Reject and remove this campaign from review? The creator would need to resubmit.", {
      title: "Reject campaign",
      confirmLabel: "Reject",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await fetch(`/api/admin/campaigns-under-review/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }), credentials: "include" });
      invalidateUnderReviewCache();
      setList((prev) => prev.filter((c) => c.id !== id));
      setSelectedCampaign((prev) => (prev?.id === id ? null : prev));
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Failed to reject. Please try again.", { variant: "error" });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaigns under review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Campaigns under review</h1>
          <p className="text-gray-600 mt-1">
            New campaigns submitted by creators appear here. Withdrawn campaigns are removed automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="shrink-0 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
        >
          Refresh list
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No campaigns under review</p>
          <p className="text-gray-500 text-sm mt-1">New submissions will appear here when creators submit from the campaign creation form.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 min-w-0">
          <p className="px-5 py-2 text-xs text-gray-500 border-b border-gray-100 md:sr-only" aria-hidden="true">Scroll horizontally to view all columns.</p>
          <div className="overflow-x-auto min-w-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Creator</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Goal</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCampaign(c)}
                  >
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(c.submittedAt)}</td>
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-[200px] truncate" title={c.title}>{c.title}</td>
                    <td className="px-5 py-3 text-gray-900">{c.creatorName}</td>
                    <td className="px-5 py-3 text-gray-600">{c.category}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(c.goal)}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[220px] truncate" title={c.description}>{c.description}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaign(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 text-xs font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign detail modal */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedCampaign(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-detail-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 id="campaign-detail-title" className="text-xl font-semibold text-gray-900">
                Campaign details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{selectedCampaign.title}</h3>
                <p className="text-sm text-gray-500">{formatDate(selectedCampaign.submittedAt)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span><strong>Creator:</strong> {selectedCampaign.creatorName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span><strong>Category:</strong> {selectedCampaign.category}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                  <span><strong>Goal:</strong> {formatCurrency(selectedCampaign.goal)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span><strong>Duration:</strong> {selectedCampaign.daysLeft === 0 ? "Unlimited" : `${selectedCampaign.daysLeft} days`}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Short description</h4>
                <p className="text-gray-600 text-sm">{selectedCampaign.description}</p>
              </div>
              {(selectedCampaign.fullDescription || "") !== (selectedCampaign.description || "") && selectedCampaign.fullDescription && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Full description</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedCampaign.fullDescription}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  Campaign images
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedCampaign.image ? (
                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-video relative">
                      <SafeImage
                        src={selectedCampaign.image}
                        alt={`${selectedCampaign.title} - Image 1`}
                        fill
                        className="object-cover"
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                            Image 1
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      No image 1
                    </div>
                  )}
                  {selectedCampaign.image2 ? (
                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-video relative">
                      <SafeImage
                        src={selectedCampaign.image2}
                        alt={`${selectedCampaign.title} - Image 2`}
                        fill
                        className="object-cover"
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                            Image 2
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      No image 2
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
                <p className="font-medium mb-1">Identity & proof of need</p>
                <p>
                  Creators must have their phone, ID, and address verified before a campaign can go live. Review and approve the creator&apos;s verification documents in{" "}
                  <Link href="/admin/users" className="text-primary-600 font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                    Admin → Users
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap gap-3 justify-end shrink-0 bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleReject(selectedCampaign.id)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium text-sm"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedCampaign.id)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 font-medium text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
