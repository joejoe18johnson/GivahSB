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

