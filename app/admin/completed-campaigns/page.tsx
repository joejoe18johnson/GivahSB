"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/lib/data";
import { getCampaignsForAdminCached, invalidateCampaignsCache } from "@/lib/supabase/adminCache";
import { formatCurrency } from "@/lib/utils";
import { useThemedModal } from "@/components/ThemedModal";
import Link from "next/link";
import { Trash2, Trophy } from "lucide-react";

type CampaignWithStatus = Campaign & { status?: string };

function isCompleted(c: CampaignWithStatus): boolean {
  const goal = Number(c.goal) || 0;
  const raised = Number(c.raised) || 0;
  return goal > 0 && raised >= goal;
}

export default function AdminCompletedCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirm, alert } = useThemedModal();

  async function loadCampaigns() {
    setLoadError(null);
    setIsLoading(true);
    try {
      const fetchedCampaigns = await getCampaignsForAdminCached();
      const completed = fetchedCampaigns.filter(isCompleted);
      const sorted = [...completed].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
      setCampaigns(sorted);
    } catch (error) {
      console.error("Error loading completed campaigns:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleRemove = async (campaignId: string, title: string) => {
    const ok = await confirm(
      `Remove "${title}" from the site? This will delete the campaign permanently and it cannot be undone.`,
      { title: "Remove from site", confirmLabel: "Remove", cancelLabel: "Cancel", variant: "danger" }
    );
    if (!ok) return;
    setDeletingId(campaignId);
    try {
      await fetch(`/api/admin/campaigns/${campaignId}/delete`, { method: "DELETE", credentials: "include" });
      invalidateCampaignsCache();
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (err) {
      console.error("Error removing campaign:", err);
      alert("Could not remove the campaign. Please try again.", { variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading completed campaigns...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Completed Campaigns</h1>
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
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-verified-600" />
          Completed Campaigns
        </h1>
        <p className="text-gray-600 mt-1">{campaigns.length} fully funded campaign{campaigns.length !== 1 ? "s" : ""}</p>
        <p className="text-gray-500 text-sm mt-1">
          These campaigns have reached or exceeded their goal. You can remove a campaign from the site (permanent delete).
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No completed campaigns yet</p>
          <p className="text-gray-500 text-sm mt-1">Fully funded campaigns will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Creator</th>
                  <th className="px-5 py-3 font-medium">Goal</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                  <th className="px-5 py-3 font-medium">Backers</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="text-primary-600 hover:underline max-w-[220px] truncate block"
                        title={c.title}
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-900">{c.creator}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(c.goal)}</td>
                    <td className="px-5 py-3 font-medium text-verified-600">{formatCurrency(c.raised)}</td>
                    <td className="px-5 py-3">{c.backers}</td>
                    <td className="px-5 py-3 text-gray-600">{c.createdAt}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemove(c.id, c.title)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === c.id ? "Removing…" : "Remove from site"}
                      </button>
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
