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
  // Target display progress (raised / goal).
  // pendingPayout: 35%
  // processingPayout: 78%
  //
  // We keep goal unchanged and only update raised.
  const { data: pending } = await supabase
    .from("campaigns")
    .select("id, goal")
    .eq("id", CAMPAIGN_IDS.pendingPayout)
    .single();

  const { data: processing } = await supabase
    .from("campaigns")
    .select("id, goal")
    .eq("id", CAMPAIGN_IDS.processingPayout)
    .single();

  if (!pending?.goal || !processing?.goal) {
    console.error("Could not load goals for demo campaigns; aborting.");
    process.exit(1);
  }

  const pendingRaised = Math.round(Number(pending.goal) * 0.35);
  const processingRaised = Math.round(Number(processing.goal) * 0.78);

  const { error: e1 } = await supabase
    .from("campaigns")
    .update({ raised: pendingRaised })
    .eq("id", CAMPAIGN_IDS.pendingPayout);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from("campaigns")
    .update({ raised: processingRaised })
    .eq("id", CAMPAIGN_IDS.processingPayout);
  if (e2) throw e2;

  console.log("Updated demo campaign progress:", {
    pendingPayout: { raised: pendingRaised, goal: pending.goal, pct: (pendingRaised / Number(pending.goal)) * 100 },
    processingPayout: { raised: processingRaised, goal: processing.goal, pct: (processingRaised / Number(processing.goal)) * 100 },
  });
}

main().catch((e) => {
  console.error("Failed to update demo campaign progress:", e);
  process.exit(1);
});

