"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Baby, Clock, ExternalLink } from "lucide-react";
import { getCampaignsForAdminCached } from "@/lib/supabase/adminCache";
import type { Campaign } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default function AdminLittleWarriorsPage() {
  const [list, setList] = useState<(Campaign & { status?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCampaignsForAdminCached();
      const littleWarriors = data
        .filter((c) => c.isLittleWarriors)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
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
            Little Warriors Campaigns
          </h1>
          <p className="text-gray-600 mt-1">
            Campaigns marked as Little Warriors appear here. Use Admin → Campaigns → Edit to change status.
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
          <p className="text-gray-700 font-medium">No campaigns are marked as Little Warriors</p>
          <p className="text-gray-500 text-sm mt-1">
            Set "Little Warriors status" to "Little Warrior (ages 0-12)" in Admin Campaigns edit to move a campaign here.
          </p>
          <Link href="/admin/campaigns" className="inline-flex items-center gap-2 text-primary-600 hover:underline mt-4 text-sm font-medium">
            Go to all campaigns
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
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Creator</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Goal</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-[260px] truncate" title={c.title}>
                      <Link href={`/campaigns/${c.id}`} className="text-primary-600 hover:underline">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-900">{c.creator}</td>
                    <td className="px-5 py-3 text-gray-600">{c.category}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(c.goal)}</td>
                    <td className="px-5 py-3 font-medium text-verified-600">{formatCurrency(c.raised)}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">
                      {c.status === "on_hold" ? "On hold" : c.status === "stopped" ? "Stopped" : "Live"}
                    </td>
                    <td className="px-5 py-3">
                      <Link href="/admin/campaigns" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 text-xs font-medium">
                        Edit in Campaigns
                      </Link>
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

