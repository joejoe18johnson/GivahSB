"use client";

import { useState, useEffect, useRef } from "react";
import { Campaign } from "@/lib/data";
import { fetchCampaign } from "@/lib/services/campaignService";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { Calendar, Users, Heart, CheckCircle2, ShieldCheck } from "lucide-react";
import CampaignDonateSection from "@/components/CampaignDonateSection";
import CampaignUpdates from "@/components/CampaignUpdates";
import RewardsSection from "@/components/RewardsSection";
import ProofDocuments from "@/components/ProofDocuments";
import ShareCampaign from "@/components/ShareCampaign";
import DonorsList from "@/components/DonorsList";
import { formatCurrency } from "@/lib/utils";
import { useHearted } from "@/components/HeartedCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";
import { useToast } from "@/components/Toast";

interface PageProps {
  params: {
    id: string;
  };
}

export default function CampaignPage({ params }: PageProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const coverCarouselRef = useRef<HTMLDivElement>(null);
  const scrollRAF = useRef<number | null>(null);
  const { user } = useAuth();
  const { isCampaignHearted, toggleHeart } = useHearted();
  const isHearted = campaign ? isCampaignHearted(campaign.id) : false;
  const { alert } = useThemedModal();
  const toast = useToast();

  useEffect(() => {
    async function loadCampaign() {
      try {
        const fetchedCampaign = await fetchCampaign(params.id);
        if (fetchedCampaign) {
          setCampaign(fetchedCampaign);
        }
      } catch (error) {
        console.error("Error loading campaign:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaign();
  }, [params.id]);

  useEffect(() => {
    return () => {
      if (scrollRAF.current != null) cancelAnimationFrame(scrollRAF.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    notFound();
  }

  const goalNum = Number(campaign.goal) || 1;
  const raisedNum = Number(campaign.raised) || 0;
  const isFullyFunded = goalNum > 0 && raisedNum >= goalNum;
  const progress = (raisedNum / goalNum) * 100;
  const progressPercentage = Math.min(progress, 100);

  const handleToggleHeart = async () => {
    if (!user) {
      alert("You need to be logged in to save campaigns.", {
        title: "Log in to save campaigns",
        variant: "info",
      });
      return;
    }
    if (campaign) {
      const newState = await toggleHeart(campaign.id);
      if (newState) toast.show("Campaign Saved to Favorites");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Single grid: on mobile = image, then content, then sidebar. On desktop = image+content left, sidebar right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-4 lg:gap-6">
        {/* Cover section: title, media, creator — image height matches sidebar (~same as right card) */}
        <div className="min-w-0 flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {campaign.title}
          </h1>

          {/* Mobile: carousel with dots */}
          {(() => {
            const image1 = campaign.image;
            const image2 = campaign.image2 ?? campaign.image;
            const slides = [image1, image2];
            const fallbackContent = () => (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                <span className="text-primary-600 text-5xl font-medium opacity-20">
                  {campaign.title.charAt(0)}
                </span>
              </div>
            );
            return (
              <>
                <div className="sm:hidden w-full min-w-0 h-[220px] rounded-xl overflow-hidden relative isolate">
                  <div
                    ref={coverCarouselRef}
                    className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      touchAction: "pan-x pan-y",
                      scrollBehavior: "auto",
                    }}
                    onScroll={() => {
                      const el = coverCarouselRef.current;
                      if (!el || slides.length === 0) return;
                      if (scrollRAF.current != null) cancelAnimationFrame(scrollRAF.current);
                      scrollRAF.current = requestAnimationFrame(() => {
                        scrollRAF.current = null;
                        const width = el.offsetWidth;
                        const index = Math.round(el.scrollLeft / width);
                        const clamped = Math.max(0, Math.min(index, slides.length - 1));
                        setCoverIndex(clamped);
                      });
                    }}
                  >
                    {slides.map((src, i) => (
                      <div
                        key={i}
                        className="relative flex-shrink-0 w-full h-full bg-gray-200 snap-start"
                        style={{ minWidth: "100%" }}
                      >
                        {src ? (
                          <SafeImage
                            src={src}
                            alt={`${campaign.title} (${i + 1})`}
                            fill
                            className="object-cover"
                            sizes="100vw"
                            priority={i === 0}
                            fallback={fallbackContent()}
                          />
                        ) : (
                          fallbackContent()
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                          <ShareCampaign
                            campaignId={campaign.id}
                            campaignTitle={campaign.title}
                            variant="compact"
                          />
                          <button
                            onClick={handleToggleHeart}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors flex-shrink-0 ${
                              !user
                                ? "bg-white/60 hover:bg-white/80 text-gray-400 cursor-not-allowed"
                                : isHearted
                                ? "bg-white/90 text-red-500"
                                : "bg-white/90 text-gray-700 hover:bg-white"
                            }`}
                            aria-label={!user ? "Log in to like campaigns" : isHearted ? "Remove from hearted" : "Add to hearted"}
                          >
                            <Heart className={`w-5 h-5 ${isHearted ? "fill-red-500" : !user ? "opacity-50" : ""}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCoverIndex(i);
                          const el = coverCarouselRef.current;
                          if (el) {
                            el.scrollTo({ left: i * el.offsetWidth, behavior: "smooth" });
                          }
                        }}
                        className="pointer-events-auto w-2.5 h-2.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                        style={{
                          backgroundColor: coverIndex === i ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                        }}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Desktop: two-column grid */}
                <div className="hidden sm:grid grid-cols-2 gap-4 sm:gap-6 w-full min-w-0 h-[260px] lg:h-[400px]">
                  <div className="relative w-full h-full min-w-0 bg-gray-200 rounded-xl overflow-hidden">
                    {campaign.image ? (
                      <SafeImage
                        src={campaign.image}
                        alt={campaign.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 30vw"
                        priority
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                            <span className="text-primary-600 text-5xl font-medium opacity-20">
                              {campaign.title.charAt(0)}
                            </span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-200 to-primary-400">
                        <span className="text-primary-600 text-5xl font-medium opacity-20">
                          {campaign.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative w-full h-full min-w-0 bg-gray-200 rounded-xl overflow-hidden">
                    {(campaign.image2 ?? campaign.image) ? (
                      <SafeImage
                        src={campaign.image2 ?? campaign.image}
                        alt={`${campaign.title} (2)`}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 1024px) 50vw, 30vw"
                        fallback={
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-500">
                            <span className="text-primary-700 text-5xl font-medium opacity-20">
                              {campaign.title.charAt(0)}
                            </span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-300 to-primary-500">
                        <span className="text-primary-700 text-5xl font-medium opacity-20">
                          {campaign.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-2 pointer-events-auto">
                      <ShareCampaign
                        campaignId={campaign.id}
                        campaignTitle={campaign.title}
                        variant="compact"
                      />
                      <button
                        onClick={handleToggleHeart}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-colors flex-shrink-0 ${
                          !user
                            ? "bg-white/60 hover:bg-white/80 text-gray-400 cursor-not-allowed"
                            : isHearted
                            ? "bg-white/90 text-red-500"
                            : "bg-white/90 text-gray-700 hover:bg-white"
                        }`}
                        aria-label={!user ? "Log in to like campaigns" : isHearted ? "Remove from hearted" : "Add to hearted"}
                        title={!user ? "Log in to like campaigns" : undefined}
                      >
                        <Heart className={`w-5 h-5 ${isHearted ? "fill-red-500" : !user ? "opacity-50" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {campaign.creator.charAt(0)}
            </div>
            <p className="text-gray-700 font-medium">
              {campaign.creator}
              {campaign.location && (
                <span className="text-gray-500 font-normal text-sm ml-1.5">
                  · {campaign.location}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats, Share, Donate - fixed and anchored on the right on desktop; below content on mobile */}
        <div className="order-3 lg:order-2 w-full lg:row-span-2 lg:self-start lg:relative">
          <div className="hidden lg:block absolute top-0 left-0 w-80 min-h-[calc(100vh-6rem)] pointer-events-none" aria-hidden="true" />
          <div className="bg-white rounded-xl border-2 border-verified-500 shadow-sm p-5 sticky top-24 lg:fixed lg:top-24 lg:w-80 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:z-10 lg:right-[max(1rem,calc((100vw-1280px)/2+1rem))]">
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-verified-600">
                  {formatCurrency(campaign.raised)}
                </span>
                <span className="text-gray-500">
                  of {formatCurrency(campaign.goal)} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-verified-500 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                {progressPercentage.toFixed(1)}% funded
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5 pb-5 border-b border-gray-200">
              <div>
                <div className="text-lg font-medium text-gray-900">{campaign.backers}</div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  backers
                </div>
              </div>
              <div>
                <div className="text-lg font-medium text-gray-900">{campaign.daysLeft}</div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  days left
                </div>
              </div>
            </div>
            <ShareCampaign
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              variant="full"
              className="mb-5 pb-5 border-b border-gray-200"
            />
            <div id="campaign-donate" className="pb-24 sm:pb-8">
              <CampaignDonateSection
                campaignId={campaign.id}
                campaignTitle={campaign.title}
                goal={campaign.goal}
                raised={campaign.raised}
                onDonationModalChange={setIsDonationModalOpen}
              />
            </div>
            {campaign.rewards && campaign.rewards.length > 0 && (
              <RewardsSection rewards={campaign.rewards} />
            )}
          </div>
        </div>

        {/* Main content: category, description, etc. (order-2 on mobile so it appears before sidebar) */}
        <div className="order-2 lg:order-3 min-w-0">
          {/* Category Badge and Verification */}
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
              {campaign.category}
            </span>
            {campaign.adminBacked && (
              <div className="bg-verified-100 text-verified-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border border-verified-300 shadow-sm ring-1 ring-verified-200/50">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-verified-600" />
                Givah Approved Campaign
              </div>
            )}
            {campaign.verified && (
              <div className="bg-verified-100 text-verified-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Verified Campaign
              </div>
            )}
            {campaign.creatorType && (
              <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm">
                {campaign.creatorType === "individual" ? "Individual" : 
                 campaign.creatorType === "organization" ? "Organization" : 
                 "Charity"}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="prose max-w-none mb-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              {campaign.fullDescription || campaign.description}
            </p>
          </div>

          {/* Proof Documents */}
          {campaign.proofDocuments && campaign.proofDocuments.length > 0 && (
            <ProofDocuments documents={campaign.proofDocuments} />
          )}

          {/* Updates */}
          {campaign.updates && campaign.updates.length > 0 && (
            <CampaignUpdates updates={campaign.updates} />
          )}
        </div>
      </div>

      {/* Mobile-only sticky Donate bar - hidden when modal open or campaign fully funded */}
      {!isDonationModalOpen && !isFullyFunded && (
        <>
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[50] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
            <button
              type="button"
              onClick={() => document.getElementById("campaign-donate")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="w-full min-h-[48px] bg-green-500 text-white rounded-xl font-semibold text-base active:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Donate to this campaign
            </button>
          </div>
          <div className="lg:hidden h-20" aria-hidden="true" />
        </>
      )}

      {/* Donors List - same width as cover/main content column */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-4 lg:gap-6">
        <div className="min-w-0">
          <DonorsList campaignId={campaign.id} />
        </div>
        <div className="hidden lg:block" aria-hidden="true" />
      </div>
    </div>
  );
}
