import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Profile and other app routes use Supabase Auth (AuthContext). Do not protect them with NextAuth here.
// NextAuth may still be used elsewhere; middleware is left in place for future use if needed.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
