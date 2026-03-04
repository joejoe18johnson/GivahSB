import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/email-test?to=you@example.com
 * Simple Resend test endpoint to debug EMAIL_FROM and RESEND_API_KEY.
 * Returns the Resend HTTP status and a truncated response body instead of swallowing errors.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") || "";

  const apiKey = process.env.RESEND_API_KEY;
  const fromEnv = process.env.EMAIL_FROM ?? "noreply@example.com";
  const from = fromEnv.split(",")[0].trim();

  if (!to) {
    return NextResponse.json(
      { sent: false, reason: "MISSING_TO", message: "Add ?to=you@example.com to the URL.", from },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        sent: false,
        reason: "NO_RESEND_API_KEY",
        message: "RESEND_API_KEY is not set in this environment.",
        from,
      },
      { status: 500 }
    );
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
        subject: "GivahBz email test",
        html: `<p>This is a test email from GivahBz.</p><p>If you see this, Resend is configured correctly.</p>`,
      }),
    });

    const text = await res.text().catch(() => "");

    return NextResponse.json(
      {
        sent: res.ok,
        status: res.status,
        from,
        to,
        bodyPreview: text.slice(0, 400),
      },
      { status: res.ok ? 200 : 500 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        sent: false,
        reason: "FETCH_ERROR",
        message: err instanceof Error ? err.message : String(err),
        from,
        to,
      },
      { status: 500 }
    );
  }
}

