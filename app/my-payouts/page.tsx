"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, ArrowLeft, Loader2, CheckCircle2, Clock, XCircle, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

interface UserPayout {
  id: string;
  campaignId: string;
  campaignTitle: string;
  raised: number;
  bankName: string;
  accountType: string;
  accountLast4: string;
  status: string;
  createdAt: string;
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return s;
  }
}

export default function MyPayoutsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<UserPayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/my-payouts");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/my/payouts", { credentials: "include", cache: "no-store" });
        const data = (await res.json().catch(() => [])) as unknown;
        if (!cancelled && Array.isArray(data)) {
          setPayouts(data as UserPayout[]);
        }
      } catch {
        if (!cancelled) setPayouts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payouts...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completed = payouts.filter((p) => p.status === "completed");
  const nonCompleted = payouts.filter((p) => p.status !== "completed");

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Link
          href="/my-campaigns"
          className="hidden sm:inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View my campaigns
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Banknote className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900">My payouts</h1>
          <p className="text-gray-600 text-sm mt-1">
            View payout requests for your campaigns and payouts that have been completed.
          </p>
        </div>
      </div>

      {payouts.length === 0 ? (
        <div className="mt-6 bg-white rounded-xl gradient-border-1 p-6 md:p-8 text-center">
          <p className="text-gray-700 font-medium mb-1">No payout activity yet</p>
          <p className="text-gray-500 text-sm mb-4">
            Once your campaigns are fully funded and you request a payout, you&apos;ll see the details here.
          </p>
          <Link
            href="/my-campaigns"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            Go to My Campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Payout requests
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              These are payout requests you&apos;ve submitted for your fully funded campaigns.
            </p>
            {nonCompleted.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                You currently have no pending payout requests.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Campaign</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Requested on</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Amount</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Bank</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {nonCompleted.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2 align-top">
                          <div className="font-medium text-gray-900 line-clamp-2">{p.campaignTitle || "Campaign"}</div>
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-gray-600">
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-gray-700">
                          {formatCurrency(p.raised)}
                        </td>
                        <td className="px-4 py-2 align-top text-gray-600">
                          <div>{p.bankName}</div>
                          <div className="text-xs text-gray-500">
                            {p.accountType} · ****{p.accountLast4 || "----"}
                          </div>
                        </td>
                        <td className="px-4 py-2 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              p.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : p.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : p.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {p.status === "pending" && <Clock className="w-3 h-3" />}
                            {p.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                            {p.status === "rejected" && <XCircle className="w-3 h-3" />}
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-verified-600" />
              Completed payouts
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              Payouts that have been marked as completed appear here for your records.
            </p>
            {completed.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                You have no completed payouts yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Campaign</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Completed on</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Amount paid out</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Bank</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Invoice / Statement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completed.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2 align-top">
                          <div className="font-medium text-gray-900 line-clamp-2">{p.campaignTitle || "Campaign"}</div>
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-gray-600">
                          {formatDate(p.createdAt)}
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap text-gray-700">
                          {formatCurrency(p.raised)}
                        </td>
                        <td className="px-4 py-2 align-top text-gray-600">
                          <div>{p.bankName}</div>
                          <div className="text-xs text-gray-500">
                            {p.accountType} · ****{p.accountLast4 || "----"}
                          </div>
                        </td>
                        <td className="px-4 py-2 align-top whitespace-nowrap">
                          <a
                            href={`/api/my/payouts/${p.id}/payout-letter.pdf`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

