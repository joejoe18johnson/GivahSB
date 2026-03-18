import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

// Must match IDs from scripts/seed-demo-user.ts
const CAMPAIGN_IDS = {
  pendingPayout: "9d1b5b4e-7c6b-4e4a-93c5-1d8f7e000101",
  processingPayout: "9d1b5b4e-7c6b-4e4a-93c5-1d8f7e000102",
} as const;

async function main() {
  const { data: before } = await supabase
    .from("payout_requests")
    .select("id,status,campaign_id")
    .eq("campaign_id", CAMPAIGN_IDS.processingPayout)
    .maybeSingle();

  const { data: updated, error } = await supabase
    .from("payout_requests")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("campaign_id", CAMPAIGN_IDS.processingPayout)
    .select("id,status,campaign_id");

  if (error) throw error;

  console.log("Updated demo payout request:", {
    before,
    updated,
  });
}

main().catch((e) => {
  console.error("Failed to update demo payout status:", e);
  process.exit(1);
});

