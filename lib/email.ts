/**
 * Email helpers. Payout completed: in-app notification is always sent from the API;
 * this module sends the optional email (e.g. via Resend).
 */

export interface PayoutCompletedEmailParams {
  to: string;
  creatorName: string;
  campaignTitle: string;
  amount: string;
}

/** Send "payout completed" email. Logs if no provider configured; uses Resend when RESEND_API_KEY is set. */
export async function sendPayoutCompletedEmail(params: PayoutCompletedEmailParams): Promise<void> {
  const { to, creatorName, campaignTitle, amount } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";

  if (!apiKey) {
    console.log("[email] Payout completed (no RESEND_API_KEY):", { to, campaignTitle, amount });
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
        to: [to],
        subject: `Payout completed: ${campaignTitle}`,
        html: `
          <p>Hi ${creatorName || "there"},</p>
          <p>Your payout of <strong>${amount}</strong> for the campaign &quot;${campaignTitle}&quot; has been completed.</p>
          <p>Thank you for using our platform.</p>
        `,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend error:", res.status, text);
    }
  } catch (err) {
    console.error("[email] sendPayoutCompletedEmail:", err);
  }
}
