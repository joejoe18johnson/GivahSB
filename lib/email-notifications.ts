/**
 * Standalone email helpers for campaign/donation notifications.
 * Used by API routes so the build does not depend on lib/email exports that may be missing in older commits.
 */

function getBase(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.givahbz.com").trim().replace(/\/$/, "");
  return base.startsWith("http") ? base : `https://${base}`;
}

function wrapLayout(body: string): string {
  const base = getBase();
  const logoUrl = `${base}/givah-logo.png`;
  const bannerUrl = `${base}/Givah-Banner.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Givah</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#374151;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
<tr><td align="center" style="background:#1FA84A;padding:0;line-height:0;min-height:120px;">
<img src="${bannerUrl}" alt="GivahBZ" width="600" height="120" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
</td></tr>
<tr><td style="padding:24px 24px 8px 24px;">
<a href="${base}"><img src="${logoUrl}" alt="GivahBZ" width="180" height="54" style="display:block;width:180px;height:auto;border:0;" /></a>
</td></tr>
<tr><td style="padding:8px 24px 24px 24px;">
${body.trim()}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
This email was sent by Givah. &copy; ${new Date().getFullYear()} GivahBz.
</td></tr>
</table></td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  if (!to) return;
  const fullHtml = wrapLayout(html);
  if (!apiKey) {
    console.log("[email-notifications] (no RESEND_API_KEY) would send:", { to, subject });
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [to], subject, html: fullHtml }),
    });
    if (!res.ok) console.error("[email-notifications] Resend error:", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("[email-notifications] send:", e);
  }
}

export async function sendCampaignSubmittedForReviewEmail(params: {
  to: string;
  creatorName: string;
  campaignTitle: string;
}): Promise<void> {
  const { to, creatorName, campaignTitle } = params;
  if (!to) return;
  await send(
    to,
    `Campaign submitted for review: ${campaignTitle}`,
    `<p>Hi ${creatorName || "there"},</p>
<p>Your campaign &quot;${campaignTitle}&quot; has been submitted for review. Our team will look at it and get back to you once it&apos;s approved.</p>
<p>You can check the status from your My Campaigns page.</p>`
  );
}

export async function sendDonationReceivedEmail(params: {
  to: string;
  creatorName: string;
  campaignTitle: string;
  amount: number;
  donorDisplay: string;
  status: "pending" | "completed";
}): Promise<void> {
  const { to, creatorName, campaignTitle, amount, donorDisplay } = params;
  if (!to) return;
  const amountStr = `BZ$${Number(amount || 0).toLocaleString()}`;
  await send(
    to,
    `New donation to ${campaignTitle}`,
    `<p>Hi ${creatorName || "there"},</p>
<p><strong>${donorDisplay}</strong> donated ${amountStr} to your campaign &quot;${campaignTitle}&quot;.</p>
<p>Thank you for using Givah to make a difference.</p>`
  );
}

export async function sendDonationApprovedEmail(params: {
  to: string;
  donorName: string;
  campaignTitle: string;
  amount: number;
}): Promise<void> {
  const { to, donorName, campaignTitle, amount } = params;
  if (!to) return;
  const amountStr = `BZ$${Number(amount || 0).toLocaleString()}`;
  await send(
    to,
    `Donation confirmed: ${campaignTitle}`,
    `<p>Hi ${donorName || "there"},</p>
<p>Your donation of <strong>${amountStr}</strong> to &quot;${campaignTitle}&quot; has been confirmed and is now complete.</p>
<p>Thank you for supporting our community.</p>`
  );
}
