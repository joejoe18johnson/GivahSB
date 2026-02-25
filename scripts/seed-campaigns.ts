/**
 * Seed 40 demo campaigns into Supabase (8 fully funded, 32 in progress).
 * Requires .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run seed
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const CATEGORIES = ["Medical", "Education", "Community", "Emergency", "Other"] as const;
const CREATOR_TYPES = ["individual", "organization", "charity"] as const;
const LOCATIONS = [
  "Belize City, Belize",
  "Dangriga, Belize",
  "San Ignacio, Cayo District, Belize",
  "Orange Walk Town, Belize",
  "Corozal Town, Belize",
  "Toledo District, Belize",
  "Belmopan, Belize",
  "Punta Gorda, Belize",
  "Caye Caulker, Belize",
  "Placencia, Belize",
];

function campaign(
  n: number,
  opts: { title: string; description: string; fullDescription: string; creator: string; creatorType: typeof CREATOR_TYPES[number]; category: string; location: string; goal: number; raised: number; backers: number; daysLeft: number; fullyFunded?: boolean }
) {
  const id = `a1b2c3d4-${String(n).padStart(4, "0")}-4000-8000-0000000000${String(n).padStart(2, "0")}`;
  const created = new Date(Date.now() - (40 - n) * 2 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    title: opts.title,
    description: opts.description,
    full_description: opts.fullDescription,
    creator: opts.creator,
    creator_type: opts.creatorType,
    creator_id: null,
    goal: opts.goal,
    raised: opts.raised,
    backers: opts.backers,
    days_left: opts.daysLeft,
    category: opts.category,
    image: `https://picsum.photos/seed/givah${n}/800/600`,
    image2: null,
    location: opts.location,
    status: "live" as const,
    verified: true,
    admin_backed: false,
    created_at: created,
    updated_at: new Date().toISOString(),
  };
}

const DEMO_CAMPAIGNS = [
  // --- 8 FULLY FUNDED (raised >= goal) ---
  campaign(1, {
    title: "Medical Treatment for Maria's Daughter",
    description: "Urgent funds needed for 8-year-old Maria's daughter who requires specialized surgery at KHMH.",
    fullDescription: "Maria's 8-year-old daughter was diagnosed with a congenital heart condition requiring surgery at Karl Heusner Memorial Hospital (KHMH) in Belize City. The family has exhausted savings. We are seeking community support for medical expenses and post-operative care.",
    creator: "Maria Gonzalez",
    creatorType: "individual",
    category: "Medical",
    location: "Belize City, Belize",
    goal: 5000,
    raised: 5000,
    backers: 142,
    daysLeft: 0,
    fullyFunded: true,
  }),
  campaign(2, {
    title: "Hurricane Relief for Dangriga Community",
    description: "Rebuilding homes and providing essential supplies for families affected by recent hurricane damage.",
    fullDescription: "The recent hurricane left many families in Dangriga without homes and basic necessities. Our organization provides immediate relief: food, clean water, temporary shelter, and rebuilding materials. All funds go directly to affected families.",
    creator: "Dangriga Community Relief Organization",
    creatorType: "organization",
    category: "Emergency",
    location: "Dangriga, Belize",
    goal: 5000,
    raised: 5200,
    backers: 234,
    daysLeft: 0,
    fullyFunded: true,
  }),
  campaign(3, {
    title: "School Supplies for Rural Toledo District",
    description: "Books, uniforms, and school supplies for 200+ children in rural Toledo who cannot afford them.",
    fullDescription: "Many children in rural Toledo cannot attend school due to lack of supplies. Our charity provides books, uniforms, and materials. We work with local schools to identify children in need and distribute at the start of each school year.",
    creator: "Belize Education Foundation",
    creatorType: "charity",
    category: "Education",
    location: "Toledo District, Belize",
    goal: 3500,
    raised: 3500,
    backers: 98,
    daysLeft: 0,
    fullyFunded: true,
  }),
  campaign(4, {
    title: "Emergency Surgery for Carlos",
    description: "Carlos needs urgent surgery to repair a work-related injury to support his family.",
    fullDescription: "Carlos, a construction worker and father of three, suffered a severe injury requiring immediate surgery. Insurance was delayed. We raised funds to cover surgery and help his family during recovery.",
    creator: "Carlos Mendez",
    creatorType: "individual",
    category: "Medical",
    location: "San Ignacio, Cayo District, Belize",
    goal: 4500,
    raised: 4600,
    backers: 87,
    daysLeft: 0,
    fullyFunded: true,
  }),
  campaign(5, {
    title: "Community Center Renovation in Orange Walk",
    description: "Renovating the community center for youth programs, senior activities, and community events.",
    fullDescription: "Our community center in Orange Walk has served for over 30 years but needs urgent repairs: roof, electrical, and accessibility. Funds will restore it as a hub for youth, seniors, and gatherings.",
    creator: "Orange Walk Community Association",
    creatorType: "organization",
    category: "Community",
    location: "Orange Walk Town, Belize",
    goal: 5000,
    raised: 5000,
    backers: 156,
    daysLeft: 0,
    fullyFunded: true,
  }),
  campaign(6, {
    title: "Food Assistance for Elderly in Corozal",
    description: "Monthly food packages and meals for elderly residents struggling to afford basic nutrition.",
    fullDescription: "Many elderly in Corozal live on fixed incomes that don't cover food. Our program provides monthly food packages and hot meals. We work with local suppliers to serve over 100 seniors.",
    creator: "Corozal Senior Support Network",
    creatorType: "charity",
    category: "Community",
    location: "Corozal Town, Belize",
    goal: 2500,
    raised: 2500,
    backers: 78,
    daysLeft: 0,
    fullyFunded: true,
  }),
  campaign(7, {
    title: "Fire Recovery for Belize City Family",
    description: "A family lost their home in a house fire. Help them rebuild and replace essentials.",
    fullDescription: "A house fire destroyed the Thompson family home in Belize City. They lost clothing, furniture, and documents. The family of five is staying with relatives. Funds will help with housing, essentials, and rebuilding.",
    creator: "Sarah Thompson",
    creatorType: "individual",
    category: "Emergency",
    location: "Belize City, Belize",
    goal: 5000,
    raised: 5100,
    backers: 189,
    daysLeft: 0,
    fullyFunded: true,
  }),
  campaign(8, {
    title: "Youth Sports Equipment for Cayo District",
    description: "Sports equipment and coaching for underprivileged youth in Cayo.",
    fullDescription: "Young people in Cayo lack access to organized sports. We equip youth programs with footballs, nets, uniforms, and safety gear, and fund trained coaches for after-school programs.",
    creator: "Cayo Youth Initiative",
    creatorType: "organization",
    category: "Community",
    location: "San Ignacio, Cayo District, Belize",
    goal: 4000,
    raised: 4000,
    backers: 124,
    daysLeft: 0,
    fullyFunded: true,
  }),
  // --- 32 IN PROGRESS ---
  campaign(9, { title: "Dialysis Treatment for Pedro", description: "Ongoing dialysis costs for Pedro, a father of two.", fullDescription: "Pedro requires regular dialysis. His family cannot cover the full cost. Community support will help him continue treatment and stay with his family.", creator: "Pedro's Family", creatorType: "individual", category: "Medical", location: "Belize City, Belize", goal: 6000, raised: 2100, backers: 45, daysLeft: 18 }),
  campaign(10, { title: "Roof Repair After Storm", description: "Replace roof for a single mother after storm damage.", fullDescription: "A single mother's roof was severely damaged in a storm. She and her children are at risk. Funds will cover materials and labor for a safe roof.", creator: "Linda Martinez", creatorType: "individual", category: "Emergency", location: "Dangriga, Belize", goal: 3500, raised: 1200, backers: 32, daysLeft: 22 }),
  campaign(11, { title: "Scholarship Fund for Toledo Students", description: "Scholarships for 20 secondary students in Toledo.", fullDescription: "We provide scholarships for secondary school students in Toledo whose families cannot afford fees and supplies. Your support keeps students in school.", creator: "Toledo Education Trust", creatorType: "charity", category: "Education", location: "Toledo District, Belize", goal: 4000, raised: 1850, backers: 56, daysLeft: 14 }),
  campaign(12, { title: "Flood Relief in Belmopan", description: "Emergency supplies for families displaced by flooding.", fullDescription: "Recent flooding in Belmopan displaced dozens of families. We are providing food, water, shelter, and cleaning supplies. All donations go directly to affected households.", creator: "Belmopan Relief Fund", creatorType: "organization", category: "Emergency", location: "Belmopan, Belize", goal: 5500, raised: 2900, backers: 89, daysLeft: 10 }),
  campaign(13, { title: "Wheelchair for Mr. Hernandez", description: "Motorized wheelchair for an elderly stroke survivor.", fullDescription: "Mr. Hernandez had a stroke and needs a motorized wheelchair to remain mobile and independent. His family cannot afford one. Your gift will change his daily life.", creator: "Hernandez Family", creatorType: "individual", category: "Medical", location: "Orange Walk Town, Belize", goal: 2800, raised: 950, backers: 28, daysLeft: 25 }),
  campaign(14, { title: "After-School Tutoring in Corozal", description: "Free tutoring and meals for at-risk kids in Corozal.", fullDescription: "We run an after-school program in Corozal offering tutoring and a nutritious meal. Many children have nowhere to go after school. Funds cover tutors, food, and materials.", creator: "Corozal Kids First", creatorType: "charity", category: "Education", location: "Corozal Town, Belize", goal: 3200, raised: 1400, backers: 41, daysLeft: 19 }),
  campaign(15, { title: "Repair Community Well in Punta Gorda", description: "Restore the only community well in a Punta Gorda neighborhood.", fullDescription: "The community well in a Punta Gorda neighborhood has failed. Families are without reliable water. We need to repair the pump and piping. Every dollar helps restore access to clean water.", creator: "Punta Gorda Water Project", creatorType: "organization", category: "Community", location: "Punta Gorda, Belize", goal: 2200, raised: 880, backers: 24, daysLeft: 28 }),
  campaign(16, { title: "Cancer Treatment for Ana", description: "Help cover chemotherapy and travel for Ana's cancer treatment.", fullDescription: "Ana was diagnosed with cancer and needs chemotherapy. Treatment is in Belize City; she lives in the district. Funds will cover treatment costs and travel for her and a caregiver.", creator: "Ana's Support Circle", creatorType: "individual", category: "Medical", location: "Caye Caulker, Belize", goal: 7500, raised: 3200, backers: 72, daysLeft: 12 }),
  campaign(17, { title: "School Bus for Rural Cayo", description: "Second-hand bus to transport students to school in rural Cayo.", fullDescription: "Children in a rural Cayo area walk long distances to school. A donated bus would be refurbished and used to pick them up safely. We have a driver and route; we need the vehicle.", creator: "Cayo School Transport", creatorType: "organization", category: "Education", location: "San Ignacio, Cayo District, Belize", goal: 8000, raised: 4100, backers: 98, daysLeft: 8 }),
  campaign(18, { title: "Rebuild After House Fire", description: "Rebuild a family home lost to fire in Belize City.", fullDescription: "A family of four lost their home and belongings in a fire. They are staying with relatives. We are raising funds for rebuilding materials and essential furnishings.", creator: "Belize City Fire Relief", creatorType: "organization", category: "Emergency", location: "Belize City, Belize", goal: 4500, raised: 1680, backers: 52, daysLeft: 16 }),
  campaign(19, { title: "Prosthetic Limb for James", description: "Custom prosthetic limb for an amputee so he can work again.", fullDescription: "James lost a limb in an accident. A prosthetic would allow him to return to work and support his family. The cost is beyond what his family can pay. We are raising the full amount.", creator: "James Williams", creatorType: "individual", category: "Medical", location: "Belmopan, Belize", goal: 5500, raised: 2200, backers: 61, daysLeft: 20 }),
  campaign(20, { title: "Library Books for Orange Walk Schools", description: "New books and shelves for three primary school libraries.", fullDescription: "Three primary schools in Orange Walk have outdated, sparse libraries. We want to buy new books and install shelves so every child can borrow books. Literacy opens futures.", creator: "Orange Walk Reading Project", creatorType: "charity", category: "Education", location: "Orange Walk Town, Belize", goal: 3000, raised: 1100, backers: 35, daysLeft: 24 }),
  campaign(21, { title: "Hurricane Shelter Supplies", description: "Stock a community hurricane shelter with food and first aid.", fullDescription: "Our community hurricane shelter needs to be stocked before the next season: non-perishable food, water, first aid kits, and basic hygiene supplies. Your donation prepares us to help neighbors in need.", creator: "Dangriga Shelter Committee", creatorType: "organization", category: "Emergency", location: "Dangriga, Belize", goal: 3800, raised: 1550, backers: 44, daysLeft: 11 }),
  campaign(22, { title: "Dental Care for 50 Children", description: "Free dental check-ups and treatment for 50 children in need.", fullDescription: "Many children in our area have never seen a dentist. We are organizing a free dental clinic for 50 children: check-ups, cleanings, and basic treatment. Dentists are volunteering; we need supplies and logistics.", creator: "Belize Dental Outreach", creatorType: "charity", category: "Medical", location: "Placencia, Belize", goal: 2600, raised: 920, backers: 29, daysLeft: 21 }),
  campaign(23, { title: "Youth Music Program in Belmopan", description: "Instruments and lessons for a youth music program.", fullDescription: "We run a free music program for youth in Belmopan. We need more instruments and paid instructors so more kids can join. Music builds confidence and discipline.", creator: "Belmopan Music Initiative", creatorType: "organization", category: "Community", location: "Belmopan, Belize", goal: 3400, raised: 1300, backers: 38, daysLeft: 17 }),
  campaign(24, { title: "Emergency Surgery for Baby Sofia", description: "Surgery for an infant with a heart defect.", fullDescription: "Baby Sofia was born with a heart defect requiring surgery. Her parents cannot afford the full cost. The surgery is scheduled; we are raising funds to cover the hospital and follow-up care.", creator: "Sofia's Parents", creatorType: "individual", category: "Medical", location: "Belize City, Belize", goal: 6500, raised: 3800, backers: 112, daysLeft: 6 }),
  campaign(25, { title: "School Renovation in Punta Gorda", description: "Repair classrooms and bathrooms at a Punta Gorda primary school.", fullDescription: "A primary school in Punta Gorda has leaking roofs and broken bathrooms. We want to repair classrooms and install proper sanitation so students learn in a safe environment.", creator: "Punta Gorda School Fund", creatorType: "charity", category: "Education", location: "Punta Gorda, Belize", goal: 4200, raised: 1950, backers: 48, daysLeft: 13 }),
  campaign(26, { title: "Fisherman Boat Repair", description: "Repair a fisherman's boat so he can earn again after storm damage.", fullDescription: "A coastal fisherman's boat was damaged in a storm. Without it he cannot fish or support his family. We are raising funds for repairs so he can return to work.", creator: "Coastal Fishermen Aid", creatorType: "organization", category: "Emergency", location: "Caye Caulker, Belize", goal: 2800, raised: 1050, backers: 27, daysLeft: 23 }),
  campaign(27, { title: "Diabetes Supplies for Seniors", description: "Glucose monitors and supplies for 30 elderly diabetics.", fullDescription: "Many elderly diabetics in our area cannot afford consistent testing and supplies. We provide glucose monitors, test strips, and basic education. Your donation extends the program to 30 more seniors.", creator: "Belize Diabetes Support", creatorType: "charity", category: "Medical", location: "Orange Walk Town, Belize", goal: 2400, raised: 860, backers: 22, daysLeft: 26 }),
  campaign(28, { title: "Flood Recovery in Southern Belize", description: "Clean-up and repair for families after severe flooding.", fullDescription: "Severe flooding in southern Belize damaged homes and crops. Families need help with clean-up, minor repairs, and replacement of lost items. We distribute funds and supplies directly to affected households.", creator: "Southern Belize Flood Relief", creatorType: "organization", category: "Emergency", location: "Toledo District, Belize", goal: 5000, raised: 2400, backers: 67, daysLeft: 9 }),
  campaign(29, { title: "Art Supplies for School Clubs", description: "Paints, brushes, and materials for after-school art clubs.", fullDescription: "Several schools want to run after-school art clubs but lack supplies. We will buy paints, brushes, paper, and other materials and distribute them to five schools. Art helps children express themselves.", creator: "Belize Art in Schools", creatorType: "charity", category: "Education", location: "Belize City, Belize", goal: 1800, raised: 720, backers: 31, daysLeft: 30 }),
  campaign(30, { title: "Community Garden in Corozal", description: "Start a community garden to grow fresh produce for families.", fullDescription: "We want to turn an empty lot in Corozal into a community garden. Families will grow vegetables and learn gardening. We need seeds, tools, fencing, and a water connection. The land is donated.", creator: "Corozal Green Project", creatorType: "organization", category: "Community", location: "Corozal Town, Belize", goal: 2200, raised: 890, backers: 26, daysLeft: 19 }),
  campaign(31, { title: "Hip Replacement for Mrs. Garcia", description: "Surgery and rehab for an elderly woman who cannot walk.", fullDescription: "Mrs. Garcia needs a hip replacement to walk again without pain. She has waited years. Her family has saved what they can; we are raising the rest for surgery and rehabilitation.", creator: "Garcia Family", creatorType: "individual", category: "Medical", location: "San Ignacio, Cayo District, Belize", goal: 7000, raised: 3100, backers: 78, daysLeft: 7 }),
  campaign(32, { title: "Teacher Training in Toledo", description: "Training for 15 teachers in reading and math instruction.", fullDescription: "We organize training for primary teachers in Toledo to improve reading and math instruction. Teachers attend workshops and receive materials. Your donation covers facilitator fees, materials, and venue.", creator: "Toledo Teacher Development", creatorType: "charity", category: "Education", location: "Toledo District, Belize", goal: 3600, raised: 1420, backers: 39, daysLeft: 15 }),
  campaign(33, { title: "Stove and Tank for 20 Families", description: "Safe stoves and propane tanks for families cooking on open fire.", fullDescription: "Many families still cook on open fire, which is dangerous and unhealthy. We provide safe stoves and initial propane tanks to 20 families. This reduces burns and respiratory illness.", creator: "Safe Cooking Belize", creatorType: "organization", category: "Community", location: "Dangriga, Belize", goal: 3000, raised: 1180, backers: 34, daysLeft: 22 }),
  campaign(34, { title: "Ambulance Fuel Fund", description: "Fuel for community ambulance for three months.", fullDescription: "Our rural community has one volunteer ambulance. It often runs out of fuel money and cannot respond. We are raising three months of fuel so it can serve everyone in need.", creator: "Rural Ambulance Fund", creatorType: "organization", category: "Emergency", location: "Belmopan, Belize", goal: 1500, raised: 620, backers: 18, daysLeft: 27 }),
  campaign(35, { title: "Vision Care for 40 Students", description: "Eye exams and glasses for students who cannot see the board.", fullDescription: "Many students struggle in school because they need glasses. We are organizing a vision clinic for 40 students: exams and free glasses. Optometrists are volunteering; we need materials and frames.", creator: "Belize Vision for Learning", creatorType: "charity", category: "Medical", location: "Belize City, Belize", goal: 2000, raised: 810, backers: 25, daysLeft: 24 }),
  campaign(36, { title: "Disaster Preparedness Kits", description: "Emergency kits for 100 families in flood-prone areas.", fullDescription: "We distribute disaster preparedness kits to families in flood-prone areas: first aid, flashlight, water purification, non-perishable food, and instructions. Your donation helps us reach 100 more families.", creator: "Belize Preparedness Project", creatorType: "organization", category: "Emergency", location: "Placencia, Belize", goal: 4000, raised: 1650, backers: 47, daysLeft: 11 }),
  campaign(37, { title: "Vocational Training for Youth", description: "Six-month carpentry and electrical training for 12 youth.", fullDescription: "We run a vocational program teaching carpentry and basic electrical skills to youth who did not finish school. Graduates get help finding work. Funds cover tools, materials, and instructor stipends.", creator: "Belize Youth Skills", creatorType: "charity", category: "Education", location: "Orange Walk Town, Belize", goal: 4800, raised: 1920, backers: 53, daysLeft: 8 }),
  campaign(38, { title: "Furniture for New Mothers", description: "Cribs and essentials for 15 new mothers in need.", fullDescription: "We support new mothers who cannot afford a safe place for their baby to sleep. We provide cribs, mattresses, and basic baby essentials. Your gift keeps infants safe and helps families get a good start.", creator: "Belize New Mothers Fund", creatorType: "charity", category: "Community", location: "Belize City, Belize", goal: 2700, raised: 980, backers: 30, daysLeft: 16 }),
  campaign(39, { title: "Burn Victim Care", description: "Medical and recovery support for a young burn victim.", fullDescription: "A child suffered serious burns in a home accident. He needs ongoing treatment and rehabilitation. The family cannot cover all costs. We are raising funds for his care and recovery.", creator: "Family of Miguel", creatorType: "individual", category: "Medical", location: "Dangriga, Belize", goal: 5500, raised: 2350, backers: 64, daysLeft: 5 }),
  campaign(40, { title: "Playground for San Ignacio School", description: "Safe playground equipment for a primary school.", fullDescription: "A primary school in San Ignacio has no proper playground. We want to install safe, durable equipment so children can play at recess. The school has cleared the space; we need the equipment and installation.", creator: "San Ignacio School Parents", creatorType: "organization", category: "Community", location: "San Ignacio, Cayo District, Belize", goal: 3200, raised: 1280, backers: 42, daysLeft: 20 }),
];

/** Donor names/emails for seeded donations (cycle through; ~25% anonymous). */
const DONOR_POOL: Array<{ name: string; email: string }> = [
  { name: "John Smith", email: "john.donor@email.com" },
  { name: "Patricia Martinez", email: "patricia.m@email.com" },
  { name: "Robert Brown", email: "robert.b@email.com" },
  { name: "Sarah Johnson", email: "sarah.j@email.com" },
  { name: "Michael Thompson", email: "michael.t@email.com" },
  { name: "Emily Chen", email: "emily.c@email.com" },
  { name: "James Rodriguez", email: "james.r@email.com" },
  { name: "Maria Gonzalez", email: "maria.g@email.com" },
  { name: "Thomas King", email: "thomas.k@email.com" },
  { name: "Nancy Perez", email: "nancy.p@email.com" },
  { name: "Linda Smith", email: "linda.s@email.com" },
  { name: "Karen Williams", email: "karen.w@email.com" },
  { name: "Jennifer Lee", email: "jennifer.l@email.com" },
  { name: "Paul Rodriguez", email: "paul.r@email.com" },
  { name: "Susan Martinez", email: "susan.m@email.com" },
  { name: "Frank Brown", email: "frank.b@email.com" },
  { name: "Helen Johnson", email: "helen.j@email.com" },
  { name: "George Martinez", email: "george.m@email.com" },
  { name: "Belize Corp", email: "donor@company.bz" },
  { name: "David Wilson", email: "david.w@email.com" },
];

const METHODS = ["bank", "digiwallet", "ekyash"] as const;

/** Build donation amounts that sum exactly to `raised` with `backers` count (integers). */
function donationAmounts(raised: number, backers: number): number[] {
  if (backers <= 0) return [];
  if (backers === 1) return [raised];
  const base = Math.floor(raised / backers);
  const remainder = raised - base * backers;
  const amounts: number[] = [];
  for (let i = 0; i < backers - remainder; i++) amounts.push(base);
  for (let i = 0; i < remainder; i++) amounts.push(base + 1);
  return amounts;
}

function buildDonations() {
  const rows: Array<{
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
  }> = [];
  const now = new Date();
  for (const c of DEMO_CAMPAIGNS) {
    const backers = c.backers ?? 0;
    const raised = c.raised ?? 0;
    if (backers === 0) continue;
    const amounts = donationAmounts(raised, backers);
    for (let i = 0; i < backers; i++) {
      const isAnonymous = i % 4 === 0; // ~25% anonymous
      const donor = isAnonymous ? null : DONOR_POOL[i % DONOR_POOL.length];
      const created = new Date(now.getTime() - (backers - i) * 3600 * 1000).toISOString();
      rows.push({
        id: crypto.randomUUID(),
        campaign_id: c.id,
        amount: amounts[i],
        donor_email: isAnonymous ? null : donor!.email,
        donor_name: isAnonymous ? null : donor!.name,
        anonymous: isAnonymous,
        method: METHODS[i % METHODS.length],
        status: "completed",
        reference_number: null,
        note: null,
        created_at: created,
        updated_at: created,
      });
    }
  }
  return rows;
}

async function seed() {
  console.log("Seeding 40 demo campaigns (8 fully funded, 32 in progress)...");
  const { error: campaignsError } = await supabase.from("campaigns").upsert(DEMO_CAMPAIGNS, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (campaignsError) {
    console.error("Seed failed:", campaignsError.message);
    process.exit(1);
  }
  console.log("Campaigns done. Seeding donations so each campaign has backers count and amounts sum to raised...");
  const campaignIds = DEMO_CAMPAIGNS.map((c) => c.id);
  const { error: delError } = await supabase.from("donations").delete().in("campaign_id", campaignIds);
  if (delError) {
    console.error("Delete existing demo donations failed:", delError.message);
    process.exit(1);
  }
  const donations = buildDonations();
  const BATCH = 500;
  for (let i = 0; i < donations.length; i += BATCH) {
    const chunk = donations.slice(i, i + BATCH);
    const { error: donError } = await supabase.from("donations").upsert(chunk, {
      onConflict: "id",
      ignoreDuplicates: false,
    });
    if (donError) {
      console.error("Donations seed failed:", donError.message);
      process.exit(1);
    }
  }
  console.log("Done. Inserted/updated", DEMO_CAMPAIGNS.length, "campaigns and", donations.length, "donations.");
}

seed();
