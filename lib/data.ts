export interface Campaign {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  creator: string;
  creatorType: "individual" | "organization" | "charity";
  creatorAvatar?: string;
  goal: number;
  raised: number;
  backers: number;
  daysLeft: number;
  category: string;
  image: string;
  image2?: string;
  location?: string;
  createdAt: string;
  verified: boolean;
  /** True when the campaign was created/approved by Givah (shows "Givah Approved Campaign" badge). */
  adminBacked?: boolean;
  proofDocuments?: ProofDocument[];
  updates?: CampaignUpdate[];
  rewards?: Reward[];
}

export interface ProofDocument {
  id: string;
  type: "medical" | "financial" | "identification" | "id_proof" | "address_proof" | "other";
  name: string;
  description: string;
  uploadedAt: string;
}

export interface CampaignUpdate {
  id: string;
  date: string;
  title: string;
  content: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  amount: number;
  backers: number;
  estimatedDelivery: string;
}

export const campaigns: Campaign[] = [
  {
    id: "1",
    title: "Medical Treatment for Maria's Daughter",
    description: "Urgent funds needed for 8-year-old Maria's daughter who requires specialized surgery at KHMH. Family cannot afford the medical expenses.",
    fullDescription: "Maria's 8-year-old daughter was recently diagnosed with a congenital heart condition that requires immediate surgery. The family has exhausted their savings and insurance coverage. The surgery must be performed at Karl Heusner Memorial Hospital (KHMH) in Belize City. We are seeking support from the Belizean community to help cover the medical expenses, hospital stay, and post-operative care. Any contribution, no matter how small, will make a difference in this child's life.",
    creator: "Maria Gonzalez",
    creatorType: "individual",
    goal: 5000,
    raised: 2920,
    backers: 142,
    daysLeft: 12,
    category: "Medical",
    image: "https://picsum.photos/seed/medical1/800/600",
    location: "Belize City, Belize",
    createdAt: "2026-02-05",
    verified: true,
    proofDocuments: [
      {
        id: "doc1",
        type: "medical",
        name: "Medical Diagnosis Report",
        description: "Official diagnosis from KHMH",
        uploadedAt: "2026-02-05"
      },
      {
        id: "doc2",
        type: "financial",
        name: "Hospital Cost Estimate",
        description: "Breakdown of medical expenses",
        uploadedAt: "2026-02-05"
      }
    ]
  },
  {
    id: "2",
    title: "Hurricane Relief for Dangriga Community",
    description: "Rebuilding homes and providing essential supplies for families affected by recent hurricane damage in Dangriga.",
    fullDescription: "The recent hurricane has left many families in Dangriga without homes and basic necessities. Our organization is working to provide immediate relief including food, clean water, temporary shelter, and rebuilding materials. We need your support to help these families get back on their feet. All funds will go directly to purchasing supplies and materials for affected families.",
    creator: "Dangriga Community Relief Organization",
    creatorType: "organization",
    goal: 5000,
    raised: 3640,
    backers: 234,
    daysLeft: 18,
    category: "Disaster Relief",
    image: "https://picsum.photos/seed/disaster1/800/600",
    location: "Dangriga, Belize",
    createdAt: "2026-01-28",
    verified: true,
    proofDocuments: [
      {
        id: "doc3",
        type: "other",
        name: "Organization Registration",
        description: "Official NGO registration documents",
        uploadedAt: "2026-01-28"
      },
      {
        id: "doc4",
        type: "other",
        name: "Damage Assessment Report",
        description: "Photos and assessment of affected areas",
        uploadedAt: "2026-01-28"
      }
    ]
  },
  {
    id: "3",
    title: "School Supplies for Rural Toledo District",
    description: "Providing books, uniforms, and school supplies for 200+ children in rural Toledo District who cannot afford them.",
    fullDescription: "Many children in rural Toledo District are unable to attend school because their families cannot afford basic supplies like books, uniforms, and writing materials. Our charity aims to ensure every child has access to education by providing these essential items. We work directly with schools in the area to identify children in need and distribute supplies at the start of each school year.",
    creator: "Belize Education Foundation",
    creatorType: "charity",
    goal: 3500,
    raised: 2275,
    backers: 98,
    daysLeft: 25,
    category: "Education",
    image: "https://picsum.photos/seed/education1/800/600",
    location: "Toledo District, Belize",
    createdAt: "2026-01-30",
    verified: true,
    proofDocuments: [
      {
        id: "doc5",
        type: "identification",
        name: "Charity Registration Certificate",
        description: "Registered charity with Ministry of Education",
        uploadedAt: "2026-01-30"
      }
    ]
  },
  {
    id: "4",
    title: "Emergency Surgery for Carlos",
    description: "Carlos needs urgent surgery to repair a work-related injury. Without this surgery, he cannot return to work to support his family.",
    fullDescription: "Carlos, a construction worker and father of three, suffered a severe injury on the job that requires immediate surgery. His employer's insurance has been delayed, and he cannot afford the procedure. Without this surgery, Carlos faces permanent disability and will be unable to provide for his family. We are raising funds to cover the surgery costs and help his family during recovery.",
    creator: "Carlos Mendez",
    creatorType: "individual",
    goal: 4500,
    raised: 2550,
    backers: 87,
    daysLeft: 15,
    category: "Medical",
    image: "https://picsum.photos/seed/medical2/800/600",
    location: "San Ignacio, Cayo District, Belize",
    createdAt: "2026-02-01",
    verified: true,
    proofDocuments: [
      {
        id: "doc6",
        type: "medical",
        name: "Surgical Recommendation",
        description: "Doctor's recommendation for surgery",
        uploadedAt: "2026-02-01"
      },
      {
        id: "doc7",
        type: "financial",
        name: "Income Statement",
        description: "Proof of financial need",
        uploadedAt: "2026-02-01"
      }
    ]
  },
  {
    id: "5",
    title: "Community Center Renovation in Orange Walk",
    description: "Renovating the community center to provide a safe space for youth programs, senior activities, and community events.",
    fullDescription: "Our community center in Orange Walk has served the community for over 30 years but is now in urgent need of repairs. The roof leaks, electrical systems are outdated, and the building is not accessible for people with disabilities. We need funds to renovate the center so it can continue serving as a hub for youth programs, senior activities, and community gatherings. This project will benefit hundreds of families in Orange Walk.",
    creator: "Orange Walk Community Association",
    creatorType: "organization",
    goal: 5000,
    raised: 3100,
    backers: 156,
    daysLeft: 22,
    category: "Community",
    image: "https://picsum.photos/seed/community1/800/600",
    location: "Orange Walk Town, Belize",
    createdAt: "2026-01-25",
    verified: true,
    proofDocuments: [
      {
        id: "doc8",
        type: "identification",
        name: "Organization Documents",
        description: "Community association registration",
        uploadedAt: "2026-01-25"
      }
    ]
  },
  {
    id: "6",
    title: "Food Assistance for Elderly in Corozal",
    description: "Providing monthly food packages and meals for elderly residents in Corozal who are struggling to afford basic nutrition.",
    fullDescription: "Many elderly residents in Corozal are living on fixed incomes that don't cover basic necessities, especially food. Our program provides monthly food packages and hot meals to seniors in need. We work with local suppliers to ensure fresh, nutritious food reaches those who need it most. Your support helps us maintain this vital program that serves over 100 elderly residents.",
    creator: "Corozal Senior Support Network",
    creatorType: "charity",
    goal: 2500,
    raised: 1750,
    backers: 78,
    daysLeft: 20,
    category: "Community",
    image: "https://picsum.photos/seed/community2/800/600",
    location: "Corozal Town, Belize",
    createdAt: "2026-01-27",
    verified: true,
    proofDocuments: [
      {
        id: "doc9",
        type: "identification",
        name: "Charity Registration",
        description: "Registered non-profit organization",
        uploadedAt: "2026-01-27"
      }
    ]
  },
  {
    id: "7",
    title: "Fire Recovery for Belize City Family",
    description: "A family lost their home and belongings in a house fire. Help them rebuild and replace essentials so they can get back on their feet.",
    fullDescription: "Last month a devastating house fire destroyed the home of the Thompson family in Belize City. They lost everything — clothing, furniture, important documents, and their sense of security. The family of five is currently staying with relatives but needs support to secure temporary housing, replace essential items, and begin rebuilding. The community has rallied, and we are grateful for any contribution to help this family recover and find stability again.",
    creator: "Sarah Thompson",
    creatorType: "individual",
    goal: 5000,
    raised: 3110,
    backers: 189,
    daysLeft: 8,
    category: "Emergency",
    image: "https://picsum.photos/seed/emergency1/800/600",
    location: "Belize City, Belize",
    createdAt: "2026-02-10",
    verified: true,
    proofDocuments: [
      {
        id: "doc10",
        type: "other",
        name: "Fire Department Report",
        description: "Official incident report",
        uploadedAt: "2026-02-10"
      },
      {
        id: "doc11",
        type: "identification",
        name: "Proof of Address",
        description: "Identification and address verification",
        uploadedAt: "2026-02-10"
      }
    ]
  },
  {
    id: "8",
    title: "Youth Sports Equipment for Cayo District",
    description: "Raising funds to provide sports equipment and coaching for underprivileged youth in Cayo, promoting health and teamwork.",
    fullDescription: "Many young people in Cayo District lack access to organized sports and recreational activities. We aim to equip local youth programs with quality sports equipment — footballs, nets, uniforms, and safety gear — and fund trained coaches for after-school programs. Sport builds discipline, teamwork, and confidence. Your support will give hundreds of children a positive outlet and a chance to grow through play.",
    creator: "Cayo Youth Initiative",
    creatorType: "organization",
    goal: 4000,
    raised: 2940,
    backers: 124,
    daysLeft: 14,
    category: "Community",
    image: "https://picsum.photos/seed/sports1/800/600",
    location: "San Ignacio, Cayo District, Belize",
    createdAt: "2026-02-08",
    verified: true,
    proofDocuments: [
      {
        id: "doc12",
        type: "identification",
        name: "Organization Registration",
        description: "Community initiative registration",
        uploadedAt: "2026-02-08"
      }
    ]
  },
];
