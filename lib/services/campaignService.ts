import { Campaign } from "@/lib/data";

/** Build query string for /api/campaigns */
function campaignsApiQuery(filters?: {
  category?: string;
  trending?: boolean;
  limitCount?: number;
  onlyFullyFunded?: boolean;
}): string {
  const params = new URLSearchParams();
  if (filters?.trending) params.set("trending", "true");
  if (filters?.category && filters.category !== "All") params.set("category", filters.category);
  if (filters?.limitCount && filters.limitCount > 0) params.set("limitCount", String(filters.limitCount));
  if (filters?.onlyFullyFunded) params.set("onlyFullyFunded", "true");
  const q = params.toString();
  return q ? `?${q}` : "";
}

const CAMPAIGNS_FETCH_TIMEOUT_MS = 20000;

/**
 * Fetch campaigns from the server API (Supabase).
 * Use this for the campaigns list and home.
 */
export async function fetchCampaignsFromAPI(filters?: {
  category?: string;
  trending?: boolean;
  limitCount?: number;
  onlyFullyFunded?: boolean;
}): Promise<Campaign[]> {
  const url = `/api/campaigns${campaignsApiQuery(filters)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CAMPAIGNS_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
      const msg = err?.error ?? "Failed to load campaigns";
      const hint = err?.hint;
      throw new Error(hint ? `${msg} ${hint}` : msg);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Campaigns are taking too long to load. Check your connection and Supabase setup.");
    }
    throw err;
  }
}

export async function fetchCampaigns(filters?: {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
}): Promise<Campaign[]> {
  return fetchCampaignsFromAPI(filters);
}

export async function fetchCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    const res = await fetch(`/api/campaigns/${campaignId}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to load campaign");
    return res.json();
  } catch (error) {
    console.error("Error fetching campaign:", error);
    throw error;
  }
}
