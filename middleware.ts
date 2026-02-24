import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only protect paths that use NextAuth session. /admin uses Supabase Auth and is handled by the admin layout.
const protectedPaths = ["/profile"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const rawSecret = process.env.NEXTAUTH_SECRET?.trim() ?? "";
  const isPlaceholder = !rawSecret || rawSecret === "your-secret-key-generate-with-openssl-rand-base64-32";
  const secret = rawSecret && !isPlaceholder ? rawSecret : "dev-fallback-secret-change-in-production-use-openssl-rand-base64-32";
  if (!secret) {
    return NextResponse.next();
  }

  let token = null;
  try {
    token = await getToken({ req: request, secret });
  } catch {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile", "/profile/:path*"],
};
