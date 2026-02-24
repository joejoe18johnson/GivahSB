"use client";

import { Permanent_Marker } from "next/font/google";
import CampaignCard from "@/components/CampaignCard";
import { Campaign } from "@/lib/data";
import { getTopCampaignsByFunding } from "@/lib/campaignUtils";
import { fetchCampaignsFromAPI } from "@/lib/services/campaignService";
import SafeImage from "@/components/SafeImage";
import { TrendingUp, FileText, Share2, ArrowUpRight, Shield, DollarSign, Calendar, Users, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"] });

const HERO_SLIDES = [
  { src: "/hero-right.png", alt: "Community connections" },
  { src: "/hero-right-2.png", alt: "Community connections" },
];

export default function Home() {
  const { content: siteContent } = useSiteContent();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [siteStats, setSiteStats] = useState<{ totalRaisedFormatted: string; campaignCount: number; totalSupporters: number } | null>(null);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const trendingScrollRef = useRef<HTMLDivElement>(null);
  const [trendingCanScrollLeft, setTrendingCanScrollLeft] = useState(false);
  const [trendingCanScrollRight, setTrendingCanScrollRight] = useState(false);

  const updateTrendingScrollState = () => {
    const el = trendingScrollRef.current;
    if (!el) return;
    setTrendingCanScrollLeft(el.scrollLeft > 0);
    setTrendingCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    const page = Math.min(totalPages, Math.round(el.scrollLeft / TRENDING_PAGE_WIDTH) + 1);
    setCurrentPage((p) => (page >= 1 && page <= totalPages ? page : p));
  };

  useEffect(() => {
    const t = setInterval(() => {
      setHeroSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function loadCampaigns() {
      setCampaignsError(null);
      try {
        const fetchedCampaigns = await fetchCampaignsFromAPI({ trending: true });
        setCampaigns(fetchedCampaigns);
      } catch (error) {
        console.error("Error loading campaigns:", error);
        const message = error instanceof Error ? error.message : "Campaigns could not be loaded. Check Supabase is connected.";
        setCampaignsError(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch("/api/site-stats", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok && data)
          setSiteStats({
            totalRaisedFormatted: data.totalRaisedFormatted ?? "BZ$0",
            campaignCount: typeof data.campaignCount === "number" ? data.campaignCount : 0,
            totalSupporters: typeof data.totalSupporters === "number" ? data.totalSupporters : 0,
          });
      } catch {
        if (!cancelled) setSiteStats({ totalRaisedFormatted: "BZ$0", campaignCount: 0, totalSupporters: 0 });
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  const allTrendingCampaigns = getTopCampaignsByFunding(campaigns, 12);
  const cardsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(allTrendingCampaigns.length / cardsPerPage));
  const TRENDING_PAGE_WIDTH = 280 * cardsPerPage + 24 * (cardsPerPage - 1); // card w + gap

  const [currentPage, setCurrentPage] = useState(1);

  const scrollTrendingToPage = (page: number) => {
    const el = trendingScrollRef.current;
    if (!el) return;
    const left = (page - 1) * TRENDING_PAGE_WIDTH;
    el.scrollTo({ left, behavior: "smooth" });
    setCurrentPage(page);
  };

  useEffect(() => {
    const el = trendingScrollRef.current;
    const onScroll = () => updateTrendingScrollState();
    const runAfterLayout = () => updateTrendingScrollState();
    runAfterLayout();
    const t = setTimeout(runAfterLayout, 100);
    if (el) {
      el.addEventListener("scroll", onScroll);
    }
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(t);
      if (el) el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when list length changes
  }, [allTrendingCampaigns.length]);

  const scrollTrending = (direction: "left" | "right") => {
    const el = trendingScrollRef.current;
    if (!el) return;
    const step = el.clientWidth;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <>
      {/* First viewport: hero + Communities Share Burdens heading visible */}
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
          {/* Hero Section - Two column layout */}
          <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Decorative shapes */}
          <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-success-200/60 -z-10" aria-hidden />
          <div className="absolute bottom-32 right-20 w-32 h-32 rounded-full bg-primary-100/50 -z-10" aria-hidden />
          <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-accent-100/40 -z-10" aria-hidden />

          {/* Left: Content - vertically centered */}
          <div className="order-2 lg:order-1 flex flex-col justify-center mt-14 sm:mt-16 lg:mt-0 min-h-[320px] lg:min-h-[400px]">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-4">
              {siteContent.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
              {siteContent.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/campaigns/create"
                className="inline-flex justify-center bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors shadow-lg"
              >
                Start a Campaign
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex justify-center border-2 border-gray-800 text-gray-800 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Browse Campaigns
              </Link>
            </div>
            <div className="mt-6">
              <Link
                href="/how-it-works"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
              >
                Learn how it works →
              </Link>
            </div>
            <div className="mt-8 flex justify-start">
              <a href="#community-wins" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Scroll down">
                <ChevronDown className="w-8 h-8" />
              </a>
            </div>
          </div>

          {/* Right: Hero image slider (2s delay, loop) */}
          <div className="order-1 lg:order-2 flex justify-center items-start relative max-w-md w-full aspect-[4/3] min-h-[240px]">
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={slide.src}
                className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                style={{ opacity: heroSlideIndex === i ? 1 : 0 }}
                aria-hidden={heroSlideIndex !== i}
              >
                <SafeImage
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-contain block"
                />
              </div>
            ))}
          </div>
        </section>
        </div>

        {/* Communities Share Burdens - visible at bottom of first viewport */}
        <section id="community-shares-burdens" className="flex-shrink-0 -mt-[40px] pt-4 pb-8 md:pb-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-center break-words max-w-full px-2">
              <span className="text-primary-600">{siteContent.communityHeadingPart1}</span>
              <span className={`text-success-600 ${permanentMarker.className}`}>{siteContent.communityHeadingPart2}</span>
            </h2>
          </div>
        </section>
      </div>

      {/* Top Campaigns */}
      <section className="mb-12 relative py-8 md:py-12 overflow-hidden bg-white">
        <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-medium text-gray-900">Top Campaigns</h2>
              <div className="bg-success-100 text-success-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0">
                <TrendingUp className="w-3 h-3" />
                TRENDING
              </div>
            </div>
            <div className="hidden md:block flex-1 min-w-[60px] h-px bg-gray-200" />
          </div>
          <span className="text-gray-600 font-medium text-sm whitespace-nowrap self-start sm:self-auto">
            {allTrendingCampaigns.length} {allTrendingCampaigns.length === 1 ? "campaign" : "campaigns"}
          </span>
        </div>
        <p className="text-gray-600 mb-6">
          Campaigns gaining momentum and support from the community
        </p>

        {campaignsError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <p className="font-medium">{campaignsError}</p>
            <p className="text-sm mt-1">
              <a href="/api/campaigns" className="underline" target="_blank" rel="noopener noreferrer">Check campaigns API</a>
              {" · "}
              <a href="/campaigns" className="underline">Try campaigns page</a>
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex gap-4 md:gap-6 py-2 justify-center md:justify-start min-h-[340px] items-center">
            <div className="animate-pulse flex-shrink-0 w-[85vw] max-w-[340px] md:w-[280px] h-[500px] rounded-lg bg-gray-100" />
            <div className="animate-pulse flex-shrink-0 w-[85vw] max-w-[340px] md:w-[280px] h-[500px] rounded-lg bg-gray-100 hidden sm:block" />
            <div className="animate-pulse flex-shrink-0 w-[280px] h-[500px] rounded-lg bg-gray-100 hidden md:block" />
            <div className="animate-pulse flex-shrink-0 w-[280px] h-[500px] rounded-lg bg-gray-100 hidden lg:block" />
          </div>
        )}

        {!isLoading && allTrendingCampaigns.length === 0 && !campaignsError && (
          <div className="py-12 text-center text-gray-500">
            <p className="font-medium text-gray-700">No trending campaigns yet</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              This can happen if the project is new and has no campaigns, or no campaign has reached 60% funding yet.
            </p>
            <Link href="/campaigns" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium underline">
              Browse all campaigns →
            </Link>
            <p className="text-xs mt-4 text-gray-400">
              Create a campaign or run a seed script to add test data.
            </p>
          </div>
        )}

        {/* Mobile: horizontal carousel, equal-height cards */}
        {!isLoading && allTrendingCampaigns.length > 0 && (
        <div className="md:hidden -mx-4 px-4 mb-8">
          <div className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide pb-4">
            <div className="flex gap-4">
              {allTrendingCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex-shrink-0 w-[85vw] max-w-[340px] min-h-[580px] snap-center snap-always"
                >
                  <div className="min-h-[580px] h-full rounded-lg border border-gray-200 hover:border-verified-500 active:scale-[0.98] transition-all duration-200 overflow-hidden bg-white flex flex-col">
                    <CampaignCard campaign={campaign} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Desktop: swipeable carousel with side arrows, equal-height cards */}
        {!isLoading && allTrendingCampaigns.length > 0 && (
        <div className="hidden md:block relative">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scrollTrending("left")}
            disabled={!trendingCanScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-success-500 hover:text-success-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous campaigns"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scrollTrending("right")}
            disabled={!trendingCanScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-12 h-12 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-success-500 hover:text-success-600 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next campaigns"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            ref={trendingScrollRef}
            className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-2 px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex gap-6 py-2">
              {allTrendingCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex-shrink-0 w-[280px] h-[500px] snap-start rounded-lg border border-gray-200 hover:border-verified-500 hover:shadow-[rgba(17,12,46,0.15)_0px_48px_100px_0px] hover:scale-[1.02] transition-all duration-300 overflow-hidden bg-white"
                >
                  <CampaignCard campaign={campaign} />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination numbers (desktop only) */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => scrollTrendingToPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-colors ${
                    currentPage === page
                      ? "bg-success-500 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "true" : undefined}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        <div className="text-center mt-6">
          <Link
            href="/campaigns?filter=trending"
            className="inline-block bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors shadow-md"
          >
            View All Top Campaigns →
          </Link>
        </div>
        </div>
      </section>

      {/* CTA Banner */}
      <div className="container mx-auto px-4 mb-12">
        <section className="bg-gradient-to-r from-success-500 to-success-600 rounded-2xl border border-gray-200 py-12 md:py-16 shadow-lg">
          <div className="text-center px-6">
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-6">Ready to Start A Campaign?</h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of Belizeans making a difference. Create your campaign today and start receiving support from your community.
            </p>
            <Link
              href="/campaigns/create"
              className="inline-block bg-white text-success-600 px-8 py-4 rounded-full font-medium hover:bg-white/90 transition-colors shadow-lg text-lg"
            >
              Start Campaign
            </Link>
          </div>
        </section>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium mb-4 break-words px-2">
            <span className="text-success-600">Accessible.</span>{" "}
            <span className="text-success-600">Accountable.</span>{" "}
            <span className="text-success-600">Transformative.</span>{" "}
            <span className="text-gray-900">For Belizeans</span>
          </h2>
        </div>

        {/* How Fundraising Works & Campaigns Needing Support */}
        <section className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How Fundraising Works */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-medium mb-4 text-white">How Fundraising Works</h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Create your campaign with your story, goal, and images.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Share it with your community and beyond.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Grow impact as donations come in and hope multiplies.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Verify. Every campaign checked, every donation secure.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium">
                  Receive payouts securely, with full transparency.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link
              href="/campaigns/create"
              className="inline-block bg-white text-primary-600 px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors shadow-lg"
            >
              Start Your Campaign Today
            </Link>
          </div>
        </div>

        {/* Campaigns Needing Support - horizontal cards (same layout as Success Stories) */}
        <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg flex flex-col">
          <h2 className="text-3xl md:text-4xl font-medium mb-6 text-white">Campaigns Needing Support</h2>
          <ul className="flex flex-col gap-4 list-none p-0 m-0">
            {campaigns.slice(0, 4).map((campaign) => {
              const goal = Number(campaign.goal) || 1;
              const raised = Number(campaign.raised) || 0;
              const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
              return (
                <li key={campaign.id}>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="flex flex-row rounded-xl border border-white/30 bg-white/95 overflow-hidden shadow-sm hover:border-white/50 hover:shadow-md transition-all"
                  >
                    <div className="relative w-32 sm:w-40 flex-shrink-0 aspect-square bg-gray-200">
                      {campaign.image ? (
                        <SafeImage
                          src={campaign.image}
                          alt={campaign.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 128px, 160px"
                          fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-semibold">
                              {campaign.title.charAt(0)}
                            </div>
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-semibold">
                          {campaign.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 p-4 justify-center">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {(campaign.backers ?? 0).toLocaleString()} donations
                      </p>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mt-1">
                        {campaign.title}
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                        <div
                          className="bg-verified-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        {formatCurrency(raised)} raised
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="text-center mt-6">
            <Link
              href="/campaigns"
              className="inline-block text-white hover:text-white/90 font-medium text-sm underline"
            >
              View All Campaigns →
            </Link>
          </div>
        </div>
      </section>

        {/* Frequently Asked Questions */}
        <section className="mb-12 bg-success-50 rounded-2xl p-6 md:p-8" aria-label="Frequently asked questions">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-8 text-center" style={{ color: "#111827" }}>
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-3">
            {siteContent.homeFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-primary-200 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(faqOpenIndex === index ? null : index)}
                  aria-expanded={faqOpenIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ color: "#111827" }}
                >
                  <span className="pr-2">{faq.q}</span>
                  {faqOpenIndex === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0 text-primary-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {faqOpenIndex === index && (
                  <div id={`faq-answer-${index}`} className="px-5 pb-5 pt-0" role="region" aria-labelledby={`faq-question-${index}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#4b5563" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/faq"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm underline"
            >
              View all FAQs →
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-verified-50 to-verified-100 rounded-2xl border border-verified-200 p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-medium text-verified-700 mb-2">
                {siteStats ? siteStats.totalRaisedFormatted : "—"}
              </div>
              <div className="text-verified-800">Raised</div>
            </div>
            <div>
              <div className="text-4xl font-medium text-verified-700 mb-2">
                {siteStats != null ? siteStats.campaignCount.toLocaleString() : "—"}
              </div>
              <div className="text-verified-800">Campaigns</div>
            </div>
            <div>
              <div className="text-4xl font-medium text-verified-700 mb-2">
                {siteStats != null ? siteStats.totalSupporters.toLocaleString() : "—"}
              </div>
              <div className="text-verified-800">Supporters</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
