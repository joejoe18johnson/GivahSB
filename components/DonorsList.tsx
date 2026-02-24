"use client";

import { useState, useMemo, useEffect } from "react";
import { type AdminDonation } from "@/lib/adminData";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

interface DonorsListProps {
  campaignId: string;
}

type SortBy = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const INITIAL_DISPLAY_COUNT = 5;

export default function DonorsList({ campaignId }: DonorsListProps) {
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDonations() {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/donations`, { cache: "no-store" });
        const fetchedDonations = res.ok ? await res.json() : [];
        setDonations((fetchedDonations as AdminDonation[]).filter((d) => d.status === "completed"));
      } catch (error) {
        console.error("Error loading donations:", error);
        setDonations([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadDonations();
  }, [campaignId]);

  const sortedDonations = useMemo(() => {
    let filtered = [...donations];

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "date-asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "amount-desc") {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });

    return filtered;
  }, [donations, sortBy]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Donors</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
            aria-label="Toggle sort"
          >
            <Filter className="w-4 h-4" />
            Sort By
          </button>
        </div>
      </div>

      {/* Sort */}
      {showFilters && (
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white text-gray-900"
              style={{ color: '#111827' }}
            >
              <option value="date-desc" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Newest first</option>
              <option value="date-asc" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Oldest first</option>
              <option value="amount-desc" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Highest amount</option>
              <option value="amount-asc" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Lowest amount</option>
            </select>
          </div>
        </div>
      )}

      {/* Donors List */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="px-5 py-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
            <p>Loading donors...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500">
            <p>No donors yet. Be the first to support this campaign!</p>
          </div>
        ) : (
          <>
            {(showAll ? sortedDonations : sortedDonations.slice(0, INITIAL_DISPLAY_COUNT)).map((donation) => (
              <div key={donation.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {donation.anonymous ? "Anonymous Donor" : donation.donorName}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatRelativeTime(donation.createdAt)}
                    </p>
                    {donation.note && (
                      <p className="text-sm text-gray-600 mt-2 italic">&ldquo;{donation.note}&rdquo;</p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(donation.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {donations.length > INITIAL_DISPLAY_COUNT && (
              <div className="px-5 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {donations.length - INITIAL_DISPLAY_COUNT} More
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {sortedDonations.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          {sortedDonations.length} {sortedDonations.length === 1 ? "donor" : "donors"}
        </div>
      )}
    </div>
  );
}
