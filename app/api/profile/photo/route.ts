import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { ensureStorageBucket } from "@/lib/supabase/storage";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST - upload profile photo. Returns { url }. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  try {
    const supabase = getSupabaseAdmin()!;
    await ensureStorageBucket(supabase, "profile-photos", { public: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    const hint =
      /Bucket not found|bucket not found/i.test(message)
        ? " An admin must create storage buckets: open /admin and click “Create storage buckets”, or visit /api/admin/ensure-storage while logged in as admin."
        : "";
    return NextResponse.json({ error: message + hint }, { status: 500 });
  }
}
