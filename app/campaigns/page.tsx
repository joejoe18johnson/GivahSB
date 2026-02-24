"use client";

import Link from "next/link";
import CampaignCard from "@/components/CampaignCard";
import { Campaign } from "@/lib/data";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

function CampaignsContent() {
  const categories = ["All", "Medical expenses", "Educational support", "Disaster recovery", "Other"];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showTrending, setShowTrending] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const filterParam = searchParams.get("filter");

  useEffect(() => {
    if (filterParam === "trending") {
      setShowTrending(true);
      setSelectedCategory("All");
    } else {
      setShowTrending(false);
    }
  }, [filterParam]);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        setError(null);
        const trending = filterParam === "trending";
        const fetchedCampaigns = await fetchCampaignsFromAPI(trending ? { trending: true } : undefined);
        setCampaigns(fetchedCampaigns);
      } catch (err) {
        console.error("Error loading campaigns:", err);
        setError("Unable to load campaigns. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, [filterParam]);

  let filteredCampaigns =
    selectedCategory === "All"
      ? campaigns
      : campaigns.filter((c) => c.category === selectedCategory);

  // Apply search filter (title, description, creator, category)
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredCampaigns = filteredCampaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.fullDescription?.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.location?.toLowerCase().includes(q) ?? false)
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-medium">
          {searchQuery ? (
            `Search results for "${searchQuery}"`
          ) : showTrending ? (
            <span className="flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-primary-600" />
              Top Campaigns
            </span>
          ) : (
            "All Campaigns"
          )}
        </h1>
        {showTrending && (
          <button
            onClick={() => router.push("/campaigns")}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Campaigns
          </button>
        )}
      </div>

      {/* Category Filter */}
      {!showTrending && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? "bg-success-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {showTrending && (
        <p className="text-gray-600 mb-6">
          Campaigns that are 60% or more funded and still gaining support. Fully funded campaigns are in Success Stories.
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Campaigns Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="relative">
              {showTrending && (
                <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                  <TrendingUp className="w-3 h-3" />
                  TRENDING
                </div>
              )}
              <CampaignCard campaign={campaign} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            {searchQuery
              ? `No campaigns found for "${searchQuery}". Try a different search or browse all campaigns.`
              : "No campaigns found in this category."}
          </p>
          {searchQuery && (
            <Link
              href="/campaigns"
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium underline"
            >
              View all campaigns
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    }>
      <CampaignsContent />
    </Suspense>
  );
}
