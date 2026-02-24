import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Sample test accounts for local/dev testing (see README or TEST_ACCOUNTS.md)
const TEST_ACCOUNTS = [
  { email: "user@test.com", password: "Test123!", name: "Test User" },
  { email: "maria@test.com", password: "Test123!", name: "Maria Gonzalez" },
  { email: "admin@givahbz.com", password: "Admin123!", name: "Admin User" },
];

// Parse env (strip quotes and whitespace)
function readEnv(name: string): string {
  const raw = process.env[name];
  if (raw == null || typeof raw !== "string") return "";
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  return trimmed.trim();
}
const googleClientId = readEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = readEnv("GOOGLE_CLIENT_SECRET");
const hasGoogle = Boolean(
  googleClientId.length > 0 &&
  googleClientSecret.length > 0 &&
  !googleClientId.startsWith("123456789") &&
  !googleClientSecret.startsWith("GOCSPX-xxxxxxxx")
);
// NEXTAUTH_SECRET is required; use a dev fallback if still the placeholder so the app doesn't 500
const rawSecret = readEnv("NEXTAUTH_SECRET");
const isPlaceholder = !rawSecret || rawSecret === "your-secret-key-generate-with-openssl-rand-base64-32";
const NEXTAUTH_SECRET = rawSecret && !isPlaceholder
  ? rawSecret
  : "dev-fallback-secret-change-in-production-use-openssl-rand-base64-32";

const authOptions = {
  providers: [
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const match = TEST_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === credentials!.email!.toLowerCase() && a.password === credentials!.password
        );
        if (match) {
          return { id: match.email, email: match.email, name: match.name };
        }
        // MVP fallback: accept any email/password for ad-hoc testing
        const name = credentials.email.split("@")[0].replace(/[._]/g, " ") || "User";
        return {
          id: credentials.email,
          email: credentials.email,
          name: name.charAt(0).toUpperCase() + name.slice(1),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        session.user.id = token.sub ?? token.id;
        const email = (session.user.email as string)?.toLowerCase() ?? "";
        const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
        // Fallback: test admin account is always admin when ADMIN_EMAILS not set (e.g. fresh .env)
        const isAdmin = adminEmails.length > 0
          ? adminEmails.includes(email)
          : email === "admin@givahbz.com";
        session.user.role = isAdmin ? "admin" : "user";
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      const base = baseUrl.replace(/\/$/, "");
      if (url.startsWith("/")) return `${base}${url}`;
      try {
        if (new URL(url).origin === new URL(base).origin) return url;
      } catch {
        // ignore
      }
      return base;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  secret: NEXTAUTH_SECRET,
  trustHost: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
