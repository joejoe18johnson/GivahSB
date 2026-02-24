/**
 * Seed demo campaigns into Supabase. Requires .env with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
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

const DEMO_CAMPAIGNS = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    title: "Medical Treatment for Maria's Daughter",
    description: "Urgent funds needed for 8-year-old Maria's daughter who requires specialized surgery at KHMH. Family cannot afford the medical expenses.",
    full_description: "Maria's 8-year-old daughter was recently diagnosed with a congenital heart condition that requires immediate surgery. The family has exhausted their savings and insurance coverage. The surgery must be performed at Karl Heusner Memorial Hospital (KHMH) in Belize City. We are seeking support from the Belizean community to help cover the medical expenses, hospital stay, and post-operative care. Any contribution, no matter how small, will make a difference in this child's life.",
    creator: "Maria Gonzalez",
    creator_type: "individual",
    creator_id: null,
    goal: 5000,
    raised: 2920,
    backers: 142,
    days_left: 12,
    category: "Medical",
    image: "https://picsum.photos/seed/medical1/800/600",
    image2: null,
    location: "Belize City, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-02-05T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    title: "Hurricane Relief for Dangriga Community",
    description: "Rebuilding homes and providing essential supplies for families affected by recent hurricane damage in Dangriga.",
    full_description: "The recent hurricane has left many families in Dangriga without homes and basic necessities. Our organization is working to provide immediate relief including food, clean water, temporary shelter, and rebuilding materials. We need your support to help these families get back on their feet. All funds will go directly to purchasing supplies and materials for affected families.",
    creator: "Dangriga Community Relief Organization",
    creator_type: "organization",
    creator_id: null,
    goal: 5000,
    raised: 3640,
    backers: 234,
    days_left: 18,
    category: "Disaster Relief",
    image: "https://picsum.photos/seed/disaster1/800/600",
    image2: null,
    location: "Dangriga, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-01-28T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    title: "School Supplies for Rural Toledo District",
    description: "Providing books, uniforms, and school supplies for 200+ children in rural Toledo District who cannot afford them.",
    full_description: "Many children in rural Toledo District are unable to attend school because their families cannot afford basic supplies like books, uniforms, and writing materials. Our charity aims to ensure every child has access to education by providing these essential items. We work directly with schools in the area to identify children in need and distribute supplies at the start of each school year.",
    creator: "Belize Education Foundation",
    creator_type: "charity",
    creator_id: null,
    goal: 3500,
    raised: 2275,
    backers: 98,
    days_left: 25,
    category: "Education",
    image: "https://picsum.photos/seed/education1/800/600",
    image2: null,
    location: "Toledo District, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-01-30T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    title: "Emergency Surgery for Carlos",
    description: "Carlos needs urgent surgery to repair a work-related injury. Without this surgery, he cannot return to work to support his family.",
    full_description: "Carlos, a construction worker and father of three, suffered a severe injury on the job that requires immediate surgery. His employer's insurance has been delayed, and he cannot afford the procedure. Without this surgery, Carlos faces permanent disability and will be unable to provide for his family. We are raising funds to cover the surgery costs and help his family during recovery.",
    creator: "Carlos Mendez",
    creator_type: "individual",
    creator_id: null,
    goal: 4500,
    raised: 2550,
    backers: 87,
    days_left: 15,
    category: "Medical",
    image: "https://picsum.photos/seed/medical2/800/600",
    image2: null,
    location: "San Ignacio, Cayo District, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-02-01T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-0005-4000-8000-000000000005",
    title: "Community Center Renovation in Orange Walk",
    description: "Renovating the community center to provide a safe space for youth programs, senior activities, and community events.",
    full_description: "Our community center in Orange Walk has served the community for over 30 years but is now in urgent need of repairs. The roof leaks, electrical systems are outdated, and the building is not accessible for people with disabilities. We need funds to renovate the center so it can continue serving as a hub for youth programs, senior activities, and community gatherings. This project will benefit hundreds of families in Orange Walk.",
    creator: "Orange Walk Community Association",
    creator_type: "organization",
    creator_id: null,
    goal: 5000,
    raised: 3100,
    backers: 156,
    days_left: 22,
    category: "Community",
    image: "https://picsum.photos/seed/community1/800/600",
    image2: null,
    location: "Orange Walk Town, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-01-25T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-0006-4000-8000-000000000006",
    title: "Food Assistance for Elderly in Corozal",
    description: "Providing monthly food packages and meals for elderly residents in Corozal who are struggling to afford basic nutrition.",
    full_description: "Many elderly residents in Corozal are living on fixed incomes that don't cover basic necessities, especially food. Our program provides monthly food packages and hot meals to seniors in need. We work with local suppliers to ensure fresh, nutritious food reaches those who need it most. Your support helps us maintain this vital program that serves over 100 elderly residents.",
    creator: "Corozal Senior Support Network",
    creator_type: "charity",
    creator_id: null,
    goal: 2500,
    raised: 1750,
    backers: 78,
    days_left: 20,
    category: "Community",
    image: "https://picsum.photos/seed/community2/800/600",
    image2: null,
    location: "Corozal Town, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-01-27T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-0007-4000-8000-000000000007",
    title: "Fire Recovery for Belize City Family",
    description: "A family lost their home and belongings in a house fire. Help them rebuild and replace essentials so they can get back on their feet.",
    full_description: "Last month a devastating house fire destroyed the home of the Thompson family in Belize City. They lost everything — clothing, furniture, important documents, and their sense of security. The family of five is currently staying with relatives but needs support to secure temporary housing, replace essential items, and begin rebuilding. The community has rallied, and we are grateful for any contribution to help this family recover and find stability again.",
    creator: "Sarah Thompson",
    creator_type: "individual",
    creator_id: null,
    goal: 5000,
    raised: 3110,
    backers: 189,
    days_left: 8,
    category: "Emergency",
    image: "https://picsum.photos/seed/emergency1/800/600",
    image2: null,
    location: "Belize City, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-02-10T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-0008-4000-8000-000000000008",
    title: "Youth Sports Equipment for Cayo District",
    description: "Raising funds to provide sports equipment and coaching for underprivileged youth in Cayo, promoting health and teamwork.",
    full_description: "Many young people in Cayo District lack access to organized sports and recreational activities. We aim to equip local youth programs with quality sports equipment — footballs, nets, uniforms, and safety gear — and fund trained coaches for after-school programs. Sport builds discipline, teamwork, and confidence. Your support will give hundreds of children a positive outlet and a chance to grow through play.",
    creator: "Cayo Youth Initiative",
    creator_type: "organization",
    creator_id: null,
    goal: 4000,
    raised: 2940,
    backers: 124,
    days_left: 14,
    category: "Community",
    image: "https://picsum.photos/seed/sports1/800/600",
    image2: null,
    location: "San Ignacio, Cayo District, Belize",
    status: "live",
    verified: true,
    admin_backed: false,
    created_at: "2026-02-08T12:00:00Z",
    updated_at: new Date().toISOString(),
  },
];

async function seed() {
  console.log("Seeding demo campaigns into Supabase...");
  const { error } = await supabase.from("campaigns").upsert(DEMO_CAMPAIGNS, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log("Done. Inserted/updated", DEMO_CAMPAIGNS.length, "campaigns.");
}

seed();
