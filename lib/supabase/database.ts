/**
 * Supabase database layer — campaigns, donations, profiles, under-review, notifications, site config.
 * All functions take the Supabase client as first argument (use getSupabaseAdmin() in API routes, useSupabase() in client).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Campaign } from "@/lib/data";
import type { AdminDonation } from "@/lib/adminData";
import { generateShortRef } from "@/lib/utils";

// Row types (snake_case from DB)
interface CampaignRow {
  id: string;
  title: string;
  description: string;
  full_description: string;
  creator: string;
  creator_type: string;
  creator_id: string | null;
  goal: number;
  raised: number;
  backers: number;
  days_left: number;
  category: string;
  image: string;
  image2: string | null;
  location: string | null;
  status: string;
  verified: boolean;
  admin_backed: boolean;
  created_at: string;
  updated_at: string;
}

interface DonationRow {
  id: string;
  campaign_id: string;
  amount: number;
  donor_email: string | null;
  donor_name: string | null;
  anonymous: boolean;
  method: string;
  status: string;
  reference_number: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignUnderReviewRow {
  id: string;
  title: string;
  description: string;
  full_description: string | null;
  goal: number;
  category: string;
  creator_name: string;
  creator_id: string;
  image: string | null;
  image2: string | null;
  status: string;
  submitted_at: string;
  created_at: string;
}

function toCampaign(r: CampaignRow): Campaign {
  const createdAt = r.created_at?.split?.("T")?.[0] ?? new Date().toISOString().split("T")[0];
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    fullDescription: r.full_description ?? r.description,
    creator: r.creator,
    creatorType: (r.creator_type as Campaign["creatorType"]) || "individual",
    goal: Number(r.goal),
    raised: Number(r.raised),
    backers: Number(r.backers) || 0,
    daysLeft: Number(r.days_left) || 30,
    category: r.category,
    image: r.image,
    image2: r.image2 ?? undefined,
    location: r.location ?? undefined,
    createdAt,
    verified: !!r.verified,
    adminBacked: r.admin_backed ?? undefined,
  };
}

export async function getCampaign(
  supabase: SupabaseClient,
  campaignId: string
): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (error || !data) return null;
  const row = data as CampaignRow;
  if (row.status === "on_hold") return null;
  return toCampaign(row);
}

export type GetCampaignsFilters = {
  category?: string;
  search?: string;
  trending?: boolean;
  limitCount?: number;
  onlyFullyFunded?: boolean;
  forStats?: boolean;
};

export async function getCampaigns(
  supabase: SupabaseClient,
  filters?: GetCampaignsFilters
): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .in("status", ["live", "on_hold"]);
  if (error) throw error;
  let campaigns: Campaign[] = (data || [])
    .filter((r: CampaignRow) => r.status !== "pending")
    .map((r: CampaignRow) => toCampaign(r));

  const goal = (c: Campaign) => Number(c.goal) || 1;
  const raised = (c: Campaign) => Number(c.raised) || 0;
  if (!filters?.forStats) {
    if (filters?.onlyFullyFunded === true) {
      campaigns = campaigns.filter((c) => goal(c) > 0 && raised(c) >= goal(c));
    } else {
      campaigns = campaigns.filter((c) => goal(c) <= 0 || raised(c) < goal(c));
    }
  }
  if (filters?.trending) {
    campaigns = campaigns.filter((c) => goal(c) > 0 && raised(c) / goal(c) >= 0.6);
  }
  if (filters?.category && filters.category !== "All") {
    campaigns = campaigns.filter((c) => c.category === filters!.category);
  }
  if (filters?.trending) {
    campaigns.sort((a, b) => (b.backers ?? 0) - (a.backers ?? 0));
  } else {
    campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    campaigns = campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower)
    );
  }
  if (filters?.limitCount && filters.limitCount > 0) {
    campaigns = campaigns.slice(0, filters.limitCount);
  }
  return campaigns;
}

export async function createCampaign(
  supabase: SupabaseClient,
  campaign: Omit<Campaign, "id">
): Promise<string> {
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      title: campaign.title,
      description: campaign.description,
      full_description: campaign.fullDescription,
      creator: campaign.creator,
      creator_type: campaign.creatorType,
      goal: campaign.goal,
      raised: campaign.raised,
      backers: campaign.backers,
      days_left: campaign.daysLeft,
      category: campaign.category,
      image: campaign.image,
      image2: campaign.image2 ?? campaign.image,
      location: campaign.location ?? "",
      verified: campaign.verified,
      admin_backed: campaign.adminBacked ?? false,
      status: "live",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateCampaign(
  supabase: SupabaseClient,
  campaignId: string,
  updates: Partial<Campaign>
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.fullDescription !== undefined) row.full_description = updates.fullDescription;
  if (updates.raised !== undefined) row.raised = updates.raised;
  if (updates.backers !== undefined) row.backers = updates.backers;
  const { error } = await supabase.from("campaigns").update(row).eq("id", campaignId);
  if (error) throw error;
}

export async function deleteCampaign(
  supabase: SupabaseClient,
  campaignId: string
): Promise<void> {
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) throw error;
}

export async function setCampaignOnHold(
  supabase: SupabaseClient,
  campaignId: string,
  onHold: boolean
): Promise<void> {
  const { error } = await supabase
    .from("campaigns")
    .update({ status: onHold ? "on_hold" : "live", updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (error) throw error;
}

export async function getCampaignsForAdmin(
  supabase: SupabaseClient
): Promise<(Campaign & { status?: string })[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .neq("status", "pending");
  if (error) throw error;
  return (data || []).map((r: CampaignRow) => ({
    ...toCampaign(r),
    status: r.status,
  }));
}

export async function getCampaignsOnHoldForUser(
  supabase: SupabaseClient,
  creatorId: string
): Promise<(Campaign & { status?: string })[]> {
  if (!creatorId) return [];
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "on_hold");
  if (error) throw error;
  return (data || []).map((r: CampaignRow) => ({ ...toCampaign(r), status: r.status }));
}

// Donations
export async function getDonations(
  supabase: SupabaseClient,
  campaignId?: string
): Promise<AdminDonation[]> {
  let query = supabase.from("donations").select("*");
  if (campaignId) query = query.eq("campaign_id", campaignId);
  else query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  const donations = (data || []).map((d: DonationRow) => ({
    id: d.id,
    campaignId: d.campaign_id,
    campaignTitle: "",
    amount: Number(d.amount),
    donorEmail: d.donor_email ?? "",
    donorName: d.donor_name ?? "",
    anonymous: d.anonymous,
    method: d.method as AdminDonation["method"],
    status: d.status as AdminDonation["status"],
    createdAt: d.created_at,
    referenceNumber: d.reference_number ?? undefined,
    note: d.note ?? undefined,
  }));
  if (campaignId) {
    donations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return donations;
}

export async function createDonation(
  supabase: SupabaseClient,
  donation: Omit<AdminDonation, "id">
): Promise<string> {
  const { data, error } = await supabase
    .from("donations")
    .insert({
      campaign_id: donation.campaignId,
      amount: donation.amount,
      donor_email: donation.donorEmail,
      donor_name: donation.donorName,
      anonymous: donation.anonymous,
      method: donation.method,
      status: donation.status,
      reference_number: donation.referenceNumber,
      note: donation.note,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function recordDonationAndUpdateCampaign(
  supabase: SupabaseClient,
  donation: Omit<AdminDonation, "id">,
  campaignId: string
): Promise<string> {
  const { data: camp, error: campErr } = await supabase
    .from("campaigns")
    .select("goal, raised, backers")
    .eq("id", campaignId)
    .single();
  if (campErr || !camp) throw new Error("Campaign not found");
  const goal = Number(camp.goal) || 0;
  const raised = Number(camp.raised) || 0;
  const backers = Number((camp as { backers?: number }).backers) || 0;
  if (goal > 0 && raised >= goal) {
    throw new Error("Campaign has been fully funded. No further donations are accepted.");
  }
  const refNum = donation.referenceNumber || generateShortRef();
  const { data: don, error: insertErr } = await supabase
    .from("donations")
    .insert({
      campaign_id: campaignId,
      amount: donation.amount,
      donor_email: donation.donorEmail,
      donor_name: donation.donorName,
      anonymous: donation.anonymous,
      method: donation.method,
      status: donation.status,
      reference_number: refNum,
      note: donation.note,
    })
    .select("id")
    .single();
  if (insertErr) throw insertErr;
  const { error: updateErr } = await supabase
    .from("campaigns")
    .update({
      raised: raised + donation.amount,
      backers: backers + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);
  if (updateErr) throw updateErr;
  return don.id;
}

export async function approveDonation(
  supabase: SupabaseClient,
  donationId: string
): Promise<void> {
  const { data: don, error: fetchErr } = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .single();
  if (fetchErr || !don) throw new Error("Donation not found");
  if (don.status === "completed") throw new Error("Donation is already completed");
  const campaignId = don.campaign_id;
  const amount = Number(don.amount);
  if (!campaignId || !Number.isFinite(amount) || amount <= 0) throw new Error("Invalid donation data");
  await supabase
    .from("donations")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", donationId);
  const { data: camp } = await supabase.from("campaigns").select("raised, backers").eq("id", campaignId).single();
  if (camp) {
    await supabase
      .from("campaigns")
      .update({
        raised: Number(camp.raised) + amount,
        backers: Number(camp.backers) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
  }
}

// Campaigns under review
export interface CampaignUnderReviewDoc {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  goal: number;
  category: string;
  creatorName: string;
  creatorId: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  image?: string;
  image2?: string;
}

function toUnderReview(r: CampaignUnderReviewRow): CampaignUnderReviewDoc {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    fullDescription: r.full_description ?? undefined,
    goal: Number(r.goal),
    category: r.category,
    creatorName: r.creator_name,
    creatorId: r.creator_id,
    submittedAt: r.submitted_at ?? r.created_at,
    status: (r.status as CampaignUnderReviewDoc["status"]) || "pending",
    image: r.image ?? undefined,
    image2: r.image2 ?? undefined,
  };
}

export async function addCampaignUnderReview(
  supabase: SupabaseClient,
  data: Omit<CampaignUnderReviewDoc, "id" | "submittedAt" | "status">
): Promise<string> {
  const { data: row, error } = await supabase
    .from("campaigns_under_review")
    .insert({
      title: data.title,
      description: data.description,
      full_description: data.fullDescription ?? data.description,
      goal: data.goal,
      category: data.category,
      creator_name: data.creatorName,
      creator_id: data.creatorId,
      image: data.image,
      image2: data.image2,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  return row.id;
}

export async function getCampaignsUnderReview(
  supabase: SupabaseClient
): Promise<CampaignUnderReviewDoc[]> {
  const { data, error } = await supabase
    .from("campaigns_under_review")
    .select("*")
    .eq("status", "pending");
  if (error) throw error;
  return (data || []).map((r: CampaignUnderReviewRow) => toUnderReview(r));
}

export async function getCampaignsUnderReviewForUser(
  supabase: SupabaseClient,
  creatorId: string
): Promise<CampaignUnderReviewDoc[]> {
  if (!creatorId) return [];
  const { data, error } = await supabase
    .from("campaigns_under_review")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "pending");
  if (error) throw error;
  return (data || []).map((r: CampaignUnderReviewRow) => toUnderReview(r));
}

export async function getCampaignsUnderReviewCount(
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from("campaigns_under_review")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function getCampaignUnderReviewById(
  supabase: SupabaseClient,
  id: string
): Promise<CampaignUnderReviewDoc | null> {
  const { data, error } = await supabase
    .from("campaigns_under_review")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return toUnderReview(data as CampaignUnderReviewRow);
}

export async function approveAndPublishCampaign(
  supabase: SupabaseClient,
  underReviewId: string
): Promise<{ campaignId: string }> {
  const underReview = await getCampaignUnderReviewById(supabase, underReviewId);
  if (!underReview) throw new Error("Campaign under review not found");
  if (underReview.status !== "pending") throw new Error("Campaign is no longer pending");
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_verified, id_verified, address_verified")
    .eq("id", underReview.creatorId)
    .single();
  if (profile && underReview.creatorId) {
    if (!profile.phone_verified) throw new Error("Creator's phone number must be approved before campaign can go live");
    if (!profile.id_verified) throw new Error("Creator's ID must be verified before campaign can go live");
    if (!profile.address_verified) throw new Error("Creator's address must be verified before campaign can go live");
  }
  const defaultImage = "https://picsum.photos/seed/campaign/800/600";
  const { data: newCamp, error: insertErr } = await supabase
    .from("campaigns")
    .insert({
      title: underReview.title,
      description: underReview.description,
      full_description: underReview.fullDescription ?? underReview.description,
      creator: underReview.creatorName,
      creator_type: "individual",
      goal: underReview.goal,
      raised: 0,
      backers: 0,
      days_left: 30,
      category: underReview.category,
      image: underReview.image || defaultImage,
      image2: underReview.image2 || underReview.image || defaultImage,
      location: "",
      status: "live",
      verified: true,
      creator_id: underReview.creatorId,
    })
    .select("id")
    .single();
  if (insertErr) throw insertErr;
  const campaignId = newCamp.id;
  await supabase.from("notifications").insert({
    user_id: underReview.creatorId,
    type: "campaign_approved",
    title: "Campaign approved",
    body: `Your campaign "${underReview.title}" has been approved and is now live.`,
    campaign_id: campaignId,
    read: false,
  });
  await supabase.from("campaigns_under_review").delete().eq("id", underReviewId);
  return { campaignId };
}

export async function updateCampaignUnderReviewStatus(
  supabase: SupabaseClient,
  id: string,
  status: "approved" | "rejected"
): Promise<void> {
  const { error } = await supabase
    .from("campaigns_under_review")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCampaignUnderReview(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("campaigns_under_review").delete().eq("id", id);
  if (error) throw error;
}

// Notifications
export interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  campaignId?: string;
  read: boolean;
  createdAt: string;
}

export async function addNotification(
  supabase: SupabaseClient,
  userId: string,
  data: { type: string; title: string; body: string; campaignId?: string; read: boolean }
): Promise<string> {
  const { data: row, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: data.type,
      title: data.title,
      body: data.body,
      campaign_id: data.campaignId ?? null,
      read: data.read,
    })
    .select("id")
    .single();
  if (error) throw error;
  return row.id;
}

export async function getUserNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    body: r.body,
    campaignId: r.campaign_id,
    read: r.read ?? false,
    createdAt: (r.created_at as string) ?? new Date().toISOString(),
  }));
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
}

// Profiles (admin users list)
export type UserStatus = "active" | "on_hold" | "deleted";

export interface AdminUserDoc {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: UserStatus;
  phoneNumber?: string;
  phoneVerified: boolean;
  phonePending: boolean;
  idDocument?: string;
  idDocumentType?: "social_security" | "passport";
  idVerified: boolean;
  idPending: boolean;
  addressDocument?: string;
  addressPending: boolean;
  verified: boolean;
  addressVerified: boolean;
  createdAt?: string;
}

export async function getUsersFromSupabase(
  supabase: SupabaseClient
): Promise<AdminUserDoc[]> {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id,
    email: (r.email as string) ?? "",
    name: (r.name as string) ?? "",
    role: (r.role as "user" | "admin") ?? "user",
    status: (r.status as UserStatus) ?? "active",
    phoneNumber: r.phone_number,
    phoneVerified: !!r.phone_verified,
    phonePending: !!r.phone_pending,
    idDocument: r.id_document,
    idDocumentType: r.id_document_type,
    idVerified: !!r.id_verified,
    idPending: !!r.id_pending,
    addressDocument: r.address_document,
    addressPending: !!r.address_pending,
    verified: !!r.verified,
    addressVerified: !!r.address_verified,
    createdAt: (r.created_at as string)?.slice?.(0, 19),
  }));
}

export async function setUserPhoneVerified(
  supabase: SupabaseClient,
  userId: string,
  verified: boolean
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ phone_verified: verified, phone_pending: false, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function setIdVerified(
  supabase: SupabaseClient,
  userId: string,
  verified: boolean
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ id_verified: verified, id_pending: false, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function setAddressVerified(
  supabase: SupabaseClient,
  userId: string,
  verified: boolean
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ address_verified: verified, address_pending: false, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function setUserStatus(
  supabase: SupabaseClient,
  userId: string,
  status: UserStatus
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function deleteUserFromSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase.from("profiles").delete().eq("id", userId);
}

// Site config (camelCase keys for app; DB uses snake_case)
const SITE_CONFIG_KEY_MAP: Record<string, string> = {
  siteName: "site_name",
  heroTitle: "hero_title",
  heroSubtitle: "hero_subtitle",
  communityHeadingPart1: "community_heading_part1",
  communityHeadingPart2: "community_heading_part2",
  footerTagline: "footer_tagline",
  footerCopyright: "footer_copyright",
  aboutTitle: "about_title",
  aboutSubtitle: "about_subtitle",
  aboutMission: "about_mission",
  homeFaqs: "home_faqs",
};
const SITE_CONFIG_KEY_MAP_REVERSE: Record<string, string> = {};
Object.entries(SITE_CONFIG_KEY_MAP).forEach(([camel, snake]) => {
  SITE_CONFIG_KEY_MAP_REVERSE[snake] = camel;
});

export async function getSiteContent(
  supabase: SupabaseClient
): Promise<Record<string, string> | null> {
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .eq("id", "content")
    .single();
  if (error || !data) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === "id" || k === "updated_at") continue;
    if (typeof v === "string") {
      out[SITE_CONFIG_KEY_MAP_REVERSE[k] || k] = v;
    }
  }
  return out;
}

export async function setSiteContent(
  supabase: SupabaseClient,
  data: Record<string, string>
): Promise<void> {
  const row: Record<string, unknown> = { id: "content", updated_at: new Date().toISOString() };
  for (const [camel, v] of Object.entries(data)) {
    if (typeof v !== "string") continue;
    const snake = SITE_CONFIG_KEY_MAP[camel] || camel;
    row[snake] = v;
  }
  await supabase.from("site_config").upsert(row, { onConflict: "id" });
}

export async function updateCampaignText(
  supabase: SupabaseClient,
  campaignId: string,
  updates: { title?: string; description?: string; fullDescription?: string }
): Promise<void> {
  const row: Record<string, string> = {};
  if (typeof updates.title === "string") row.title = updates.title.trim();
  if (typeof updates.description === "string") row.description = updates.description.trim();
  if (typeof updates.fullDescription === "string") row.full_description = updates.fullDescription.trim();
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase
    .from("campaigns")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (error) throw error;
}

export interface AdminCreateCampaignPayload {
  title: string;
  description: string;
  fullDescription?: string;
  goal: number;
  category: string;
  location?: string;
  daysLeft?: number;
  creatorType?: "individual" | "organization" | "charity";
  image: string;
  image2?: string;
  creatorName: string;
  creatorId: string | null;
}

export async function adminCreateCampaign(
  supabase: SupabaseClient,
  payload: AdminCreateCampaignPayload
): Promise<string> {
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      title: payload.title.trim(),
      description: payload.description.trim(),
      full_description: (payload.fullDescription ?? payload.description).trim(),
      creator: payload.creatorName.trim(),
      creator_type: payload.creatorType ?? "organization",
      goal: Number(payload.goal) || 0,
      raised: 0,
      backers: 0,
      days_left: Number(payload.daysLeft) ?? 30,
      category: (payload.category || "Other").trim(),
      image: payload.image,
      image2: payload.image2 ?? payload.image,
      location: (payload.location ?? "").trim(),
      verified: true,
      admin_backed: true,
      status: "live",
      creator_id: payload.creatorId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// Hearted campaigns
export async function getHeartedCampaignIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("hearted_campaigns")
    .eq("id", userId)
    .single();
  if (error || !data) return [];
  return (data.hearted_campaigns as string[]) || [];
}

export async function toggleHeartCampaign(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string
): Promise<boolean> {
  const ids = await getHeartedCampaignIds(supabase, userId);
  const index = ids.indexOf(campaignId);
  let newIds: string[];
  let isHearted: boolean;
  if (index > -1) {
    newIds = ids.filter((_, i) => i !== index);
    isHearted = false;
  } else {
    newIds = [...ids, campaignId];
    isHearted = true;
  }
  await supabase
    .from("profiles")
    .update({ hearted_campaigns: newIds, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return isHearted;
}
