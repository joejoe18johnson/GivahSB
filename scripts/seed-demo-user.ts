import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const DEMO_EMAIL = "demo@givahbz.com";
const DEMO_PASSWORD = "password123";
const DEMO_NAME = "demo";

// Fixed IDs so the script is re-runnable/idempotent.
const CAMPAIGN_IDS = {
  pendingPayout: "9d1b5b4e-7c6b-4e4a-93c5-1d8f7e000101",
  processingPayout: "9d1b5b4e-7c6b-4e4a-93c5-1d8f7e000102",
  completedNoRequest1: "9d1b5b4e-7c6b-4e4a-93c5-1d8f7e000103",
  completedNoRequest2: "9d1b5b4e-7c6b-4e4a-93c5-1d8f7e000104",
} as const;

const PAYOUT_REQUEST_IDS = {
  pending: "ab1e2f3a-4b5c-6d7e-8f90-a1b2c3d4e501",
  processing: "ab1e2f3a-4b5c-6d7e-8f90-a1b2c3d4e502",
} as const;

async function getOrCreateDemoUser(): Promise<string> {
  const existing = await supabase.auth.admin.listUsers();
  const found = existing.data.users.find((u) => (u.email ?? "").toLowerCase() === DEMO_EMAIL.toLowerCase());
  if (found?.id) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: DEMO_NAME },
  });
  if (error) throw error;
  if (!data.user?.id) throw new Error("Demo user creation failed (missing user id)");
  return data.user.id;
}

async function ensureDemoProfile(userId: string): Promise<void> {
  // App gates "fully verified" using phone_verified, id_verified, address_verified.
  const row = {
    id: userId,
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    role: "user",
    status: "active",
    verified: true,
    email_verified: true,
    phone_number: "0000000000",
    phone_verified: true,
    phone_pending: false,
    id_document: "demo-id",
    id_document_type: "passport",
    id_verified: true,
    id_pending: false,
    address_document: "demo-address",
    address_verified: true,
    address_pending: false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

async function seedDemoCampaigns(userId: string): Promise<void> {
  const common = {
    creator: DEMO_NAME,
    creatorType: "individual" as const,
    creatorId: userId,
    verified: true,
    adminBacked: false,
    status: "live" as const,
  };

  const campaigns = [
    {
      id: CAMPAIGN_IDS.pendingPayout,
      title: "Pediatric Fever Care for Lily",
      description: "Support Lily’s recovery with doctor visits, medication, and monitoring.",
      full_description:
        "Lily has persistent fevers and needs repeated pediatric checkups, medication, and follow-up monitoring. Her family cannot cover the costs, and this fundraiser will help pay for treatment and transport.",
      creator: common.creator,
      creator_type: common.creatorType,
      creator_id: common.creatorId,
      goal: 8200,
      raised: 8200,
      backers: 61,
      days_left: 0,
      category: "Medical expenses",
      image: "/little-warriors/y1.jpg",
      image2: "/little-warriors/y2.jpg",
      location: "Belmopan, Belize",
      status: common.status,
      verified: common.verified,
      admin_backed: common.adminBacked,
      is_little_warriors: false,
    },
    {
      id: CAMPAIGN_IDS.processingPayout,
      title: "Breathing Support for Omar’s ICU Recovery",
      description: "ICU-related care, medications, and post-discharge support for Omar.",
      full_description:
        "Omar was admitted for a severe respiratory infection. He requires ongoing ICU support, medications, and follow-up care after discharge. Your support will help cover hospital-related costs and therapy appointments.",
      creator: common.creator,
      creator_type: common.creatorType,
      creator_id: common.creatorId,
      goal: 9700,
      raised: 9700,
      backers: 78,
      days_left: 0,
      category: "Medical expenses",
      image: "/little-warriors/x1.jpg",
      image2: "/little-warriors/x2.jpeg",
      location: "Orange Walk Town, Belize",
      status: common.status,
      verified: common.verified,
      admin_backed: common.adminBacked,
      is_little_warriors: false,
    },
    {
      id: CAMPAIGN_IDS.completedNoRequest1,
      title: "Chest Treatment for Baby Nia",
      description: "Help cover pediatric medicine, monitoring, and clinic visits for Nia.",
      full_description:
        "Nia is dealing with recurring chest infections. Her family needs help paying for pediatric medications, clinic visits, and monitoring to prevent complications and support healthy recovery.",
      creator: common.creator,
      creator_type: common.creatorType,
      creator_id: common.creatorId,
      goal: 7600,
      raised: 7600,
      backers: 52,
      days_left: 0,
      category: "Medical expenses",
      image: "/little-warriors/v1.jpg",
      image2: "/little-warriors/v2.jpg",
      location: "Dangriga, Belize",
      status: common.status,
      verified: common.verified,
      admin_backed: common.adminBacked,
      is_little_warriors: false,
    },
    {
      id: CAMPAIGN_IDS.completedNoRequest2,
      title: "Pediatric Oxygen Care for Theo",
      description: "Specialist follow-up and oxygen therapy support for Theo.",
      full_description:
        "Theo was rushed in with breathing distress and now needs continued pediatric oxygen support and specialist follow-up. This fundraiser helps cover therapy costs, medicine, and transport to appointments.",
      creator: common.creator,
      creator_type: common.creatorType,
      creator_id: common.creatorId,
      goal: 10300,
      raised: 10300,
      backers: 84,
      days_left: 0,
      category: "Medical expenses",
      image: "/little-warriors/a1.jpg",
      image2: "/little-warriors/a2.jpg",
      location: "San Ignacio, Cayo District, Belize",
      status: common.status,
      verified: common.verified,
      admin_backed: common.adminBacked,
      is_little_warriors: false,
    },
  ];

  const { error } = await supabase.from("campaigns").upsert(campaigns as any, { onConflict: "id" });
  if (error) throw error;
}

async function seedDemoPayouts(userId: string): Promise<void> {
  // Only 2 payout requests total:
  // - one pending payout
  // - one ongoing payout (processing)
  const payouts = [
    {
      id: PAYOUT_REQUEST_IDS.pending,
      campaign_id: CAMPAIGN_IDS.pendingPayout,
      user_id: userId,
      bank_name: "Scotiabank (Belize) Limited",
      account_type: "savings",
      account_number: "001234567890",
      account_holder_name: DEMO_NAME,
      branch: "Belize City",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: PAYOUT_REQUEST_IDS.processing,
      campaign_id: CAMPAIGN_IDS.processingPayout,
      user_id: userId,
      bank_name: "Scotiabank (Belize) Limited",
      account_type: "savings",
      account_number: "001234567890",
      account_holder_name: DEMO_NAME,
      branch: "Belize City",
      status: "processing",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Ensure we don't duplicate if re-running.
  const { error: delErr } = await supabase
    .from("payout_requests")
    .delete()
    .in("campaign_id", [CAMPAIGN_IDS.pendingPayout, CAMPAIGN_IDS.processingPayout]);
  if (delErr) throw delErr;

  const { error } = await supabase.from("payout_requests").upsert(payouts as any, { onConflict: "campaign_id" });
  if (error) throw error;
}

async function main() {
  const userId = await getOrCreateDemoUser();
  await ensureDemoProfile(userId);
  await seedDemoCampaigns(userId);
  await seedDemoPayouts(userId);

  console.log("Demo user seeded:", { email: DEMO_EMAIL, userId });
  console.log("Created 4 successful campaigns and 2 payout requests (pending + processing).");
}

main().catch((e) => {
  console.error("Seed demo user failed:", e);
  process.exit(1);
});

