"use client";

import { useState, useEffect } from "react";
import { useThemedModal } from "@/components/ThemedModal";
import { Banknote, CheckCircle, Loader2 } from "lucide-react";

interface PayoutRow {
  id: string;
  campaignId: string;
  campaignTitle: string;
  raised: number;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  branch: string | null;
  status: string;
  createdAt: string;
}

function formatAmount(n: number) {
  return `BZ$${Number(n).toLocaleString()}`;
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return s;
  }
}

export default function AdminPayoutsPage() {
  const { alert } = useThemedModal();
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function loadPayouts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load payouts");
      const data = await res.json();
      const sorted = [...(data || [])].sort((a: PayoutRow, b: PayoutRow) => {
        const aPending = a.status === "pending" ? 1 : 0;
        const bPending = b.status === "pending" ? 1 : 0;
        if (bPending !== aPending) return bPending - aPending;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPayouts(sorted);
    } catch (err) {
      console.error("Error loading payouts:", err);
      setPayouts([]);
      alert("Failed to load payouts.", { title: "Error", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPayouts();
  }, []);

  async function handleComplete(id: string) {
    setCompletingId(id);
    try {
      const res = await fetch(`/api/admin/payouts/${id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to complete payout");
      }
      await loadPayouts();
      alert("Payout marked as completed. The creator has been notified by email and in-app.", {
        title: "Completed",
        variant: "success",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to complete payout";
      alert(msg, { title: "Error", variant: "error" });
    } finally {
      setCompletingId(null);
    }
  }

  const pendingCount = payouts.filter((p) => p.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-2">
            <Banknote className="w-8 h-8 text-primary-600" />
            Payouts
          </h1>
          <p className="text-gray-600 mt-1">
            {payouts.length} payout request{payouts.length !== 1 ? "s" : ""} total
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-700 font-medium">
                · {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {payouts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No payout requests yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : p.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {p.status === "pending" && "Pending"}
                        {p.status === "completed" && "Completed"}
                        {p.status === "processing" && "Processing"}
                        {p.status === "rejected" && "Rejected"}
                        {!["pending", "completed", "processing", "rejected"].includes(p.status) && p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900 font-medium">{p.campaignTitle || "—"}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                      {formatAmount(p.raised)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{p.creatorName || "—"}</div>
                      <div className="text-xs text-gray-500">{p.creatorEmail || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{p.bankName} · {p.accountType}</div>
                      <div className="text-xs text-gray-500">
                        {p.accountHolderName} · ****{String(p.accountNumber).slice(-4)}
                        {p.branch ? ` · ${p.branch}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {p.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleComplete(p.id)}
                          disabled={completingId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {completingId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Mark as completed
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
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
