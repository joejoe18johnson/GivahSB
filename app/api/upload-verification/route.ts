import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { uploadVerificationDocumentServer } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic", "pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function isAllowedFile(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return (
    (file.type && ALLOWED_TYPES.includes(file.type)) ||
    ALLOWED_EXT.includes(ext)
  );
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Server is not configured for uploads.",
        hint: "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.",
      },
      { status: 503 }
    );
  }

  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to upload." },
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
  const documentType = (formData.get("documentType") as string)?.trim() || "";

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!documentType) {
    return NextResponse.json(
      { error: "documentType is required (e.g. social_security, passport, address)." },
      { status: 400 }
    );
  }
  if (!["social_security", "passport", "address"].includes(documentType)) {
    return NextResponse.json(
      { error: "documentType must be social_security, passport, or address." },
      { status: 400 }
    );
  }
  if (!isAllowedFile(file)) {
    return NextResponse.json(
      { error: "File must be an image (JPG, PNG, HEIC, etc.) or PDF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File size must be less than 10MB." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin()!;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadVerificationDocumentServer(
      supabase,
      user.id,
      buffer,
      documentType,
      file.name,
      file.type || "application/octet-stream"
    );
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
