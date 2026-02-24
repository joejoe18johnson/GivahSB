"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { Campaign } from "@/lib/data";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import CampaignCard from "@/components/CampaignCard";
import { getHeartedCampaignIds } from "@/components/HeartedCampaigns";
import { useAuth } from "@/contexts/AuthContext";

export default function LikedCampaignsPage() {
  const [heartedIds, setHeartedIds] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        // Load all campaigns from API (Supabase)
        const fetchedCampaigns = await fetchCampaignsFromAPI();
        setCampaigns(fetchedCampaigns);
        
        // Load hearted campaign IDs
        if (user) {
          // TODO: Load from Supabase profile/hearts
          setHeartedIds(getHeartedCampaignIds());
        } else {
          setHeartedIds(getHeartedCampaignIds());
        }
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    
    // Listen for changes
    const handleChange = () => {
      setHeartedIds(getHeartedCampaignIds());
    };
    window.addEventListener("heartedCampaignsChanged", handleChange);
    return () => {
      window.removeEventListener("heartedCampaignsChanged", handleChange);
    };
  }, [user]);

  const heartedCampaigns = campaigns.filter((campaign) => heartedIds.includes(campaign.id));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <div>
            <h1 className="text-3xl md:text-4xl font-medium text-gray-900">Liked Campaigns</h1>
            {heartedCampaigns.length > 0 && (
              <p className="text-gray-600 mt-1">{heartedCampaigns.length} {heartedCampaigns.length === 1 ? "campaign" : "campaigns"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      ) : heartedCampaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No liked campaigns yet</p>
          <p className="text-gray-500 text-sm mb-6">Start exploring campaigns and heart the ones you love!</p>
          <Link
            href="/campaigns"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal carousel */}
          <div className="md:hidden -mx-4 px-4 mb-6">
            <div className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide">
              <div className="flex gap-4 pb-2">
                {heartedCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex-shrink-0 w-[85vw] max-w-[340px] snap-center snap-always"
                  >
                    <CampaignCard campaign={campaign} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {heartedCampaigns.map((campaign) => (
              <div key={campaign.id}>
                <CampaignCard campaign={campaign} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
