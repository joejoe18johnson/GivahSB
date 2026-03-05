/**
 * Email helpers using Resend.
 *
 * All functions are safe to call in any environment:
 * - If RESEND_API_KEY is missing, they log the intended email and return.
 * - They never throw errors to the caller; failures are logged to stderr.
 *
 * NOTE: These run on the server only (API routes / server components).
 */

type ResendEmailRecipient = string | string[];

interface BaseEmailParams {
  to: ResendEmailRecipient;
  subject: string;
  html: string;
}

async function sendEmailViaResend(params: BaseEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEnv = process.env.EMAIL_FROM ?? "noreply@example.com";
  // Some users accidentally configure multiple addresses (e.g. "a@example.com,b@example.com").
  // Resend requires a single from address, optionally with a name, so we take the first entry.
  const from = fromEnv.split(",")[0].trim();

  const toArray = Array.isArray(params.to) ? params.to.filter(Boolean) : [params.to].filter(Boolean);
  if (!toArray.length) return;

  if (!apiKey) {
    // In dev / missing configuration, just log instead of failing.
    console.log("[email] (no RESEND_API_KEY) would send:", {
      from,
      to: toArray,
      subject: params.subject,
      htmlPreview: params.html.slice(0, 300),
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
        html: params.html,
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

/** Base URL for email assets (banner, logo). Use absolute URL for email clients. */
function getEmailBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.givahbz.com";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;
}

/** Givah green (matches success-600). */
const EMAIL_BRAND_GREEN = "#16ac4b";
const EMAIL_BRAND_GREEN_HOVER = "#128a3c";

/**
 * Wraps email body HTML in the standard Givah layout:
 * - Banner at top (Givah-Banner.png)
 * - Givah logo, centered
 * - Body content centered (max-width 560px)
 * - Green "Learn More About GivahBZ" button at bottom
 */
function wrapEmailWithTemplate(bodyHtml: string): string {
  const base = getEmailBaseUrl();
  const bannerUrl = `${base}/Givah-Banner.png`;
  const logoUrl = `${base}/givah-logo.png`;
  const learnMoreUrl = base;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GivahBz</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background-color:#ffffff;">
          <!-- Banner -->
          <tr>
            <td align="center" style="padding:0; line-height:0;">
              <img src="${bannerUrl}" alt="GivahBz" width="600" style="display:block; width:100%; max-width:600px; height:auto;" />
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:24px 24px 16px;">
              <img src="${logoUrl}" alt="GivahBz" width="140" height="40" style="display:inline-block; width:140px; height:auto;" />
            </td>
          </tr>
          <!-- Body content (centered) -->
          <tr>
            <td align="center" style="padding:0 32px 24px; text-align:center;">
              <div style="max-width:560px; margin:0 auto; text-align:center; color:#111827; font-size:16px; line-height:1.6;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <!-- Learn More button -->
          <tr>
            <td align="center" style="padding:24px 32px 32px;">
              <a href="${learnMoreUrl}" style="display:inline-block; background-color:${EMAIL_BRAND_GREEN}; color:#ffffff !important; text-decoration:none; font-weight:600; font-size:16px; padding:14px 28px; border-radius:9999px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">Learn More About GivahBZ</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${creatorName || "there"},</p>
      <p style="margin:0 0 1em;">Your payout of <strong>${amount}</strong> for the campaign &quot;${campaignTitle}&quot; has been completed.</p>
      <p style="margin:0 0 1em;">You can view details anytime from your My Payouts section.</p>
      <p style="margin:0;">Thank you for using Givah.</p>
    `),
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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hello,</p>
      <p style="margin:0 0 1em;"><strong>${creatorName || "A creator"}</strong> has requested a payout of <strong>${amount}</strong> for the campaign &quot;${campaignTitle}&quot;.</p>
      <p style="margin:0;">You can review and complete this payout from the admin dashboard.</p>
    `),
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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${name || "there"},</p>
      <p style="margin:0 0 1em;">Your ${label} has been verified and approved. You can now use it for campaign verification on Givah.</p>
      <p style="margin:0;">Thank you for helping us keep the community safe and trusted.</p>
    `),
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
  const reasonBlock = reason
    ? `<p style="margin:0 0 1em;"><strong>Reason:</strong> ${reason}</p>`
    : "";

  await sendEmailViaResend({
    to,
    subject: `Verification not approved: your ${label}`,
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${name || "there"},</p>
      <p style="margin:0 0 1em;">Your ${label} could not be approved.</p>
      ${reasonBlock}
      <p style="margin:0;">You can upload a new document from your Verification Center in your account.</p>
    `),
  });
}

// Campaign submitted for review (creator)

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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${creatorName || "there"},</p>
      <p style="margin:0 0 1em;">Your campaign &quot;${campaignTitle}&quot; has been submitted for review.</p>
      <p style="margin:0 0 1em;">Our team will review it and you will receive a follow-up email once it has been approved or if we need any changes.</p>
      <p style="margin:0;">You can check the status from your My Campaigns page.</p>
    `),
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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${creatorName || "there"},</p>
      <p style="margin:0 0 1em;">Your campaign &quot;${campaignTitle}&quot; has been approved and is now live on Givah.</p>
      <p style="margin:0;">You can share your campaign link with supporters and track donations from your My Campaigns dashboard.</p>
    `),
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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${creatorName || "there"},</p>
      <p style="margin:0 0 1em;">Your campaign &quot;${campaignTitle}&quot; could not be approved and will not go live.</p>
      <p style="margin:0;">You can submit a new campaign from your My Campaigns page if you wish, making sure to include clear details and proof of need.</p>
    `),
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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${creatorName || "there"},</p>
      <p style="margin:0 0 1em;">Congratulations! Your campaign &quot;${campaignTitle}&quot; has reached its fundraising goal.</p>
      <p style="margin:0 0 1em;"><strong>Goal:</strong> ${format(goal)}<br/><strong>Raised:</strong> ${format(raised)}</p>
      <p style="margin:0;">You can now request a payout from your My Campaigns page.</p>
    `),
  });
}

// Creator-facing: someone donated to your campaign

export interface DonationReceivedEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
  amount: number;
  /** "Anonymous" or donor name (never expose donor email to creator). */
  donorDisplay: string;
  status: "pending" | "completed";
}

export async function sendDonationReceivedEmail(
  params: DonationReceivedEmailParams
): Promise<void> {
  const { to, creatorName, campaignTitle, amount, donorDisplay, status } = params;
  if (!to) return;

  const amountStr = `BZ$${Number(amount || 0).toLocaleString()}`;
  const statusNote =
    status === "pending"
      ? " This donation is pending and will count toward your campaign once an admin approves it."
      : "";

  await sendEmailViaResend({
    to,
    subject: `New donation to ${campaignTitle}`,
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${creatorName || "there"},</p>
      <p style="margin:0 0 1em;">Someone just donated to your campaign &quot;${campaignTitle}&quot;.</p>
      <p style="margin:0 0 1em;"><strong>Amount:</strong> ${amountStr}<br/><strong>From:</strong> ${donorDisplay}</p>
      <p style="margin:0 0 1em;">You can see all donations and track your progress in My Campaigns.${statusNote}</p>
      <p style="margin:0;">Thank you for using Givah to share your cause with the community.</p>
    `),
  });
}

// Donor-facing: donation receipt (single donation)

/** Email to donor after admin has approved their donation — confirms donation was successful. */
export interface DonationApprovedEmailParams {
  to: string;
  donorName: string;
  campaignTitle: string;
  amount: number;
}

export async function sendDonationApprovedEmail(params: DonationApprovedEmailParams): Promise<void> {
  const { to, donorName, campaignTitle, amount } = params;
  if (!to) return;
  const amountStr = `BZ$${Number(amount || 0).toLocaleString()}`;
  await sendEmailViaResend({
    to,
    subject: `Your donation to ${campaignTitle} was successful`,
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${donorName || "there"},</p>
      <p style="margin:0 0 1em;">Good news — your donation has been approved and is now complete.</p>
      <p style="margin:0 0 1em;">
        <strong>Campaign:</strong> ${campaignTitle}<br/>
        <strong>Amount:</strong> ${amountStr}
      </p>
      <p style="margin:0;">Thank you for supporting this campaign on Givah.</p>
    `),
  });
}

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
  const refBlock = referenceNumber
    ? `<p style="margin:0 0 1em;"><strong>Reference #:</strong> ${referenceNumber}</p>`
    : "";
  const noteBlock = note
    ? `<p style="margin:0 0 1em;"><strong>Note from you:</strong> ${note}</p>`
    : "";
  await sendEmailViaResend({
    to,
    subject: `Thank you for your donation to ${campaignTitle}`,
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${donorName || "there"},</p>
      <p style="margin:0 0 1em;">Thank you for your generous donation to &quot;${campaignTitle}&quot; on Givah.</p>
      <p style="margin:0 0 1em;">
        <strong>Amount:</strong> ${amountStr}<br/>
        <strong>Method:</strong> ${methodLabel}<br/>
        <strong>Status:</strong> ${statusLabel}
      </p>
      ${refBlock}
      ${noteBlock}
      <p style="margin:0 0 1em;">This email serves as a record of your contribution. Please keep it for your records.</p>
      <p style="margin:0;">Thank you for supporting our community.</p>
    `),
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
    html: wrapEmailWithTemplate(`
      <p style="margin:0 0 1em;">Hi ${creatorName || "there"},</p>
      <p style="margin:0 0 1em;">Here is your payout summary for <strong>${monthLabel}</strong> on Givah.</p>
      <table role="presentation" style="border-collapse:collapse; width:100%; max-width:480px; margin:0 auto 1em;">
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
      <p style="margin:0;">Thank you for using Givah to support real needs in our community.</p>
    `),
  });
}

