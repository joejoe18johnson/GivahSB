const STOPPED_KEY = "givahbz_stopped_campaigns";
const DELETED_KEY = "givahbz_deleted_campaigns";

export function getStoppedCampaignIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STOPPED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDeletedCampaignIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStoppedCampaignIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STOPPED_KEY, JSON.stringify(ids));
}

export function setDeletedCampaignIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
}

export function isCampaignStopped(campaignId: string): boolean {
  return getStoppedCampaignIds().includes(campaignId);
}

export function isCampaignDeleted(campaignId: string): boolean {
  return getDeletedCampaignIds().includes(campaignId);
}
