/**
 * Supabase Storage — profile photos, campaign images, verification docs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImageForUpload } from "@/lib/compressImage";

const BUCKET_PROFILE = "profile-photos";
const BUCKET_CAMPAIGNS = "campaigns";
const BUCKET_VERIFICATION = "verification-docs";

function sanitizeFileName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").trim() || "document";
  return base.replace(/[/\\?#*[\]^\s]+/g, "_").slice(0, 180) || "document";
}

export async function uploadProfilePhotoSupabase(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(BUCKET_PROFILE).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET_PROFILE).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCampaignImageSupabase(
  supabase: SupabaseClient,
  campaignId: string,
  file: File
): Promise<string> {
  const path = `${campaignId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(BUCKET_CAMPAIGNS).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET_CAMPAIGNS).getPublicUrl(path);
  return data.publicUrl;
}

const VERIFICATION_ALLOWED_EXT = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "heic", "pdf",
]);

function isAllowedVerificationFile(file: File): boolean {
  if (file.type.startsWith("image/") || file.type === "application/pdf") return true;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return VERIFICATION_ALLOWED_EXT.has(ext);
}

export async function uploadVerificationDocumentSupabase(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  documentType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!file) throw new Error("File is required");
  if (!isAllowedVerificationFile(file)) {
    throw new Error("File must be an image (JPG, PNG, HEIC, etc.) or PDF.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("File size must be less than 10MB");
  const fileToUpload = await compressImageForUpload(file);
  const safeName = sanitizeFileName(fileToUpload.name);
  const ext = fileToUpload.name.split(".").pop()?.toLowerCase() || (fileToUpload.type === "application/pdf" ? "pdf" : "jpg");
  const path = `${userId}/${documentType}/${Date.now()}_${safeName}.${ext}`;
  if (onProgress) onProgress(50);
  const { error } = await supabase.storage.from(BUCKET_VERIFICATION).upload(path, fileToUpload, {
    upsert: true,
    contentType: fileToUpload.type,
  });
  if (onProgress) onProgress(100);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET_VERIFICATION).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProfilePhotoSupabase(
  supabase: SupabaseClient,
  photoUrl: string
): Promise<void> {
  try {
    const path = photoUrl.split("/").slice(-3).join("/");
    await supabase.storage.from(BUCKET_PROFILE).remove([path]);
  } catch {
    // ignore
  }
}

// Server-side uploads (from API routes; buffer + path)
function sanitizePath(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").trim() || "document";
  return base.replace(/[/\\?#*[\]^\s]+/g, "_").slice(0, 180) || "document";
}

export async function uploadVerificationDocumentServer(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  documentType: string,
  originalFileName: string,
  mimeType: string
): Promise<string> {
  const ext = (originalFileName.split(".").pop() || "").toLowerCase() ||
    (mimeType === "application/pdf" ? "pdf" : "jpg");
  const safeName = sanitizePath(originalFileName);
  const path = `${userId}/${documentType}/${Date.now()}_${safeName}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_VERIFICATION)
    .upload(path, buffer, { contentType: mimeType || "application/octet-stream", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET_VERIFICATION).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCampaignUnderReviewImageServer(
  supabase: SupabaseClient,
  pendingId: string,
  index: 0 | 1,
  buffer: Buffer,
  originalFileName: string,
  mimeType: string
): Promise<string> {
  const ext = (originalFileName.split(".").pop() || "").toLowerCase() || "jpg";
  const path = `under-review/${pendingId}/image${index + 1}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_CAMPAIGNS)
    .upload(path, buffer, { contentType: mimeType || "image/jpeg", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET_CAMPAIGNS).getPublicUrl(path);
  return data.publicUrl;
}
