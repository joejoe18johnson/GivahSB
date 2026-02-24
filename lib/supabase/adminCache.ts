/**
 * Client-side cache for admin data (donations, campaigns, users, under-review).
 * Fetches from /api/admin/data/* and caches with TTL; invalidate after mutations.
 */

import type { AdminDonation } from "@/lib/adminData";
import type { Campaign } from "@/lib/data";
import type { CampaignUnderReviewDoc, AdminUserDoc } from "@/lib/supabase/database";

const CACHE_TTL_MS = 60_000;
type CacheEntry<T> = { data: T; expires: number };
const cache = new Map<string, CacheEntry<unknown>>();

function get<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expires) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry.data;
}

function set<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateDonationsCache(): void {
  cache.delete("donations_all");
}

export function invalidateCampaignsCache(): void {
  cache.delete("campaigns");
  cache.delete("campaignsForAdmin");
}

export function invalidateUsersCache(): void {
  cache.delete("users");
}

export function invalidateUnderReviewCache(): void {
  cache.delete("underReviewList");
}

export function invalidateAllAdminCache(): void {
  cache.clear();
}

async function fetchWithAuth<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));
  return res.json();
}

export async function getDonationsCached(campaignId?: string): Promise<AdminDonation[]> {
  const cacheKey = campaignId ? `donations_${campaignId}` : "donations_all";
  const hit = get<AdminDonation[]>(cacheKey);
  if (hit != null) return hit;
  const url = campaignId
    ? `/api/admin/data/donations?campaignId=${encodeURIComponent(campaignId)}`
    : "/api/admin/data/donations";
  const data = await fetchWithAuth<AdminDonation[]>(url);
  set(cacheKey, data);
  return data;
}

export async function getCampaignsForAdminCached(): Promise<(Campaign & { status?: string })[]> {
  const hit = get<(Campaign & { status?: string })[]>("campaignsForAdmin");
  if (hit != null) return hit;
  const data = await fetchWithAuth<(Campaign & { status?: string })[]>("/api/admin/data/campaigns");
  set("campaignsForAdmin", data);
  return data;
}

export async function getUsersCached(): Promise<AdminUserDoc[]> {
  const hit = get<AdminUserDoc[]>("users");
  if (hit != null) return hit;
  const data = await fetchWithAuth<AdminUserDoc[]>("/api/admin/data/users");
  set("users", data);
  return data;
}

export async function getCampaignsUnderReviewCached(): Promise<CampaignUnderReviewDoc[]> {
  const hit = get<CampaignUnderReviewDoc[]>("underReviewList");
  if (hit != null) return hit;
  const data = await fetchWithAuth<CampaignUnderReviewDoc[]>("/api/admin/data/campaigns-under-review");
  set("underReviewList", data);
  return data;
}

export async function getCampaignsUnderReviewCountCached(): Promise<number> {
  const list = get<CampaignUnderReviewDoc[]>("underReviewList");
  if (list != null) return list.length;
  const data = await getCampaignsUnderReviewCached();
  return data.length;
}

export async function getCampaignsCached(): Promise<Campaign[]> {
  const hit = get<Campaign[]>("campaigns");
  if (hit != null) return hit;
  const res = await fetch("/api/campaigns", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load campaigns");
  const data = await res.json();
  set("campaigns", data);
  return data;
}
