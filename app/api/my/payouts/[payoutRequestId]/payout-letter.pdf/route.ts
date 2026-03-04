import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getPayoutRequestById } from "@/lib/supabase/database";
import { formatCurrency } from "@/lib/utils";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
  PDFImage,
  PDFFont,
} from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import { getSiteDomain } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN = 54; // 0.75in
const LINE_HEIGHT = 14;
const PAYOUT_TITLE_SIZE = 22; // "PAYOUT DETAILS"
const BODY_SIZE = 11;
const SMALL_SIZE = 9;
const TAGLINE_SIZE = 10;

function safeFileName(s: string): string {
  const cleaned = (s || "payout-letter")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return cleaned || "payout-letter";
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: PDFFont
): number {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const w = font.widthOfTextAtSize(test, size);
    if (w > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font });
      currentY -= LINE_HEIGHT;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y: currentY, size, font });
    currentY -= LINE_HEIGHT;
  }
  return currentY;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ payoutRequestId: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { payoutRequestId } = await params;
  if (!payoutRequestId) {
    return NextResponse.json(
      { error: "Payout request id required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin()!;
  const payout = await getPayoutRequestById(supabase, payoutRequestId);
  if (!payout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (payout.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (payout.status !== "completed") {
    return NextResponse.json(
      {
        error:
          "Payout letter is available after payout is completed.",
      },
      { status: 400 }
    );
  }

  const { data: camp } = await supabase
    .from("campaigns")
    .select("title, raised")
    .eq("id", payout.campaign_id)
    .single();

  const campaignTitle =
    (camp as { title?: string } | null)?.title ?? "Campaign";
  const raised = Number((camp as { raised?: number } | null)?.raised ?? 0);
  const amount = formatCurrency(raised);
  const maskedAccount = `****${String(payout.account_number).slice(-4)}`;
  const bankLine = payout.account_type
    ? `${payout.bank_name} · ${payout.account_type}`
    : payout.bank_name;
  const refDisplay = `REF: #${String(payoutRequestId).slice(-6).padStart(6, "0")}`;

  const doc = await PDFDocument.create();
  const page = doc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.06, 0.67, 0.29);
  const dark = rgb(0.07, 0.07, 0.15);
  const gray = rgb(0.29, 0.34, 0.39);
  const lineGray = rgb(0.55, 0.55, 0.55);

  let y = LETTER_HEIGHT - MARGIN;
  const contentWidth = LETTER_WIDTH - 2 * MARGIN;

  // Header: logo + GivahBZ + tagline left; REF top right
  let logoImage: PDFImage | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "givah-logo.png");
    const logoBytes = await fs.readFile(logoPath);
    logoImage = await doc.embedPng(logoBytes);
  } catch {
    // no logo
  }

  const logoH = 36;
  if (logoImage) {
    const logoW = (logoImage.width / logoImage.height) * logoH;
    page.drawImage(logoImage, {
      x: MARGIN,
      y: y - logoH,
      width: logoW,
      height: logoH,
    });
    page.drawText("GivahBZ", {
      x: MARGIN + logoW + 10,
      y: y - 24,
      size: 14,
      font: helveticaBold,
      color: green,
    });
    page.drawText("SHARING BURDENS. TOGETHER.", {
      x: MARGIN + logoW + 10,
      y: y - 38,
      size: TAGLINE_SIZE,
      font: helvetica,
      color: green,
    });
  } else {
    page.drawText("GivahBZ", {
      x: MARGIN,
      y: y - 20,
      size: 14,
      font: helveticaBold,
      color: green,
    });
    page.drawText("SHARING BURDENS. TOGETHER.", {
      x: MARGIN,
      y: y - 34,
      size: TAGLINE_SIZE,
      font: helvetica,
      color: green,
    });
  }
  const refWidth = helvetica.widthOfTextAtSize(refDisplay, BODY_SIZE);
  page.drawText(refDisplay, {
    x: LETTER_WIDTH - MARGIN - refWidth,
    y: y - 18,
    size: BODY_SIZE,
    font: helvetica,
    color: dark,
  });
  y -= logoH + 24;

  // PAYOUT DETAILS (large title) + thin gray line
  page.drawText("PAYOUT DETAILS", {
    x: MARGIN,
    y,
    size: PAYOUT_TITLE_SIZE,
    font: helveticaBold,
    color: dark,
  });
  y -= LINE_HEIGHT * 1.2;
  const lineWidth = contentWidth * (2 / 3);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + lineWidth, y },
    thickness: 0.5,
    color: lineGray,
  });
  y -= LINE_HEIGHT * 1.8;

  // Key-value fields
  const meta = [
    { label: "Campaign", value: campaignTitle },
    { label: "Amount paid out", value: amount },
    { label: "Bank", value: bankLine },
    { label: "Account holder", value: payout.account_holder_name },
    { label: "Account number", value: maskedAccount },
    { label: "Branch", value: payout.branch || "—" },
  ];
  for (const { label, value } of meta) {
    const labelText = `${label}:`;
    const labelW = helveticaBold.widthOfTextAtSize(labelText, BODY_SIZE);
    page.drawText(labelText, {
      x: MARGIN,
      y,
      size: BODY_SIZE,
      font: helveticaBold,
      color: dark,
    });
    const valueStr = String(value);
    if (helvetica.widthOfTextAtSize(valueStr, BODY_SIZE) <= contentWidth - labelW - 8) {
      page.drawText(` ${valueStr}`, {
        x: MARGIN + labelW,
        y,
        size: BODY_SIZE,
        font: helvetica,
        color: dark,
      });
    } else {
      y -= LINE_HEIGHT;
      y = drawWrappedText(
        page,
        valueStr,
        MARGIN + labelW + 4,
        y,
        contentWidth - labelW - 4,
        BODY_SIZE,
        helvetica
      );
      y -= 4;
    }
    y -= LINE_HEIGHT;
  }

  y -= 16;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: LETTER_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: lineGray,
  });
  y -= LINE_HEIGHT * 1.5;

  const footerNote =
    "Generated from your GivahBz account. Paper size: Letter (8.5\" x 11\").";
  const noteWidth = helvetica.widthOfTextAtSize(footerNote, SMALL_SIZE);
  page.drawText(footerNote, {
    x: (LETTER_WIDTH - noteWidth) / 2,
    y,
    size: SMALL_SIZE,
    font: helvetica,
    color: lineGray,
  });
  y -= LINE_HEIGHT * 2;

  const thankYou =
    "Thank you for using GivahBz to raise funds for your cause. This letter confirms that the payout for your campaign has been processed to the bank account details you provided.";
  y = drawWrappedText(
    page,
    thankYou,
    MARGIN,
    y,
    contentWidth,
    BODY_SIZE,
    helvetica
  );
  y -= LINE_HEIGHT * 2;

  const siteDomain = getSiteDomain();
  const domainWidth = helvetica.widthOfTextAtSize(siteDomain, BODY_SIZE);
  page.drawText(siteDomain, {
    x: (LETTER_WIDTH - domainWidth) / 2,
    y,
    size: BODY_SIZE,
    font: helvetica,
    color: dark,
  });

  const pdfBytes = await doc.save();
  const fileName = `payout-letter-${safeFileName(campaignTitle)}.pdf`;
  const body = Buffer.from(pdfBytes);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store, max-age=0",
      "Content-Length": String(body.length),
    },
  });
}
