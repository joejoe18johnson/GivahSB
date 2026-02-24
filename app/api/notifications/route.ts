import { NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - list notifications and unread count for current user */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
  }
  try {
    const supabase = getSupabaseAdmin()!;
    const [list, unreadCount] = await Promise.all([
      getUserNotifications(supabase, user.id),
      getUnreadNotificationCount(supabase, user.id),
    ]);
    return NextResponse.json({ notifications: list.slice(0, 10), unreadCount });
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
  }
}
