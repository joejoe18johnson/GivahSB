/**
 * Supabase Auth — sign in, sign out, session, OAuth callback.
 * Uses Supabase Auth (email/password + Google OAuth).
 */

import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserStatus = "active" | "on_hold" | "deleted";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  idVerified: boolean;
  addressVerified: boolean;
  emailVerified?: boolean;
  role?: "user" | "admin";
  status?: UserStatus;
  birthday?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phonePending?: boolean;
  idDocument?: string;
  idDocumentType?: "social_security" | "passport";
  idPending?: boolean;
  addressDocument?: string;
  addressPending?: boolean;
  profilePhoto?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

function getAdminEmails(): string[] {
  const raw =
    typeof process.env.NEXT_PUBLIC_ADMIN_EMAILS !== "undefined"
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS
      : typeof process.env.ADMIN_EMAILS !== "undefined"
        ? process.env.ADMIN_EMAILS
        : "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function rowToProfile(row: Record<string, unknown>, email: string): UserProfile {
  const adminEmails = getAdminEmails();
  const emailLower = email.toLowerCase();
  const isAdminByEmail = adminEmails.length > 0 && adminEmails.includes(emailLower);
  return {
    id: (row.id as string) ?? "",
    email,
    name: (row.name as string) ?? "User",
    verified: !!(row.verified ?? false),
    idVerified: !!(row.id_verified ?? false),
    addressVerified: !!(row.address_verified ?? false),
    emailVerified: !!(row.email_verified ?? false),
    role: (isAdminByEmail ? "admin" : (row.role as "user" | "admin")) ?? "user",
    status: (row.status as UserStatus) ?? "active",
    birthday: row.birthday as string | undefined,
    phoneNumber: row.phone_number as string | undefined,
    phoneVerified: !!(row.phone_verified ?? false),
    phonePending: !!(row.phone_pending ?? false),
    idDocument: row.id_document as string | undefined,
    idDocumentType: row.id_document_type as "social_security" | "passport" | undefined,
    idPending: !!(row.id_pending ?? false),
    addressDocument: row.address_document as string | undefined,
    addressPending: !!(row.address_pending ?? false),
    profilePhoto: (row.profile_photo as string) ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
  };
}

export async function supabaseUserToProfile(
  supabase: SupabaseClient,
  supabaseUser: SupabaseUser
): Promise<UserProfile | null> {
  if (!supabaseUser?.id) return null;
  const { data: row } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", supabaseUser.id)
    .single();
  const email = supabaseUser.email ?? "";
  const adminEmails = getAdminEmails();
  const isAdminByEmail = adminEmails.length > 0 && adminEmails.includes(email.toLowerCase());
  if (row) {
    if (isAdminByEmail && row.role !== "admin") {
      await supabase
        .from("profiles")
        .update({ role: "admin", updated_at: new Date().toISOString() })
        .eq("id", supabaseUser.id);
    }
    const profile = rowToProfile(row, email || (row.email as string));
    // Prefer Google profile image when user signed in with Google and has no custom upload
    const googleAvatar = supabaseUser.user_metadata?.avatar_url as string | undefined;
    if (!profile.profilePhoto && googleAvatar) profile.profilePhoto = googleAvatar;
    return profile;
  }
  // New user or no profile row: use Google avatar from OAuth metadata when present
  return rowToProfile(
    {
      id: supabaseUser.id,
      name: (supabaseUser.user_metadata?.name as string) ?? (supabaseUser.user_metadata?.full_name as string) ?? "User",
      profile_photo: supabaseUser.user_metadata?.avatar_url ?? undefined,
      role: isAdminByEmail ? "admin" : "user",
    },
    email
  );
}

export async function signUpWithEmailSupabase(
  supabase: SupabaseClient,
  email: string,
  password: string,
  name: string,
  phoneNumber?: string
): Promise<UserProfile> {
  // Verification link in email must point to /auth/confirm so we can verify and then redirect.
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://www.givahbz.com";
  const baseUrl = (base.startsWith("http") ? base : `https://${base}`).replace(/\/$/, "");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone_number: phoneNumber?.trim() || null },
      // Use client confirm page so links can use token_hash (works from any device). See docs/SUPABASE_EMAIL_CONFIRMATION_TEMPLATE.md.
      emailRedirectTo: `${baseUrl}/auth/confirm`,
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Sign up failed");
  await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      email: data.user.email ?? email,
      name: name || "User",
      role: "user",
      phone_number: phoneNumber?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  // Do NOT sign out here: Supabase stores a PKCE code_verifier for the email confirmation
  // redirect. signOut() would clear it and break "Confirming your email" with "PKCE code verifier
  // not found". We keep the session; AuthContext treats unconfirmed sessions as logged-out (setUser(null)
  // without calling signOut) so the verifier is preserved and the confirmation link works.
  const profile = await supabaseUserToProfile(supabase, data.user);
  if (!profile) throw new Error("Could not load profile");
  return profile;
}

async function ensureProfileExists(
  supabase: SupabaseClient,
  user: SupabaseUser
): Promise<void> {
  const { data: row } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  if (row) return;
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.name as string) ?? (user.user_metadata?.full_name as string) ?? "User",
      role: "user",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

export async function signInWithEmailSupabase(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message || "";
    // Friendly message when Supabase says the email is not confirmed yet.
    if (/confirm(ed)?\s+email/i.test(msg) || /email.*not.*confirm/i.test(msg)) {
      throw new Error("Please confirm your email first. Check your inbox for a confirmation link.");
    }
    throw error;
  }
  if (!data.user) throw new Error("Sign in failed");

  // Extra safety: if the project is not enforcing confirm-email in Supabase settings,
  // still block login when email is not confirmed.
  const confirmedAt = (data.user as unknown as { email_confirmed_at?: string | null }).email_confirmed_at;
  if (!confirmedAt) {
    await supabase.auth.signOut();
    throw new Error("Please confirm your email first. We sent a confirmation link to your email address.");
  }

  await ensureProfileExists(supabase, data.user);
  const profile = await supabaseUserToProfile(supabase, data.user);
  if (!profile) throw new Error("Could not load profile");
  return profile;
}

export async function signInWithGoogleSupabase(supabase: SupabaseClient): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin + "/auth/callback" : undefined },
  });
  if (error) throw error;
  if (data?.url) {
    if (typeof window !== "undefined") window.location.href = data.url;
    throw new Error("REDIRECTING");
  }
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) throw new Error("No session after Google sign-in");
  return (await supabaseUserToProfile(supabase, sessionData.session.user)) as UserProfile;
}

export async function signOutSupabase(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.signOut();
}

export async function updateUserProfileSupabase(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const row: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.phoneNumber !== undefined) row.phone_number = updates.phoneNumber;
  if (updates.phoneVerified !== undefined) row.phone_verified = updates.phoneVerified;
  if (updates.phonePending !== undefined) row.phone_pending = updates.phonePending;
  if (updates.profilePhoto !== undefined) row.profile_photo = updates.profilePhoto;
  if (updates.idDocument !== undefined) row.id_document = updates.idDocument;
  if (updates.idDocumentType !== undefined) row.id_document_type = updates.idDocumentType;
  if (updates.idVerified !== undefined) row.id_verified = updates.idVerified;
  if (updates.idPending !== undefined) row.id_pending = updates.idPending;
  if (updates.addressDocument !== undefined) row.address_document = updates.addressDocument;
  if (updates.addressVerified !== undefined) row.address_verified = updates.addressVerified;
  if (updates.addressPending !== undefined) row.address_pending = updates.addressPending;
  if (Object.keys(row).length <= 2) return; // only id + updated_at
  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

export async function resetPasswordSupabase(supabase: SupabaseClient, email: string): Promise<void> {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://www.givahbz.com";
  const baseUrl = (base.startsWith("http") ? base : `https://${base}`).replace(/\/$/, "");
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/reset-password`,
  });
}
