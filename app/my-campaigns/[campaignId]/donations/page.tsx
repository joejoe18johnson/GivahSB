"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { AdminDonation } from "@/lib/adminData";

interface CampaignSummary {
  id: string;
  title: string;
  goal: number;
  raised: number;
}

export default function MyCampaignDonationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const campaignId = typeof params.campaignId === "string" ? params.campaignId : "";
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?callbackUrl=/my-campaigns");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!campaignId || !user) return;
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/my/campaigns/${campaignId}/donations`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.status === 403 || res.status === 404) {
          if (!cancelled) setError(res.status === 403 ? "You can’t view donations for this campaign." : "Campaign not found.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Failed to load donations.");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setCampaign(data.campaign ?? null);
          setDonations(Array.isArray(data.donations) ? data.donations : []);
        }
      } catch {
        if (!cancelled) setError("Failed to load donations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [campaignId, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const goal = campaign?.goal ?? 0;
  const raised = campaign?.raised ?? 0;
  const toGo = Math.max(0, goal - raised);
  const progressPct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Link
        href="/my-campaigns"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Campaigns
      </Link>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-600">Loading donations…</p>
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">{error}</p>
          <Link href="/my-campaigns" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
            Return to My Campaigns
          </Link>
        </div>
      ) : campaign ? (
        <>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-2">Campaign Donations</h1>
          <p className="text-gray-600 mb-8">{campaign.title}</p>

          {/* Status bar: raised / goal, how much to go */}
          <div className="bg-white rounded-xl gradient-border-1 shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-verified-600" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(raised)}</span>
                <span className="text-gray-500">raised</span>
              </div>
              <div className="text-gray-400">/</div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(goal)}</span>
                <span className="text-gray-500"> goal</span>
              </div>
              <div className="flex-1" />
              {toGo > 0 ? (
                <div className="text-verified-700 font-medium">
                  {formatCurrency(toGo)} to go
                </div>
              ) : (
                <div className="text-verified-600 font-semibold">Goal reached!</div>
              )}
            </div>
            <div className="h-3 bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-verified-500 rounded-r transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Donors list */}
          <div className="bg-white rounded-xl gradient-border-1 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-500 to-verified-500 bg-clip-text text-transparent">Donors</h2>
              <span className="text-gray-500 text-sm">({donations.length})</span>
            </div>
            <div className="divide-y divide-gray-100">
              {donations.length === 0 ? (
                <div className="px-5 py-12 text-center text-gray-500">
                  No donations yet. Share your campaign to start receiving support.
                </div>
              ) : (
                donations
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((d) => (
                    <div key={d.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {d.anonymous ? "Anonymous Donor" : d.donorName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatRelativeTime(d.createdAt)}
                            {d.status === "pending" && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Pending approval
                              </span>
                            )}
                          </p>
                          {d.note && (
                            <p className="text-sm text-gray-600 mt-1 italic">&ldquo;{d.note}&rdquo;</p>
                          )}
                        </div>
                        <div className="sm:text-right">
                          <p className="font-semibold text-verified-600">{formatCurrency(d.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
