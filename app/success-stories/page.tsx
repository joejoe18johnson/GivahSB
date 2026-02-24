"use client";

import CampaignCard from "@/components/CampaignCard";
import SafeImage from "@/components/SafeImage";
import { Campaign } from "@/lib/data";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function SuccessStoriesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const fullyFunded = await fetchCampaignsFromAPI({ onlyFullyFunded: true });
        setCampaigns(fullyFunded);
      } catch (err) {
        console.error("Error loading success stories:", err);
        setError("Unable to load campaigns. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-medium flex items-center gap-3 text-gray-900">
          <Trophy className="w-10 h-10 text-verified-600" />
          Success Stories
        </h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Campaigns that reached their full funding goal thanks to our community. Celebrate their success and get inspired.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-800">{error}</p>
          <Link href="/campaigns" className="inline-block mt-4 text-primary-600 font-medium hover:underline">
            Browse all campaigns
          </Link>
        </div>
      )}

      {!isLoading && !error && campaigns.length === 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No success stories yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            When campaigns reach their full funding goal, they’ll appear here. Be the first to help a campaign get fully funded.
          </p>
          <Link
            href="/campaigns"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
          >
            Browse campaigns
          </Link>
        </div>
      )}

      {!isLoading && !error && campaigns.length > 0 && (
        <>
          {/* Mobile only: horizontal cards in a list */}
          <ul className="md:hidden flex flex-col gap-4 list-none p-0 m-0">
            {campaigns.map((campaign) => {
              const goal = Number(campaign.goal) || 1;
              const raised = Number(campaign.raised) || 0;
              const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 100;
              return (
                <li key={campaign.id}>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="flex flex-row rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:border-verified-500 hover:shadow-md transition-all"
                  >
                    <div className="relative w-32 sm:w-40 flex-shrink-0 aspect-square bg-gray-200">
                      {campaign.image ? (
                        <SafeImage
                          src={campaign.image}
                          alt={campaign.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 128px, 160px"
                          fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-semibold">
                              {campaign.title.charAt(0)}
                            </div>
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-semibold">
                          {campaign.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 p-4 justify-center">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {(campaign.backers ?? 0).toLocaleString()} donations
                      </p>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mt-1">
                        {campaign.title}
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                        <div
                          className="bg-verified-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        {formatCurrency(raised)} raised
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop: vertical cards in a grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {campaigns.map((campaign) => (
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
