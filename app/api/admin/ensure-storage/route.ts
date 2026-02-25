import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest, getAdminEmails } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { ensureStorageBucket } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKETS = [
  { id: "profile-photos", public: true },
  { id: "campaigns", public: true },
  { id: "verification-docs", public: true },
] as const;

async function runEnsureStorage() {
  const supabase = getSupabaseAdmin()!;
  const created: string[] = [];
  const errors: { bucket: string; error: string }[] = [];
  for (const { id, public: isPublic } of BUCKETS) {
    try {
      await ensureStorageBucket(supabase, id, { public: isPublic });
      created.push(id);
    } catch (err) {
      errors.push({ bucket: id, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }
  return { created, errors };
}

/** GET - create storage buckets if missing (admin only). Visit /api/admin/ensure-storage in browser while logged in as admin to fix "Bucket not found". */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { created, errors } = await runEnsureStorage();
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    const message = errors.length > 0
      ? `Created: ${created.join(", ") || "none"}. Errors: ${errors.map((e) => `${e.bucket}: ${e.error}`).join("; ")}`
      : `Storage buckets are ready. Created or verified: ${created.join(", ")}. You can now upload and view documents.`;
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Storage</title></head><body><p>${message}</p><p><a href="/admin">Back to Admin</a></p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  if (errors.length > 0) return NextResponse.json({ created, errors }, { status: 207 });
  return NextResponse.json({ success: true, created });
}

/** POST - create storage buckets if missing. Admin only. Use once to fix "Bucket not found" when uploading/viewing documents. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = getAdminEmails();
  if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { created, errors } = await runEnsureStorage();
  if (errors.length > 0) {
    return NextResponse.json({ created, errors }, { status: 207 });
  }
  return NextResponse.json({ success: true, created });
}
