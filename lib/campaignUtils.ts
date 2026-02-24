import { Campaign } from "./data";

/**
 * Calculate trending score based on:
 * - Recent backers (more weight)
 * - Funding progress percentage
 * - Days left (urgency factor)
 * - Total raised amount
 */
export function calculateTrendingScore(campaign: Campaign): number {
  const goal = Number(campaign.goal) || 1;
  const progressPercentage = (Number(campaign.raised) || 0) / goal * 100;
  const urgencyFactor = (campaign.daysLeft ?? 30) <= 7 ? 1.5 : (campaign.daysLeft ?? 30) <= 14 ? 1.2 : 1.0;
  const backerScore = (campaign.backers ?? 0) * 10;
  const progressScore = progressPercentage * 5;
  const raisedScore = (Number(campaign.raised) || 0) / 100;

  return (backerScore + progressScore + raisedScore) * urgencyFactor;
}

/**
 * Get trending campaigns sorted by trending score
 */
export function getTrendingCampaigns(campaigns: Campaign[], limit: number = 6): Campaign[] {
  return [...campaigns]
    .map(campaign => ({
      campaign,
      score: calculateTrendingScore(campaign)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.campaign);
}

/**
 * Get top campaigns by most funding (raised amount), for trending section. Max 12.
 */
export function getTopCampaignsByFunding(campaigns: Campaign[], limit: number = 12): Campaign[] {
  return [...campaigns]
    .sort((a, b) => (Number(b.raised) || 0) - (Number(a.raised) || 0))
    .slice(0, limit);
}
