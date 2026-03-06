/**
 * Email helpers using Resend.
 *
 * All functions are safe to call in any environment:
 * - If RESEND_API_KEY is missing, they log the intended email and return.
 * - They never throw errors to the caller; failures are logged to stderr.
 *
 * NOTE: These run on the server only (API routes / server components).
 */

import { SITE_URL } from "@/lib/siteConfig";

type ResendEmailRecipient = string | string[];

interface BaseEmailParams {
  to: ResendEmailRecipient;
  subject: string;
  html: string;
}

/** Base URL for email images. Use production domain so logos/banners load in email clients. */
function getEmailAssetBase(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.givahbz.com").trim().replace(/\/$/, "");
  return base.startsWith("http") ? base : `https://${base}`;
}

/** Wrap email body HTML with branded layout: banner, logo, and consistent styling. Uses direct image URLs so they render in email clients. */
function wrapEmailWithLayout(bodyHtml: string): string {
  const base = getEmailAssetBase();
  const logoUrl = `${base}/givah-logo.png`;
  const bannerUrl = `${base}/Givah-Banner.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Givah</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #374151;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Banner: direct URL + fallback bar when images blocked -->
          <tr>
            <td align="center" style="background-color:#1FA84A; padding:0; line-height:0; min-height:120px;">
              <img src="${bannerUrl}" alt="GivahBZ" width="600" height="120" style="display:block; width:100%; max-width:600px; height:auto; border:0; outline:none; text-decoration:none;" />
            </td>
          </tr>
          <!-- Logo: direct URL -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <a href="${base}" style="text-decoration: none;">
                <img src="${logoUrl}" alt="GivahBZ" width="180" height="54" style="display:block; width:180px; height:auto; border:0; outline:none; text-decoration:none;" />
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 8px 24px 24px 24px;">
${bodyHtml.trim()}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              This email was sent by Givah. &copy; ${new Date().getFullYear()} GivahBz.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmailViaResend(params: BaseEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";

  const toArray = Array.isArray(params.to) ? params.to.filter(Boolean) : [params.to].filter(Boolean);
  if (!toArray.length) return;

  const html = wrapEmailWithLayout(params.html);

  if (!apiKey) {
    // In dev / missing configuration, just log instead of failing.
    console.log("[email] (no RESEND_API_KEY) would send:", {
      from,
      to: toArray,
      subject: params.subject,
      htmlPreview: html.slice(0, 300),
    });
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: toArray,
        subject: params.subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[email] Resend error:", res.status, text);
    }
  } catch (err) {
    console.error("[email] sendEmailViaResend:", err);
  }
}

// Payout completed (creator)

export interface PayoutCompletedEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
  amount: string;
}

/** Send "payout completed" email to the campaign creator. */
export async function sendPayoutCompletedEmail(params: PayoutCompletedEmailParams): Promise<void> {
  const { to, creatorName, campaignTitle, amount } = params;
  if (!to) return;

  await sendEmailViaResend({
    to,
    subject: `Payout completed: ${campaignTitle}`,
    html: `
      <p>Hi ${creatorName || "there"},</p>
      <p>Your payout of <strong>${amount}</strong> for the campaign &quot;${campaignTitle}&quot; has been completed.</p>
      <p>You can view details anytime from your My Payouts section.</p>
      <p>Thank you for using Givah.</p>
    `,
  });
}

// Payout requested (notify admins)

export interface PayoutRequestedEmailToAdminsParams {
  to: string[];
  campaignTitle: string;
  amount: string;
  creatorName: string;
}

export async function sendPayoutRequestedEmailToAdmins(
  params: PayoutRequestedEmailToAdminsParams
): Promise<void> {
  const { to, campaignTitle, amount, creatorName } = params;
  if (!to?.length) return;

  await sendEmailViaResend({
    to,
    subject: `Payout requested: ${campaignTitle}`,
    html: `
      <p>Hello,</p>
      <p><strong>${creatorName || "A creator"}</strong> has requested a payout of <strong>${amount}</strong> for the campaign &quot;${campaignTitle}&quot;.</p>
      <p>You can review and complete this payout from the admin dashboard.</p>
    `,
  });
}

// Verification approvals / rejections

export interface VerificationApprovedEmailParams {
  to: string;
  name: string;
  item: "phone" | "id" | "address";
}

export async function sendVerificationApprovedEmail(
  params: VerificationApprovedEmailParams
): Promise<void> {
  const { to, name, item } = params;
  if (!to) return;

  const label =
    item === "phone" ? "phone number" : item === "id" ? "identity document" : "address document";

  await sendEmailViaResend({
    to,
    subject: `Verification approved: your ${label}`,
    html: `
      <p>Hi ${name || "there"},</p>
      <p>Your ${label} has been verified and approved. You can now use it for campaign verification on Givah.</p>
      <p>Thank you for helping us keep the community safe and trusted.</p>
    `,
  });
}

export interface VerificationRejectedEmailParams {
  to: string;
  name: string;
  item: "id" | "address";
  reason?: string;
}

export async function sendVerificationRejectedEmail(
  params: VerificationRejectedEmailParams
): Promise<void> {
  const { to, name, item, reason } = params;
  if (!to) return;

  const label = item === "id" ? "identity document" : "address document";
  const reasonText = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";

  await sendEmailViaResend({
    to,
    subject: `Verification not approved: your ${label}`,
    html: `
      <p>Hi ${name || "there"},</p>
      <p>Your ${label} could not be approved.</p>
      ${reasonText}
      <p>You can upload a new document from your Verification Center in your account.</p>
    `,
  });
}

// Campaign approval / rejection

export interface CampaignApprovedEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
}

export async function sendCampaignApprovedEmail(
  params: CampaignApprovedEmailParams
): Promise<void> {
  const { to, creatorName, campaignTitle } = params;
  if (!to) return;

  await sendEmailViaResend({
    to,
    subject: `Your campaign is live: ${campaignTitle}`,
    html: `
      <p>Hi ${creatorName || "there"},</p>
      <p>Your campaign &quot;${campaignTitle}&quot; has been approved and is now live on Givah.</p>
      <p>You can share your campaign link with supporters and track donations from your My Campaigns dashboard.</p>
    `,
  });
}

export interface CampaignRejectedEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
}

export async function sendCampaignRejectedEmail(
  params: CampaignRejectedEmailParams
): Promise<void> {
  const { to, creatorName, campaignTitle } = params;
  if (!to) return;

  await sendEmailViaResend({
    to,
    subject: `Campaign not approved: ${campaignTitle}`,
    html: `
      <p>Hi ${creatorName || "there"},</p>
      <p>Your campaign &quot;${campaignTitle}&quot; could not be approved and will not go live.</p>
      <p>You can submit a new campaign from your My Campaigns page if you wish, making sure to include clear details and proof of need.</p>
    `,
  });
}

// Campaign submitted for review (creator confirmation)

export interface CampaignSubmittedForReviewEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
}

export async function sendCampaignSubmittedForReviewEmail(
  params: CampaignSubmittedForReviewEmailParams
): Promise<void> {
  const { to, creatorName, campaignTitle } = params;
  if (!to) return;

  await sendEmailViaResend({
    to,
    subject: `Campaign submitted for review: ${campaignTitle}`,
    html: `
      <p>Hi ${creatorName || "there"},</p>
      <p>Your campaign &quot;${campaignTitle}&quot; has been submitted for review. Our team will look at it and get back to you once it&apos;s approved.</p>
      <p>You can check the status from your My Campaigns page.</p>
    `,
  });
}

// Campaign goal reached (creator)

export interface CampaignGoalReachedEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
  goal: number;
  raised: number;
}

export async function sendCampaignGoalReachedEmail(
  params: CampaignGoalReachedEmailParams
): Promise<void> {
  const { to, creatorName, campaignTitle, goal, raised } = params;
  if (!to) return;

  const format = (n: number) => `BZ$${Number(n || 0).toLocaleString()}`;

  await sendEmailViaResend({
    to,
    subject: `Goal reached: ${campaignTitle}`,
    html: `
      <p>Hi ${creatorName || "there"},</p>
      <p>Congratulations! Your campaign &quot;${campaignTitle}&quot; has reached its fundraising goal.</p>
      <p><strong>Goal:</strong> ${format(goal)}<br/><strong>Raised:</strong> ${format(raised)}</p>
      <p>You can now request a payout from your My Campaigns page.</p>
    `,
  });
}

// Creator: someone donated to your campaign (after admin approval)

export interface DonationReceivedEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
  amount: number;
  donorDisplay: string;
  status: "pending" | "completed";
}

export async function sendDonationReceivedEmail(
  params: DonationReceivedEmailParams
): Promise<void> {
  const { to, creatorName, campaignTitle, amount, donorDisplay } = params;
  if (!to) return;

  const amountStr = `BZ$${Number(amount || 0).toLocaleString()}`;

  await sendEmailViaResend({
    to,
    subject: `New donation to ${campaignTitle}`,
    html: `
      <p>Hi ${creatorName || "there"},</p>
      <p><strong>${donorDisplay}</strong> donated ${amountStr} to your campaign &quot;${campaignTitle}&quot;.</p>
      <p>Thank you for using Givah to make a difference.</p>
    `,
  });
}

// Donor: your donation was approved

export interface DonationApprovedEmailParams {
  to: string;
  donorName: string;
  campaignTitle: string;
  amount: number;
}

export async function sendDonationApprovedEmail(
  params: DonationApprovedEmailParams
): Promise<void> {
  const { to, donorName, campaignTitle, amount } = params;
  if (!to) return;

  const amountStr = `BZ$${Number(amount || 0).toLocaleString()}`;

  await sendEmailViaResend({
    to,
    subject: `Donation confirmed: ${campaignTitle}`,
    html: `
      <p>Hi ${donorName || "there"},</p>
      <p>Your donation of <strong>${amountStr}</strong> to &quot;${campaignTitle}&quot; has been confirmed and is now complete.</p>
      <p>Thank you for supporting our community.</p>
    `,
  });
}

// Donor-facing: donation receipt (single donation)

export interface DonationReceiptEmailParams {
  to: string;
  donorName: string;
  campaignTitle: string;
  amount: number;
  method: "bank" | "digiwallet" | "ekyash";
  referenceNumber?: string;
  note?: string;
  status: "pending" | "completed";
}

export async function sendDonationReceiptEmail(
  params: DonationReceiptEmailParams
): Promise<void> {
  const { to, donorName, campaignTitle, amount, method, referenceNumber, note, status } = params;
  if (!to) return;

  const amountStr = `BZ$${Number(amount || 0).toLocaleString()}`;
  const methodLabel =
    method === "digiwallet" ? "DigiWallet" : method === "ekyash" ? "E-Kyash" : "Bank transfer";
  const statusLabel = status === "completed" ? "Completed" : "Pending";
  const refLine = referenceNumber
    ? `<p><strong>Reference #:</strong> ${referenceNumber}</p>`
    : "";
  const noteLine = note ? `<p><strong>Note from you:</strong> ${note}</p>` : "";

  await sendEmailViaResend({
    to,
    subject: `Thank you for your donation to ${campaignTitle}`,
    html: `
      <p>Hi ${donorName || "there"},</p>
      <p>Thank you for your generous donation to &quot;${campaignTitle}&quot; on Givah.</p>
      <p>
        <strong>Amount:</strong> ${amountStr}<br/>
        <strong>Method:</strong> ${methodLabel}<br/>
        <strong>Status:</strong> ${statusLabel}
      </p>
      ${refLine}
      ${noteLine}
      <p>This email serves as a record of your contribution. Please keep it for your records.</p>
      <p>Thank you for supporting our community.</p>
    `,
  });
}

// Monthly payout summary (helper; can be called from a scheduled job)

export interface MonthlyPayoutSummaryEmailParams {
  to: string;
  creatorName: string;
  monthLabel: string; // e.g. "February 2026"
  totalAmount: number;
  campaigns: { title: string; amount: number }[];
}

export async function sendMonthlyPayoutSummaryEmail(
  params: MonthlyPayoutSummaryEmailParams
): Promise<void> {
  const { to, creatorName, monthLabel, totalAmount, campaigns } = params;
  if (!to) return;

  const format = (n: number) => `BZ$${Number(n || 0).toLocaleString()}`;
  const rows =
    campaigns && campaigns.length
      ? campaigns
          .map(
            (c) =>
              `<tr><td style="padding:4px 8px;">${c.title}</td><td style="padding:4px 8px; text-align:right;">${format(
                c.amount
              )}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="2" style="padding:4px 8px; text-align:center; color:#6b7280;">No payouts this month.</td></tr>`;

  await sendEmailViaResend({
    to,
    subject: `Your Givah payout summary for ${monthLabel}`,
    html: `
      <p>Hi ${creatorName || "there"},</p>
      <p>Here is your payout summary for <strong>${monthLabel}</strong> on Givah.</p>
      <table style="border-collapse:collapse; width:100%; max-width:480px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:4px 8px;">Campaign</th>
            <th style="text-align:right; padding:4px 8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td style="padding:6px 8px; text-align:left; font-weight:bold;">Total</td>
            <td style="padding:6px 8px; text-align:right; font-weight:bold;">${format(
              totalAmount
            )}</td>
          </tr>
        </tfoot>
      </table>
      <p>Thank you for using Givah to support real needs in our community.</p>
    `,
  });
}

