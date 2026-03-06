"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Baby, CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";
import { getCampaignsUnderReviewCached, invalidateCampaignsCache, invalidateUnderReviewCache } from "@/lib/supabase/adminCache";
import type { CampaignUnderReviewDoc } from "@/lib/supabase/database";
import { useThemedModal } from "@/components/ThemedModal";
import { formatCurrency } from "@/lib/utils";

export default function AdminLittleWarriorsPage() {
  const [list, setList] = useState<CampaignUnderReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const { alert, confirm } = useThemedModal();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCampaignsUnderReviewCached();
      const littleWarriors = data
        .filter((c) => c.isLittleWarriors)
        .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime());
      setList(littleWarriors);
    } catch (error) {
      console.error("Error loading Little Warriors campaigns:", error);
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
    const campaign = list.find((c) => c.id === id);
    if (campaign && (!campaign.proofDocumentUrls || campaign.proofDocumentUrls.length === 0)) {
      alert("Proof of need is required. This campaign has no proof documents. Ask the creator to resubmit with proof documents, or reject this submission.", {
        title: "Proof required",
        variant: "warning",
      });
      return;
    }
    const ok = await confirm("Approve this Little Warriors campaign? It will go live immediately and the creator will be notified.", {
      title: "Approve campaign",
      confirmLabel: "Approve",
      cancelLabel: "Cancel",
      variant: "success",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/admin/approve-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ underReviewId: id }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to approve. Please try again.";
        throw new Error(msg);
      }
      invalidateUnderReviewCache();
      invalidateCampaignsCache();
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error approving campaign:", error);
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
      const res = await fetch(`/api/admin/campaigns-under-review/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject. Please try again.");
      invalidateUnderReviewCache();
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      alert("Failed to reject. Please try again.", { variant: "error" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Little Warriors campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Baby className="w-7 h-7 text-pink-500" />
            Little Warriors (Under Review)
          </h1>
          <p className="text-gray-600 mt-1">
            Campaigns marked for children ages 0-12 appear here for focused review.
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
        <div className="bg-white rounded-xl gradient-border-1 p-12 text-center">
          <Clock className="w-12 h-12 text-pink-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">No Little Warriors campaigns under review</p>
          <p className="text-gray-500 text-sm mt-1">
            When creators check the Little Warriors option on campaign creation, submissions will appear here.
          </p>
          <Link href="/admin/under-review" className="inline-flex items-center gap-2 text-primary-600 hover:underline mt-4 text-sm font-medium">
            Go to all under-review campaigns
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl gradient-border-1 min-w-0">
          <p className="px-5 py-2 text-xs text-gray-500 border-b border-gray-100 md:sr-only" aria-hidden="true">
            Scroll horizontally to view all columns.
          </p>
          <div className="overflow-x-auto min-w-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Creator</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Goal</th>
                  <th className="px-5 py-3 font-medium">Proof docs</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(c.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-[260px] truncate" title={c.title}>
                      {c.title}
                    </td>
                    <td className="px-5 py-3 text-gray-900">{c.creatorName}</td>
                    <td className="px-5 py-3 text-gray-600">{c.category}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(c.goal)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {c.proofDocumentUrls && c.proofDocumentUrls.length > 0 ? (
                        <span>{c.proofDocumentUrls.length} file(s)</span>
                      ) : (
                        <span className="text-red-600">Missing</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(c.id)}
                          disabled={!c.proofDocumentUrls || c.proofDocumentUrls.length === 0}
                          title={!c.proofDocumentUrls || c.proofDocumentUrls.length === 0 ? "Proof of need required" : undefined}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-verified-100 text-verified-700 hover:bg-verified-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

