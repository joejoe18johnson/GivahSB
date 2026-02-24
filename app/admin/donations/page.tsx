"use client";

import { useState, useEffect } from "react";
import { getDonationsCached, invalidateDonationsCache } from "@/lib/supabase/adminCache";
import { type AdminDonation } from "@/lib/adminData";
import { formatCurrency } from "@/lib/utils";
import { useThemedModal } from "@/components/ThemedModal";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 50;

export default function AdminDonationsPage() {
  const { user } = useAuth();
  const { alert } = useThemedModal();
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function loadDonations() {
    setIsLoading(true);
    try {
      const fetchedDonations = await getDonationsCached();
      const sorted = [...fetchedDonations].sort((a, b) => {
        // Pending first, then by newest date
        const aPending = a.status === "pending" ? 1 : 0;
        const bPending = b.status === "pending" ? 1 : 0;
        if (bPending !== aPending) return bPending - aPending;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setDonations(sorted);
    } catch (error) {
      console.error("Error loading donations:", error);
      setDonations([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  const totalPages = Math.max(1, Math.ceil(donations.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paginatedDonations = donations.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  async function handleApprove(donationId: string) {
    setApprovingId(donationId);
    try {
      if (!user) {
        throw new Error("You must be signed in to approve donations.");
      }
      const res = await fetch("/api/admin/approve-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ donationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Failed to approve donation.";
        const hint = typeof data.hint === "string" ? data.hint : "";
        const serverProj = data.serverProjectId;
        const clientProj = data.clientProjectId;
        const projectInfo =
          serverProj !== undefined || clientProj !== undefined
            ? ` Server project: ${serverProj ?? "(not set)"}. App project: ${clientProj ?? "(not set)"}.`
            : "";
        throw new Error(hint ? `${msg} ${hint}${projectInfo}` : msg + projectInfo);
      }
      invalidateDonationsCache();
      await loadDonations();
      alert("Donation approved. The campaign totals have been updated.", {
        title: "Approved",
        variant: "success",
      });
    } catch (error) {
      console.error("Error approving donation:", error);
      const message = error instanceof Error ? error.message : "Failed to approve donation.";
      alert(message, {
        title: "Could not approve",
        variant: "error",
      });
    } finally {
      setApprovingId(null);
    }
  }

  const totalCompleted = donations.filter((d) => d.status === "completed").reduce((sum, d) => sum + d.amount, 0);
  const totalPending = donations.filter((d) => d.status === "pending").reduce((sum, d) => sum + d.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">All Donations</h1>
          <p className="text-gray-600 mt-1">
            {donations.length} donations total
            {donations.length > 0 && (
              <> · Showing {start + 1}–{Math.min(start + PAGE_SIZE, donations.length)}</>
            )}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">Completed: <strong className="text-verified-600">{formatCurrency(totalCompleted)}</strong></span>
          <span className="text-gray-600">Pending: <strong className="text-amber-600">{formatCurrency(totalPending)}</strong></span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Ref</th>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Donor</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Anonymous</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-gray-500">
                    No donations yet
                  </td>
                </tr>
              ) : (
                paginatedDonations.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      {d.referenceNumber ? (
                        <Link href={`/campaigns/${d.campaignId}`} className="font-mono font-medium text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {d.referenceNumber}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono">{d.id}</td>
                    <td className="px-5 py-3 text-gray-600">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-900 max-w-[220px] truncate" title={d.campaignTitle}>{d.campaignTitle}</td>
                    <td className="px-5 py-3 text-gray-900">{d.anonymous ? "Anonymous" : d.donorName}</td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-[160px]">{d.anonymous ? "—" : d.donorEmail}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(d.amount)}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{d.method === "ekyash" ? "E-Kyash" : d.method.replace("-", " ")}</td>
                    <td className="px-5 py-3">{d.anonymous ? "Yes" : "No"}</td>
                    <td className="px-5 py-3">
                      <span className={d.status === "completed" ? "text-verified-600" : d.status === "pending" ? "text-amber-600" : "text-red-600"}>{d.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      {d.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(d.id)}
                          disabled={approvingId === d.id}
                          className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approvingId === d.id ? "Approving…" : "Approve"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {donations.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
