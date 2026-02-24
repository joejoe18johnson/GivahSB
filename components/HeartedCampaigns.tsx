"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import Link from "next/link";
import { X, Heart } from "lucide-react";
import { Campaign } from "@/lib/data";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import SafeImage from "./SafeImage";
import { formatCurrency } from "@/lib/utils";
import { Users, Calendar, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/lib/supabase/hooks";
import { getHeartedCampaignIds as getHeartedFromSupabase, toggleHeartCampaign as toggleHeartInSupabase } from "@/lib/supabase/database";

interface HeartedCampaignsProps {
  isOpen: boolean;
  onClose: () => void;
}

function getHeartedFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("hearted_campaigns");
  return stored ? JSON.parse(stored) : [];
}

type HeartedContextType = {
  heartedIds: string[];
  toggleHeart: (campaignId: string) => Promise<boolean>;
  isCampaignHearted: (campaignId: string) => boolean;
  refreshHeartedIds: () => Promise<void>;
};

const HeartedContext = createContext<HeartedContextType | undefined>(undefined);

export function HeartedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [heartedIds, setHeartedIds] = useState<string[]>([]);

  const refreshHeartedIds = useCallback(async () => {
    if (user?.id && supabase) {
      const ids = await getHeartedFromSupabase(supabase, user.id);
      setHeartedIds(ids);
    } else {
      setHeartedIds(getHeartedFromStorage());
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    refreshHeartedIds();
  }, [refreshHeartedIds]);

  const toggleHeart = useCallback(
    async (campaignId: string): Promise<boolean> => {
      if (user?.id && supabase) {
        const isHearted = await toggleHeartInSupabase(supabase, user.id, campaignId);
        await refreshHeartedIds();
        window.dispatchEvent(new Event("heartedCampaignsChanged"));
        return isHearted;
      }
      const hearted = getHeartedFromStorage();
      const index = hearted.indexOf(campaignId);
      if (index > -1) hearted.splice(index, 1);
      else hearted.push(campaignId);
      localStorage.setItem("hearted_campaigns", JSON.stringify(hearted));
      setHeartedIds([...hearted]);
      window.dispatchEvent(new Event("heartedCampaignsChanged"));
      return index === -1;
    },
    [user?.id, supabase, refreshHeartedIds]
  );

  const isCampaignHearted = useCallback(
    (campaignId: string) => heartedIds.includes(campaignId),
    [heartedIds]
  );

  return (
    <HeartedContext.Provider value={{ heartedIds, toggleHeart, isCampaignHearted, refreshHeartedIds }}>
      {children}
    </HeartedContext.Provider>
  );
}

export function useHearted() {
  const ctx = useContext(HeartedContext);
  if (ctx === undefined) throw new Error("useHearted must be used within HeartedProvider");
  return ctx;
}

/** Use useHearted() when inside HeartedProvider; otherwise fallback for SSR/legacy. */
export function getHeartedCampaignIds(): string[] {
  if (typeof window === "undefined") return [];
  return getHeartedFromStorage();
}

export async function toggleHeartCampaign(campaignId: string): Promise<boolean> {
  const hearted = getHeartedFromStorage();
  const index = hearted.indexOf(campaignId);
  if (index > -1) hearted.splice(index, 1);
  else hearted.push(campaignId);
  localStorage.setItem("hearted_campaigns", JSON.stringify(hearted));
  window.dispatchEvent(new Event("heartedCampaignsChanged"));
  return index === -1;
}

export function isCampaignHearted(campaignId: string): boolean {
  return getHeartedFromStorage().includes(campaignId);
}

export default function HeartedCampaigns({ isOpen, onClose }: HeartedCampaignsProps) {
  const { heartedIds, refreshHeartedIds } = useHearted();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      refreshHeartedIds();
      window.addEventListener("heartedCampaignsChanged", refreshHeartedIds);
      return () => window.removeEventListener("heartedCampaignsChanged", refreshHeartedIds);
    }
  }, [isOpen, refreshHeartedIds]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    fetchCampaignsFromAPI()
      .then((data) => {
        if (!cancelled) setCampaigns(data);
      })
      .catch(() => {
        if (!cancelled) setCampaigns([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const { toggleHeart } = useHearted();
  const heartedCampaigns = campaigns.filter((campaign) => heartedIds.includes(campaign.id));

  const handleRemoveHeart = (campaignId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleHeart(campaignId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              <h2 className="text-2xl font-medium text-gray-900">Hearted Campaigns</h2>
              {heartedCampaigns.length > 0 && (
                <span className="text-sm text-gray-500">({heartedCampaigns.length})</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            ) : heartedCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No hearted campaigns yet</p>
                <p className="text-gray-500 text-sm">Start exploring campaigns and heart the ones you love!</p>
                <Link
                  href="/campaigns"
                  onClick={onClose}
                  className="inline-block mt-4 bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
                >
                  Browse Campaigns
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {heartedCampaigns.map((campaign) => {
                  const progress = (campaign.raised / campaign.goal) * 100;
                  const progressPercentage = Math.min(progress, 100);

                  return (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      onClick={onClose}
                      className="block"
                    >
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-verified-500 hover:shadow-md transition-all flex flex-row h-40">
                        {/* Image */}
                        <div className="relative w-64 h-full bg-gray-200 flex-shrink-0">
                          {campaign.image ? (
                            <SafeImage
                              src={campaign.image}
                              alt={campaign.title}
                              fill
                              className="object-cover"
                              sizes="256px"
                              fallback={
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                                  <div className="text-primary-600 text-3xl font-bold">
                                    {campaign.title.charAt(0)}
                                  </div>
                                </div>
                              }
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                              <div className="text-primary-600 text-3xl font-bold">
                                {campaign.title.charAt(0)}
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                          <div className="absolute top-2 right-2 flex gap-2">
                            {campaign.verified && (
                              <div className="bg-verified-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleRemoveHeart(campaign.id, e)}
                            className="absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white transition-colors flex-shrink-0"
                            aria-label="Remove from hearted"
                          >
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2 line-clamp-1">
                              {campaign.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {campaign.description}
                            </p>
                          </div>

                          <div>
                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-primary-600">
                                  {formatCurrency(campaign.raised)}
                                </span>
                                <span className="text-gray-500">
                                  of {formatCurrency(campaign.goal)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{campaign.backers} backers</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{campaign.daysLeft} days left</span>
                              </div>
                              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                {campaign.category}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
