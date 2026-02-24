/**
 * Mock data for admin dashboard (users and donations).
 * In production these would come from your database.
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  verified: boolean;
  idVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminDonation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  donorEmail: string;
  donorName: string;
  anonymous: boolean;
  method: "bank" | "digiwallet" | "ekyash";
  status: "completed" | "pending" | "failed";
  createdAt: string;
  /** Short reference for payment (e.g. A1234). One letter + 4 digits. */
  referenceNumber?: string;
  /** Optional message from the donor, max 100 characters. */
  note?: string;
}

export const adminUsers: AdminUser[] = [
  { id: "u1", email: "admin@givahbz.com", name: "Admin User", role: "admin", verified: true, idVerified: true, createdAt: "2025-01-01", lastLoginAt: "2026-02-17T10:00:00Z" },
  { id: "u2", email: "maria.g@email.com", name: "Maria Gonzalez", role: "user", verified: true, idVerified: true, createdAt: "2026-02-05", lastLoginAt: "2026-02-16T14:30:00Z" },
  { id: "u3", email: "dangriga.relief@org.bz", name: "Dangriga Community Relief", role: "user", verified: true, idVerified: true, createdAt: "2026-01-28", lastLoginAt: "2026-02-15T09:00:00Z" },
  { id: "u4", email: "belize.education@charity.bz", name: "Belize Education Foundation", role: "user", verified: true, idVerified: true, createdAt: "2026-01-30", lastLoginAt: "2026-02-14T11:00:00Z" },
  { id: "u5", email: "carlos.m@email.com", name: "Carlos Mendez", role: "user", verified: true, idVerified: true, createdAt: "2026-02-01", lastLoginAt: "2026-02-17T08:00:00Z" },
  { id: "u6", email: "orange.walk@community.bz", name: "Orange Walk Community Assoc", role: "user", verified: true, idVerified: true, createdAt: "2026-01-25", lastLoginAt: null },
  { id: "u7", email: "corozal.seniors@charity.bz", name: "Corozal Senior Support", role: "user", verified: true, idVerified: true, createdAt: "2026-01-27", lastLoginAt: "2026-02-10T16:00:00Z" },
  { id: "u8", email: "john.donor@email.com", name: "John Smith", role: "user", verified: true, idVerified: false, createdAt: "2026-02-12", lastLoginAt: "2026-02-17T07:00:00Z" },
  { id: "u9", email: "jane.d@email.com", name: "Jane Doe", role: "user", verified: false, idVerified: false, createdAt: "2026-02-14", lastLoginAt: "2026-02-14T12:00:00Z" },
];

/** Fictitious donors: 10 per campaign, about 3 anonymous per campaign. */
const CAMPAIGNS = [
  { id: "1", title: "Medical Treatment for Maria's Daughter" },
  { id: "2", title: "Hurricane Relief for Dangriga Community" },
  { id: "3", title: "School Supplies for Rural Toledo District" },
  { id: "4", title: "Emergency Surgery for Carlos" },
  { id: "5", title: "Community Center Renovation in Orange Walk" },
  { id: "6", title: "Food Assistance for Elderly in Corozal" },
  { id: "7", title: "Fire Recovery for Belize City Family" },
  { id: "8", title: "Youth Sports Equipment for Cayo District" },
] as const;

const METHODS: Array<"bank" | "digiwallet" | "ekyash"> = ["bank", "digiwallet", "ekyash"];

/** 7 named donors per campaign (fictitious). 3 anonymous are inserted per campaign. */
const NAMED_DONORS_PER_CAMPAIGN: Array<{ name: string; email: string }> = [
  { name: "John Smith", email: "john.donor@email.com" },
  { name: "Patricia Martinez", email: "patricia.m@email.com" },
  { name: "Robert Brown", email: "robert.b@email.com" },
  { name: "Michael Thompson", email: "michael.t@email.com" },
  { name: "Sarah Johnson", email: "sarah.j@email.com" },
  { name: "Emily Chen", email: "emily.c@email.com" },
  { name: "James Rodriguez", email: "james.r@email.com" },
  { name: "Belize Corp", email: "donor@company.bz" },
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
  { name: "Diana Chen", email: "diana.c@email.com" },
  { name: "Senior Care Network", email: "senior.care@email.com" },
  { name: "Corozal Community Group", email: "corozal.community@email.com" },
  { name: "Local Family Fund", email: "local.family@email.com" },
  { name: "Belize Seniors Association", email: "belize.seniors@email.com" },
  { name: "Fire Relief Fund", email: "fire.relief@email.com" },
  { name: "Family Support Group", email: "family.support@email.com" },
  { name: "Neighbor Help Fund", email: "neighbor.help@email.com" },
  { name: "Belize Sports Fund", email: "sports.fund@email.com" },
  { name: "Cayo Youth Foundation", email: "cayo.youth@email.com" },
  { name: "Athletic Support Network", email: "athletic.support@email.com" },
  { name: "Youth Sports Initiative", email: "youth.sports@email.com" },
];

const SAMPLE_NOTES: string[] = [
  "Wishing you all the best. Stay hopeful!",
  "Every bit helps. God bless.",
  "Sending love and prayers.",
  "Hope this helps. You're not alone.",
  "From one parent to another—thinking of you.",
  "Proud to support our community.",
  "Rebuild stronger. We're with you.",
  "Education changes lives. Happy to help.",
  "Every child deserves supplies.",
  "Get well soon. You've got this!",
  "Wishing you a full and quick recovery.",
  "Investing in our community's future.",
  "Great cause. Proud to be part of it.",
  "For our elders. With respect.",
  "No one should go hungry. Happy to help.",
  "We stand with you. Rebuild and recover.",
  "Your community has your back.",
  "Play hard, play fair. Go!",
  "Every kid deserves to play.",
  "Supporting the next generation.",
];

function buildDonations(): AdminDonation[] {
  const out: AdminDonation[] = [];
  let id = 1;
  const baseDate = new Date("2026-02-01T12:00:00Z").getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  CAMPAIGNS.forEach((campaign, cIdx) => {
    // 10 donors per campaign: 3 anonymous (at indices 1, 4, 7) and 7 named
    const anonymousIndices = [1, 4, 7];
    const donors: Array<{ anonymous: boolean; name: string; email: string }> = [];
    for (let i = 0; i < 10; i++) {
      if (anonymousIndices.includes(i)) {
        donors.push({ anonymous: true, name: "Anonymous", email: `anon${cIdx}-${i}@donor.bz` });
      } else {
        const pick = NAMED_DONORS_PER_CAMPAIGN[(cIdx * 7 + i) % NAMED_DONORS_PER_CAMPAIGN.length];
        donors.push({ anonymous: false, name: pick.name, email: pick.email });
      }
    }

    const amounts = [15, 20, 25, 30, 40, 50, 60, 75, 100, 150];

    donors.forEach((d, i) => {
      const createdAt = new Date(baseDate + (cIdx * 10 + i) * dayMs * 0.7).toISOString();
      const method = METHODS[(cIdx + i) % METHODS.length];
      const note = i % 2 === 0 ? SAMPLE_NOTES[(cIdx * 10 + i) % SAMPLE_NOTES.length] : undefined;
      out.push({
        id: `d${id}`,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        amount: amounts[i],
        donorEmail: d.email,
        donorName: d.name,
        anonymous: d.anonymous,
        method,
        status: "completed",
        createdAt,
        ...(note && { note }),
      });
      id++;
    });
  });

  return out;
}

export const adminDonations: AdminDonation[] = buildDonations();
