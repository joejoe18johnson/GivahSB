/**
 * Get current Supabase user in API routes (from cookies or Bearer token).
 */
import { createClient } from "@/lib/supabase/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export async function getSupabaseUserFromRequest(request: Request): Promise<SupabaseUser | null> {
  const supabase = await createClient();
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return user;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
