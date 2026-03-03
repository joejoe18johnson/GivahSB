"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign, Building2, Printer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

const BELIZE_BANKS = [
  "Atlantic Bank Limited",
  "Belize Bank Limited",
  "Heritage Bank Limited",
  "National Bank of Belize",
  "Scotiabank (Belize) Limited",
];

interface CampaignInfo {
  id: string;
  title: string;
  goal: number;
  raised: number;
}

interface PayoutRequestInfo {
  id: string;
  status: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  accountType?: string;
  branch?: string;
  createdAt: string;
}

function buildCreatorPayoutLetterHtml(campaign: CampaignInfo, payout: PayoutRequestInfo): string {
  const amount = formatCurrency(campaign.raised);
  const createdDate = new Date(payout.createdAt).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
  const maskedAccount = `****${String(payout.accountNumber).slice(-4)}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Payout confirmation – ${escapeHtml(campaign.title)}</title>
  <style>
    @page { size: letter; margin: 0.75in; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #111827;
      max-width: 8.5in;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo {
      height: 40px;
      width: auto;
    }
    .site-name {
      font-size: 14pt;
      font-weight: 700;
      color: #059669;
    }
    .tagline {
      font-size: 10pt;
      color: #4b5563;
    }
    .contact {
      text-align: right;
      font-size: 9pt;
      color: #4b5563;
    }
    .divider {
      border: 0;
      border-top: 2px solid #059669;
      margin: 0.25rem 0 1rem;
    }
    h1 { font-size: 16pt; margin-bottom: 0.5em; color: #111827; }
    .meta { margin: 1em 0; }
    .meta p { margin: 0.25em 0; }
    .amount { font-weight: 600; }
    .footer-note {
      margin-top: 1em;
      font-size: 9pt;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="brand">
      <img src="/givah-logo.png" alt="GivahBz" class="logo" />
      <div>
        <div class="site-name">GivahBz</div>
        <div class="tagline">Sharing Burdens. Together.</div>
      </div>
    </div>
    <div class="contact">
      <div>givahbz.com</div>
      <div>Belmopan City, Belize</div>
    </div>
  </header>
  <hr class="divider" />
  <h1>Payout confirmation</h1>
  <div class="meta">
    <p><strong>Campaign:</strong> ${escapeHtml(campaign.title)}</p>
    <p><strong>Amount paid out:</strong> <span class="amount">${escapeHtml(amount)}</span></p>
    <p><strong>Bank:</strong> ${escapeHtml(payout.bankName)}${payout.accountType ? " · " + escapeHtml(payout.accountType) : ""}</p>
    <p><strong>Account holder:</strong> ${escapeHtml(payout.accountHolderName)}</p>
    <p><strong>Account number:</strong> ${escapeHtml(maskedAccount)}${payout.branch ? " · Branch: " + escapeHtml(payout.branch) : ""}</p>
    <p><strong>Status:</strong> ${escapeHtml(payout.status)}</p>
    <p><strong>Payout requested:</strong> ${escapeHtml(createdDate)}</p>
  </div>
  <p>Thank you for using GivahBz to raise funds for your cause. This letter confirms that the payout for your campaign has been processed to the bank account details you provided.</p>
  <p class="footer-note">Generated from your GivahBz account. Default paper size: Letter (8.5&quot; × 11&quot;).</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function RequestPayoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const campaignId = typeof params.campaignId === "string" ? params.campaignId : "";
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [eligible, setEligible] = useState(false);
  const [payoutRequest, setPayoutRequest] = useState<PayoutRequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    accountType: "savings" as "savings" | "checking",
    accountNumber: "",
    accountHolderName: "",
    branch: "",
  });

  const handlePrintLetter = () => {
    if (!campaign || !payoutRequest || payoutRequest.status !== "completed") return;
    const html = buildCreatorPayoutLetterHtml(campaign, payoutRequest);
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      window.alert("Popup blocked. Please allow popups to print or save your payout letter.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?callbackUrl=/my-campaigns");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!campaignId || !user) return;
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/my/campaigns/${campaignId}/request-payout`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.status === 403 || res.status === 404) {
          if (!cancelled) setError(res.status === 403 ? "You can’t request payout for this campaign." : "Campaign not found.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Failed to load.");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setCampaign(data.campaign ?? null);
          setEligible(data.eligible ?? false);
          setPayoutRequest(data.payoutRequest ?? null);
        }
      } catch {
        if (!cancelled) setError("Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [campaignId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId || !form.bankName || !form.accountNumber || !form.accountHolderName) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/my/campaigns/${campaignId}/request-payout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: form.bankName,
          accountType: form.accountType,
          accountNumber: form.accountNumber,
          accountHolderName: form.accountHolderName,
          branch: form.branch || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to submit.");
        setSubmitting(false);
        return;
      }
      setSubmitSuccess(true);
      setPayoutRequest({
        id: data.id,
        status: "pending",
        bankName: form.bankName,
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        accountType: form.accountType,
        branch: form.branch || undefined,
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError("Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Link
        href="/my-campaigns"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Campaigns
      </Link>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-600">Loading…</p>
        </div>
      ) : error && !campaign ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">{error}</p>
          <Link href="/my-campaigns" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
            Return to My Campaigns
          </Link>
        </div>
      ) : campaign ? (
        <>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">Request Payout</h1>
          <p className="text-gray-600 mb-8">{campaign.title}</p>

          <div className="bg-verified-50 border border-verified-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-verified-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-verified-800">Amount to be paid out</p>
              <p className="text-verified-700">{formatCurrency(campaign.raised)}</p>
            </div>
          </div>

          {!eligible ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <p className="text-amber-800 font-medium">This campaign has not reached its funding goal yet.</p>
              <p className="text-amber-700 text-sm mt-1">
                Payout is available when the campaign is fully funded ({formatCurrency(campaign.raised)} / {formatCurrency(campaign.goal)}).
              </p>
              <Link href="/my-campaigns" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
                Back to My Campaigns
              </Link>
            </div>
          ) : payoutRequest || submitSuccess ? (
            <div className="bg-white rounded-xl gradient-border-1 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 text-verified-600 mb-4">
                <Building2 className="w-8 h-8" />
                <h2 className="text-xl font-semibold">Payout request submitted</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Your request to deposit {formatCurrency(campaign.raised)} to your Belize bank account has been received.
              </p>
              {payoutRequest && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Bank:</span> {payoutRequest.bankName}</p>
                  <p><span className="font-medium">Account holder:</span> {payoutRequest.accountHolderName}</p>
                  <p><span className="font-medium">Account number:</span> {payoutRequest.accountNumber}</p>
                  {payoutRequest.accountType && (
                    <p><span className="font-medium">Account type:</span> <span className="capitalize">{payoutRequest.accountType}</span></p>
                  )}
                  {payoutRequest.branch && (
                    <p><span className="font-medium">Branch:</span> {payoutRequest.branch}</p>
                  )}
                  <p><span className="font-medium">Status:</span> <span className="capitalize">{payoutRequest.status}</span></p>
                </div>
              )}
              {payoutRequest?.status === "completed" ? (
                <>
                  <p className="text-gray-500 text-sm mt-4">
                    Your payout has been completed. You can print or save a copy of this payout confirmation for your records.
                  </p>
                  <button
                    type="button"
                    onClick={handlePrintLetter}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                  >
                    <Printer className="w-4 h-4" />
                    Print / save payout letter
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-sm mt-4">
                  We will process your payout and notify you when it is completed. A printable payout letter will be available here once it is marked as completed. Contact support if you have questions.
                </p>
              )}
              <Link
                href="/my-campaigns"
                className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
              >
                Back to My Campaigns
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl gradient-border-1 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Where to deposit the money</h2>
                <p className="text-sm text-gray-600 mt-1">Select your bank in Belize and enter the account details.</p>
              </div>
              <div className="p-5 md:p-6 space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bank <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="bankName"
                    required
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 text-gray-900"
                  >
                    <option value="">Select a bank in Belize</option>
                    {BELIZE_BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Account type
                  </label>
                  <select
                    id="accountType"
                    value={form.accountType}
                    onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value as "savings" | "checking" }))}
                    className="w-full px-4 py-2.5 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 text-gray-900"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Account number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    required
                    value={form.accountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 text-gray-900"
                    placeholder="e.g. 1234567890"
                  />
                </div>
                <div>
                  <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Account holder name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="accountHolderName"
                    type="text"
                    required
                    value={form.accountHolderName}
                    onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 text-gray-900"
                    placeholder="Full name as on the account"
                  />
                </div>
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Branch <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={form.branch}
                    onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 text-gray-900"
                    placeholder="e.g. Belize City Main"
                  />
                </div>
              </div>
              <div className="px-5 md:p-6 pt-0 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting…" : "Submit payout request"}
                </button>
                <Link
                  href="/my-campaigns"
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </>
      ) : null}
    </div>
  );
}
