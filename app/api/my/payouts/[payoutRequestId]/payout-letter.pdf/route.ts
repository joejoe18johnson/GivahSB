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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN = 54; // 0.75in
const LINE_HEIGHT = 14;
const TITLE_SIZE = 16;
const BODY_SIZE = 11;
const SMALL_SIZE = 9;

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
  font: { widthOfTextAtSize: (t: string, s: number) => number }
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
  const createdDate = new Date(payout.created_at).toLocaleDateString(
    undefined,
    { dateStyle: "medium" }
  );
  const maskedAccount = `****${String(payout.account_number).slice(-4)}`;
  const bankLine = payout.account_type
    ? `${payout.bank_name} · ${payout.account_type}`
    : payout.bank_name;
  const accountLine = payout.branch
    ? `${maskedAccount} · Branch: ${payout.branch}`
    : maskedAccount;

  const doc = await PDFDocument.create();
  const page = doc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.06, 0.67, 0.29);
  const dark = rgb(0.07, 0.07, 0.15);
  const gray = rgb(0.29, 0.34, 0.39);

  let y = LETTER_HEIGHT - MARGIN;
  const contentWidth = LETTER_WIDTH - 2 * MARGIN;

  // Logo (optional)
  let logoImage: PDFImage | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "givah-logo.png");
    const logoBytes = await fs.readFile(logoPath);
    logoImage = await doc.embedPng(logoBytes);
  } catch {
    // no logo
  }

  if (logoImage) {
    const logoH = 40;
    const logoW = (logoImage.width / logoImage.height) * logoH;
    page.drawImage(logoImage, {
      x: MARGIN,
      y: y - logoH,
      width: logoW,
      height: logoH,
    });
    page.drawText("GivahBz", {
      x: MARGIN + logoW + 12,
      y: y - 28,
      size: 14,
      font: helveticaBold,
      color: green,
    });
    page.drawText("Sharing Burdens. Together.", {
      x: MARGIN + logoW + 12,
      y: y - 42,
      size: 10,
      font: helvetica,
      color: gray,
    });
    page.drawText("givahbz.com", {
      x: LETTER_WIDTH - MARGIN - helvetica.widthOfTextAtSize("givahbz.com", 9),
      y: y - 18,
      size: SMALL_SIZE,
      font: helvetica,
      color: gray,
    });
    page.drawText("Belmopan City, Belize", {
      x:
        LETTER_WIDTH -
        MARGIN -
        helvetica.widthOfTextAtSize("Belmopan City, Belize", 9),
      y: y - 30,
      size: SMALL_SIZE,
      font: helvetica,
      color: gray,
    });
    y -= logoH + 16;
  } else {
    page.drawText("GivahBz", {
      x: MARGIN,
      y: y - 18,
      size: 14,
      font: helveticaBold,
      color: green,
    });
    page.drawText("Sharing Burdens. Together.", {
      x: MARGIN,
      y: y - 32,
      size: 10,
      font: helvetica,
      color: gray,
    });
    y -= 48;
  }

  // Divider line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: LETTER_WIDTH - MARGIN, y },
    thickness: 2,
    color: green,
  });
  y -= 20;

  // Title
  page.drawText("Payout confirmation", {
    x: MARGIN,
    y,
    size: TITLE_SIZE,
    font: helveticaBold,
    color: dark,
  });
  y -= LINE_HEIGHT * 1.5;

  // Meta lines
  const meta = [
    { label: "Campaign:", value: campaignTitle },
    { label: "Amount paid out:", value: amount },
    { label: "Bank:", value: bankLine },
    { label: "Account holder:", value: payout.account_holder_name },
    { label: "Account number:", value: accountLine },
    { label: "Status:", value: payout.status },
    { label: "Payout requested:", value: createdDate },
  ];
  for (const { label, value } of meta) {
    const full = `${label} ${value}`;
    if (helvetica.widthOfTextAtSize(full, BODY_SIZE) <= contentWidth) {
      page.drawText(label, {
        x: MARGIN,
        y,
        size: BODY_SIZE,
        font: helveticaBold,
        color: dark,
      });
      page.drawText(` ${value}`, {
        x: MARGIN + helveticaBold.widthOfTextAtSize(label, BODY_SIZE),
        y,
        size: BODY_SIZE,
        font: helvetica,
        color: dark,
      });
    } else {
      page.drawText(label, { x: MARGIN, y, size: BODY_SIZE, font: helveticaBold, color: dark });
      y -= LINE_HEIGHT;
      y = drawWrappedText(
        page,
        value,
        MARGIN,
        y,
        contentWidth,
        BODY_SIZE,
        helvetica
      );
      y -= 4;
    }
    y -= LINE_HEIGHT;
  }

  y -= 8;
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
  y -= LINE_HEIGHT;

  const footerNote =
    "Generated from your GivahBz account. Paper size: Letter (8.5\" × 11\").";
  y = drawWrappedText(
    page,
    footerNote,
    MARGIN,
    y,
    contentWidth,
    SMALL_SIZE,
    helvetica
  );

  const pdfBytes = await doc.save();
  const fileName = `payout-letter-${safeFileName(campaignTitle)}.pdf`;

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store, max-age=0",
      "Content-Length": String(pdfBytes.length),
    },
  });
}
