"use client";

import { useState, useEffect } from "react";
import { isCampaignStopped } from "@/lib/campaignState";
import DonateButton from "./DonateButton";
import { StopCircle, Trophy } from "lucide-react";

interface CampaignDonateSectionProps {
  campaignId: string;
  campaignTitle: string;
  /** When provided and raised >= goal, donations are disabled and a "fully funded" message is shown. */
  goal?: number;
  raised?: number;
  onDonationModalChange?: (open: boolean) => void;
}

export default function CampaignDonateSection({
  campaignId,
  campaignTitle,
  goal,
  raised,
  onDonationModalChange,
}: CampaignDonateSectionProps) {
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    setStopped(isCampaignStopped(campaignId));
  }, [campaignId]);

  const goalNum = Number(goal) || 0;
  const raisedNum = Number(raised) || 0;
  const isFullyFunded = goalNum > 0 && raisedNum >= goalNum;

  if (stopped) {
    return (
      <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-amber-800 font-medium flex items-center gap-2">
          <StopCircle className="w-5 h-5 flex-shrink-0" />
          This campaign has been stopped by the organizer. Donations are no longer accepted.
        </p>
      </div>
    );
  }

  if (isFullyFunded) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-verified-50 border border-verified-200">
        <p className="text-verified-800 font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 flex-shrink-0 text-verified-600" />
          Campaign has been fully funded
        </p>
        <p className="text-verified-700 text-sm mt-2">
          Thank you to everyone who contributed. No further donations are being accepted for this campaign.
        </p>
      </div>
    );
  }

  return (
    <DonateButton
      campaignId={campaignId}
      campaignTitle={campaignTitle}
      onDonationModalChange={onDonationModalChange}
    />
  );
}
