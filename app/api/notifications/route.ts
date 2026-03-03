import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/auth-server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getUserNotifications, getUnreadNotificationCount, getTotalNotificationCount } from "@/lib/supabase/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET - list all notifications (read and unread) for current user, plus unread/total counts. Notifications stay in the list when marked read. Use ?limit= (e.g. limit=200). */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 }, { status: 200 });
  }
  const user = await getSupabaseUserFromRequest(request);
  if (!user?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 }, { status: 200 });
  }
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 10), 500) : 10;
  try {
    const supabase = getSupabaseAdmin()!;
    const [list, unreadCount, totalCount] = await Promise.all([
      getUserNotifications(supabase, user.id, { limit }),
      getUnreadNotificationCount(supabase, user.id),
      getTotalNotificationCount(supabase, user.id),
    ]);
    return NextResponse.json({ notifications: list, unreadCount, totalCount });
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 }, { status: 200 });
  }
}
