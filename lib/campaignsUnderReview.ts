const STORAGE_KEY = "givahbz_campaigns_under_review";

export interface CampaignUnderReview {
  id: string;
  title: string;
  description: string;
  goal: number;
  category: string;
  creatorName: string;
  submittedAt: string; // ISO date string
}

export function getCampaignsUnderReview(): CampaignUnderReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCampaignsUnderReview(campaigns: CampaignUnderReview[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

export function addCampaignUnderReview(campaign: CampaignUnderReview): void {
  const list = getCampaignsUnderReview();
  list.unshift(campaign);
  setCampaignsUnderReview(list);
}

export function removeCampaignUnderReview(id: string): void {
  setCampaignsUnderReview(getCampaignsUnderReview().filter((c) => c.id !== id));
}
