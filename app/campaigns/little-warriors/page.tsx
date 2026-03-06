"use client";

import Link from "next/link";
import CampaignCard from "@/components/CampaignCard";
import { Campaign } from "@/lib/data";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import { useState, useEffect, Suspense } from "react";
import { Baby } from "lucide-react";

const LITTLE_WARRIORS_RE = /baby|child|children|infant|pediatric|toddler|newborn|kids/i;

function LittleWarriorsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        setError(null);
        const fetchedCampaigns = await fetchCampaignsFromAPI({ excludeFullyFunded: true });
        setCampaigns(fetchedCampaigns);
      } catch (err) {
        console.error("Error loading campaigns:", err);
        setError("Unable to load campaigns. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  const littleWarriorsCampaigns = campaigns.filter(
    (c) =>
      LITTLE_WARRIORS_RE.test(c.title) ||
      LITTLE_WARRIORS_RE.test(c.description) ||
      LITTLE_WARRIORS_RE.test(c.fullDescription || "")
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-4xl font-medium">
            <span className="bg-gradient-to-r from-pink-500 via-blue-500 to-pink-600 dark:from-pink-400 dark:via-blue-400 dark:to-pink-500 bg-clip-text text-transparent">
              Little Warriors
            </span>
          </h1>
          <div className="bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0">
            <Baby className="w-3.5 h-3.5" />
            BABIES & CHILDREN
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-4">
          This section is dedicated to babies and children bravely fighting medical challenges. Your support can help provide life-saving treatments, surgeries, medication, and care for these little warriors and their families during difficult times.
        </p>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          View All Campaigns →
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading campaigns...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="text-center py-16">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Campaigns Grid - same layout as campaigns page */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {littleWarriorsCampaigns.map((campaign) => (
            <div key={campaign.id} className="relative">
              <CampaignCard campaign={campaign} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && littleWarriorsCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Baby className="w-12 h-12 mx-auto mb-4 text-pink-300 dark:text-pink-600" />
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            No Little Warriors campaigns yet. Campaigns for babies and children will appear here when available.
          </p>
          <Link
            href="/campaigns"
            className="inline-block bg-gradient-to-r from-pink-500 to-blue-500 hover:opacity-90 text-white px-6 py-2.5 rounded-full font-medium transition-opacity"
          >
            View All Campaigns
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LittleWarriorsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      }
    >
      <LittleWarriorsContent />
    </Suspense>
  );
}
