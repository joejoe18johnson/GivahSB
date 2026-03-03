import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  ensureStorageBucket,
  uploadProofDocumentUnderReviewServer,
  isAllowedProofMime,
} from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Server is not configured for uploads." },
      { status: 503 }
    );
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to upload proof documents." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const pendingId = (formData.get("pendingId") as string)?.trim() || "";
  const indexRaw = formData.get("index");
  const index = indexRaw != null ? parseInt(String(indexRaw), 10) : NaN;

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!pendingId || pendingId.length > 128) {
    return NextResponse.json(
      { error: "Valid pendingId is required." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(index) || index < 0 || index > 49) {
    return NextResponse.json(
      { error: "index must be an integer between 0 and 49." },
      { status: 400 }
    );
  }
  if (!isAllowedProofMime(file.type || "", file.name)) {
    return NextResponse.json(
      { error: "File must be an image (JPG, PNG, etc.), PDF, or Word document." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 10MB." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin()!;
    await ensureStorageBucket(supabase, "campaigns", { public: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadProofDocumentUnderReviewServer(
      supabase,
      pendingId,
      index,
      buffer,
      file.name,
      file.type || "application/octet-stream"
    );
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
