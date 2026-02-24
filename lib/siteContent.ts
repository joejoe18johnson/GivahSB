/** One FAQ item for the homepage section (question + answer). */
export interface HomeFaqItem {
  q: string;
  a: string;
}

/**
 * Editable site content (admin "Edit site info").
 * Stored in Supabase site_config; fallback to these defaults when empty.
 */
export interface SiteContent {
  siteName: string;
  heroTitle: string;
  heroSubtitle: string;
  communityHeadingPart1: string;
  communityHeadingPart2: string;
  footerTagline: string;
  footerCopyright: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutMission: string;
  /** Homepage FAQ section (stored as JSON string in Supabase). */
  homeFaqs: HomeFaqItem[];
}

const DEFAULT_HOME_FAQS: HomeFaqItem[] = [
  { q: "Why was this crowdfunding platform created?", a: "This platform was created because there is a real and growing need for trustworthy financial support within our community. Many individuals and families face urgent situations — medical needs, emergencies, educational expenses, or unexpected hardships — but often struggle to access reliable help.\n\nWe wanted to create a safe, structured, and transparent place where people can give and receive support with confidence." },
  { q: "How is this different from asking for help on social media like Facebook?", a: "While platforms like Facebook allow people to share needs quickly, it can be difficult to verify whether a situation is authentic. Donors are often left wondering: Is this story true? Are the documents real? Will the money actually go where it's needed?\n\nOur platform provides verification and accountability. Every campaign is reviewed and vetted before being approved, so donors can give with greater trust and peace of mind." },
  { q: "How do you ensure campaigns are legitimate?", a: "All campaigns go through a vetting process that may include:\n• Verification of identity\n• Review of supporting documents\n• Direct communication with the applicant\n• Confirmation of medical, educational, or emergency documentation (when applicable)\n\nWe aim to ensure that every campaign is authentic and truthful before it is published." },
  { q: "Why is trust so important?", a: "Trust is the foundation of generosity. When donors feel confident that their contributions are going to a real and verified need, they are more willing to give.\n\nThis platform exists to build that trust — protecting both donors and recipients." },
  { q: "Who can start a campaign?", a: "Individuals, families, or representatives seeking assistance for legitimate and verifiable needs may apply. Each request is reviewed before approval." },
  { q: "How do donors know their money is used properly?", a: "We encourage:\n• Clear goal amounts\n• Updates from campaign organizers\n• Documentation of how funds are used\n• Ongoing communication\n\nTransparency is a core value of this platform." },
  { q: "What kinds of needs can be supported?", a: "Examples include:\n• Medical expenses\n• Educational support\n• Disaster recovery\n\nEach campaign is evaluated individually to ensure it aligns with our guidelines." },
  { q: "What is the mission of this platform?", a: "Our mission is simple: To connect real needs with real generosity — through a trusted, verified, and transparent system that strengthens our community." },
];

export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "GivahBz",
  heroTitle: "Belizean Supporting Belizeans",
  heroSubtitle: "Life is either a daring adventure or nothing. Help real people and causes across Belize—verified, transparent, and community-driven.",
  communityHeadingPart1: "Communities Share ",
  communityHeadingPart2: "Burdens",
  footerTagline: "Supporting organizations, charities, and individuals in need across Belize. All campaigns are verified with proof of need.",
  footerCopyright: "© 2026 GivahBz. All rights reserved. | Serving Belize",
  aboutTitle: "About GivahBz",
  aboutSubtitle: "Empowering Belizean communities through transparent, verified crowdfunding",
  aboutMission: "GivahBz was created to provide a trusted, transparent platform for Belizean communities to support each other. We believe that when people come together, incredible things happen.",
  homeFaqs: DEFAULT_HOME_FAQS,
};

function parseHomeFaqs(value: unknown): HomeFaqItem[] {
  if (Array.isArray(value)) {
    return value
      .filter((x): x is { q?: string; a?: string } => x != null && typeof x === "object")
      .map((x) => ({ q: typeof x.q === "string" ? x.q.trim() : "", a: typeof x.a === "string" ? x.a : "" }))
      .filter((x) => x.q.length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseHomeFaqs(parsed);
    } catch {
      return DEFAULT_HOME_FAQS;
    }
  }
  return DEFAULT_HOME_FAQS;
}

export function mergeWithDefaults(partial: Partial<SiteContent> | null | undefined): SiteContent {
  if (!partial || typeof partial !== "object") return DEFAULT_SITE_CONTENT;
  return {
    siteName: typeof partial.siteName === "string" && partial.siteName.trim() ? partial.siteName.trim() : DEFAULT_SITE_CONTENT.siteName,
    heroTitle: typeof partial.heroTitle === "string" && partial.heroTitle.trim() ? partial.heroTitle.trim() : DEFAULT_SITE_CONTENT.heroTitle,
    heroSubtitle: typeof partial.heroSubtitle === "string" ? partial.heroSubtitle.trim() : DEFAULT_SITE_CONTENT.heroSubtitle,
    communityHeadingPart1: typeof partial.communityHeadingPart1 === "string" ? partial.communityHeadingPart1 : DEFAULT_SITE_CONTENT.communityHeadingPart1,
    communityHeadingPart2: typeof partial.communityHeadingPart2 === "string" ? partial.communityHeadingPart2 : DEFAULT_SITE_CONTENT.communityHeadingPart2,
    footerTagline: typeof partial.footerTagline === "string" ? partial.footerTagline.trim() : DEFAULT_SITE_CONTENT.footerTagline,
    footerCopyright: typeof partial.footerCopyright === "string" ? partial.footerCopyright.trim() : DEFAULT_SITE_CONTENT.footerCopyright,
    aboutTitle: typeof partial.aboutTitle === "string" && partial.aboutTitle.trim() ? partial.aboutTitle.trim() : DEFAULT_SITE_CONTENT.aboutTitle,
    aboutSubtitle: typeof partial.aboutSubtitle === "string" ? partial.aboutSubtitle.trim() : DEFAULT_SITE_CONTENT.aboutSubtitle,
    aboutMission: typeof partial.aboutMission === "string" ? partial.aboutMission.trim() : DEFAULT_SITE_CONTENT.aboutMission,
    homeFaqs: parseHomeFaqs((partial as Record<string, unknown>).homeFaqs),
  };
}
