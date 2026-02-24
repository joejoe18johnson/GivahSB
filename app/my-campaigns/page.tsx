"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Campaign } from "@/lib/data";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import { formatCurrency } from "@/lib/utils";
import {
  getStoppedCampaignIds,
  getDeletedCampaignIds,
  setStoppedCampaignIds,
  setDeletedCampaignIds,
} from "@/lib/campaignState";
import type { CampaignUnderReviewDoc } from "@/lib/supabase/database";
import { useThemedModal } from "@/components/ThemedModal";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  MapPin,
  FileText,
  StopCircle,
  Trash2,
  Clock,
  XCircle,
  PauseCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function MyCampaignsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { confirm, alert } = useThemedModal();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [stoppedIds, setStoppedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [underReview, setUnderReview] = useState<CampaignUnderReviewDoc[]>([]);
  const [onHold, setOnHold] = useState<(Campaign & { status?: string })[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/my-campaigns");
    }
  }, [user, isLoading, router]);

  const loadUnderReview = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/my/campaigns-under-review", { credentials: "include" });
      const list = res.ok ? await res.json() : [];
      setUnderReview(list);
    } catch (error) {
      console.error("Error loading campaigns under review:", error);
      setUnderReview([]);
    }
  }, [user?.id]);

  const loadOnHold = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/my/campaigns-on-hold", { credentials: "include" });
      const list = res.ok ? await res.json() : [];
      setOnHold(list);
    } catch (error) {
      console.error("Error loading campaigns on hold:", error);
      setOnHold([]);
    }
  }, [user?.id]);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const fetchedCampaigns = await fetchCampaignsFromAPI();
        setCampaigns(fetchedCampaigns);
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setCampaignsLoading(false);
      }
    }
    loadCampaigns();
    setStoppedIds(new Set(getStoppedCampaignIds()));
    setDeletedIds(new Set(getDeletedCampaignIds()));
  }, []);

  useEffect(() => {
    loadUnderReview();
    loadOnHold();
    const interval = setInterval(() => {
      loadUnderReview();
      loadOnHold();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadUnderReview, loadOnHold]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadUnderReview();
        loadOnHold();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadUnderReview, loadOnHold]);

  const handleStop = useCallback((e: React.MouseEvent, campaignId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = new Set(stoppedIds).add(campaignId);
    setStoppedIds(next);
    setStoppedCampaignIds(Array.from(next));
  }, [stoppedIds]);

  const handleDelete = useCallback(async (e: React.MouseEvent, campaignId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm(
      "Are you sure you want to delete this campaign? It will be removed from the site entirely (home, campaigns list, and campaign page) and cannot be undone.",
      {
        title: "Delete campaign",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "danger",
      }
    );
    if (!ok) return;
    try {
      await fetch(`/api/admin/campaigns/${campaignId}/delete`, { method: "DELETE", credentials: "include" });
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      const nextDeleted = new Set(deletedIds).add(campaignId);
      setDeletedIds(nextDeleted);
      setDeletedCampaignIds(Array.from(nextDeleted));
    } catch (err) {
      console.error("Error deleting campaign:", err);
      alert("Could not delete the campaign. You may not have permission, or it may already be removed.", { variant: "error" });
    }
  }, [confirm, alert, deletedIds]);

  const handleWithdrawReview = useCallback(async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm("Withdraw this campaign from review? You can submit a new one later.", {
      title: "Withdraw from review",
      confirmLabel: "Withdraw",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await fetch(`/api/admin/campaigns-under-review/${id}`, { method: "DELETE", credentials: "include" });
      setUnderReview((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error withdrawing campaign:", err);
    }
  }, [confirm]);

  if (isLoading || campaignsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const myCampaigns = campaigns.filter(
    (c) =>
      c.creator.trim().toLowerCase() === user.name.trim().toLowerCase() &&
      !deletedIds.has(c.id)
  );

  const myUnderReview = underReview;
  const myOnHold = onHold;

  const formatReviewDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900">My Campaigns</h1>
          <p className="text-gray-600 mt-1">
            {myCampaigns.length === 0 && myUnderReview.length === 0 && myOnHold.length === 0 && "You haven't started any campaigns yet."}
            {myCampaigns.length > 0 && (
              <>You have {myCampaigns.length} live campaign{myCampaigns.length === 1 ? "" : "s"}.</>
            )}
            {myUnderReview.length > 0 && (
              <>{myCampaigns.length > 0 ? " " : "You have "}{myUnderReview.length} under review.</>
            )}
            {myOnHold.length > 0 && (
              <>{myCampaigns.length > 0 || myUnderReview.length > 0 ? " " : "You have "}{myOnHold.length} on hold.</>
            )}
          </p>
        </div>
        <Link
          href="/campaigns/create"
          className="inline-flex items-center justify-center gap-2 bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Start a campaign
        </Link>
      </div>

      {/* Campaigns under review */}
      {myUnderReview.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-medium text-gray-900 mb-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Campaigns under review
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            These campaigns have been submitted and are awaiting verification. We&apos;ll notify you once they&apos;re approved.
          </p>
          <div className="space-y-4">
            {myUnderReview.map((c) => (
              <div
                key={c.id}
                className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {c.image && (
                  <div className="relative w-full sm:w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <SafeImage
                      src={c.image}
                      alt={c.title}
                      fill
                      className="object-cover"
                      sizes="160px"
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-300">
                          <span className="text-amber-800 text-2xl font-medium">{c.title.charAt(0)}</span>
                        </div>
                      }
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Under review
                    </span>
                    <span className="bg-white/80 px-2.5 py-1 rounded-full text-xs font-medium text-gray-700">
                      {c.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">{c.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium text-success-600">
                      Goal: {formatCurrency(c.goal)}
                    </span>
                    <span>Submitted {formatReviewDate(c.submittedAt)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleWithdrawReview(e, c.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Campaigns on hold */}
      {myOnHold.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-medium text-gray-900 mb-1 flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-600" />
            Campaigns on hold
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            These campaigns have been put on hold by an administrator. They are not visible to the public and cannot be edited until the hold is removed.
          </p>
          <div className="space-y-4">
            {myOnHold.map((campaign) => {
              const progress = Math.min((campaign.raised / campaign.goal) * 100, 100);
              return (
                <div
                  key={campaign.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 cursor-default select-none"
                  style={{ pointerEvents: "none" }}
                >
                  <div className="relative w-full sm:w-48 h-36 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <SafeImage
                      src={campaign.image}
                      alt={campaign.title}
                      fill
                      className="object-cover"
                      sizes="192px"
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                          <span className="text-gray-500 text-2xl font-medium">
                            {campaign.title.charAt(0)}
                          </span>
                        </div>
                      }
                    />
                    <span className="absolute top-2 right-2 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <PauseCircle className="w-3.5 h-3.5" />
                      On hold
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <PauseCircle className="w-3.5 h-3.5" />
                        On hold
                      </span>
                      <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium text-gray-700">
                        {campaign.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{campaign.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{campaign.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium text-success-600">
                        {formatCurrency(campaign.raised)} / {formatCurrency(campaign.goal)}
                      </span>
                      <span>{campaign.backers} backers</span>
                      <span>{campaign.daysLeft} days left</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* My live campaigns */}
      <section>
        <h2 className="text-xl font-medium text-gray-900 mb-4">Live campaigns</h2>
      {myCampaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first campaign to share your cause and start receiving support from the
              community.
            </p>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center gap-2 bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create your first campaign
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {myCampaigns.map((campaign) => {
            const progress = Math.min((campaign.raised / campaign.goal) * 100, 100);
            const isStopped = stoppedIds.has(campaign.id);
            return (
              <div
                key={campaign.id}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all"
              >
                <div className="flex flex-col md:flex-row">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="relative w-full md:w-64 h-48 md:h-auto md:min-h-[200px] bg-gray-200 flex-shrink-0 block"
                  >
                    <SafeImage
                      src={campaign.image}
                      alt={campaign.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 256px"
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                          <span className="text-primary-600 text-4xl font-medium">
                            {campaign.title.charAt(0)}
                          </span>
                        </div>
                      }
                    />
                    <div className="absolute top-3 right-3 flex gap-2 flex-wrap">
                      {campaign.verified && (
                        <span className="bg-verified-500 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1" title="Approved by admin">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      )}
                      {isStopped && (
                        <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <StopCircle className="w-3.5 h-3.5" />
                          Stopped
                        </span>
                      )}
                      <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-primary-600">
                        {campaign.category}
                      </span>
                    </div>
                  </Link>
                  <div className="flex-1 p-5 md:p-6 flex flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {campaign.title}
                      </Link>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="inline-flex items-center text-gray-500 text-sm hover:text-primary-600"
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        View campaign
                      </Link>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{campaign.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <DollarSign className="w-4 h-4 text-success-600" />
                        <span className="font-medium text-success-600">
                          {formatCurrency(campaign.raised)}
                        </span>
                        <span className="text-gray-500">/ {formatCurrency(campaign.goal)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{campaign.backers} backers</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{campaign.daysLeft} days left</span>
                      </div>
                      {campaign.location && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{campaign.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>Created {campaign.createdAt}</span>
                      <span className="capitalize">{campaign.creatorType}</span>
                      {campaign.proofDocuments && campaign.proofDocuments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {campaign.proofDocuments.length} proof doc
                          {campaign.proofDocuments.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-verified-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                        View
                      </Link>
                      {!isStopped && (
                        <button
                          type="button"
                          onClick={(e) => handleStop(e, campaign.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm font-medium transition-colors"
                        >
                          <StopCircle className="w-4 h-4" />
                          Stop campaign
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, campaign.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete campaign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </section>
    </div>
  );
}
