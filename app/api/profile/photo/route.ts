import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
