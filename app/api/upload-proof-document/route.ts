import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - upload proof-of-need document for a campaign. */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    // TODO: validate file type/size, upload to storage, save reference in DB
    return NextResponse.json(
      { error: "Proof document upload not yet implemented" },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
