"use client";

import { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Share2, Link2, MessageCircle, Facebook, Send, X } from "lucide-react";

interface ShareCampaignProps {
  campaignTitle: string;
  /** Either full URL or campaign id (URL is built from origin + /campaigns/id). */
  campaignUrl?: string;
  campaignId?: string;
  /** Compact: single share icon button. Full: "Share this campaign" button. Both open the same modal. */
  variant?: "compact" | "full";
  className?: string;
}

/** Shared modal content: Copy link, WhatsApp, Facebook, Messenger. Rendered in a fixed overlay. */
function ShareModalContent({
  onClose,
  copyLink,
  copied,
  shareWhatsApp,
  shareFacebook,
  shareMessenger,
}: {
  onClose: () => void;
  copyLink: () => void;
  copied: boolean;
  shareWhatsApp: () => void;
  shareFacebook: () => void;
  shareMessenger: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-[101] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Share campaign"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Share this campaign</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Link2 className="w-5 h-5 flex-shrink-0 text-gray-500" />
            <span className="font-medium">{copied ? "Copied!" : "Copy link"}</span>
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
          >
            <MessageCircle className="w-5 h-5 flex-shrink-0 text-gray-500" />
            <span className="font-medium">WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={shareFacebook}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Facebook className="w-5 h-5 flex-shrink-0 text-gray-500" />
            <span className="font-medium">Facebook</span>
          </button>
          <button
            type="button"
            onClick={shareMessenger}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Send className="w-5 h-5 flex-shrink-0 text-gray-500" />
            <span className="font-medium">Messenger</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function ShareCampaign({
  campaignTitle,
  campaignUrl: urlProp,
  campaignId,
  variant = "full",
  className = "",
}: ShareCampaignProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const campaignUrl = useMemo(() => {
    if (urlProp) return urlProp;
    if (typeof window !== "undefined" && campaignId)
      return `${window.location.origin}/campaigns/${campaignId}`;
    return campaignId ? `/campaigns/${campaignId}` : "";
  }, [urlProp, campaignId]);

  const absoluteUrl =
    typeof window !== "undefined" && campaignUrl && !campaignUrl.startsWith("http")
      ? `${window.location.origin}${campaignUrl}`
      : campaignUrl;

  const shareText = `${campaignTitle} – support this campaign on GivahBz: ${absoluteUrl || campaignUrl}`;

  const copyLink = useCallback(async () => {
    const urlToCopy = absoluteUrl || campaignUrl;
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = urlToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [absoluteUrl, campaignUrl]);

  const shareWhatsApp = useCallback(() => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  }, [shareText]);

  const shareFacebook = useCallback(() => {
    const u = absoluteUrl || campaignUrl;
    if (!u) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
    setOpen(false);
  }, [absoluteUrl, campaignUrl]);

  const shareMessenger = useCallback(() => {
    const u = absoluteUrl || campaignUrl;
    if (!u) return;
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(u)}&redirect_uri=${encodeURIComponent(u)}&display=page`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
    setOpen(false);
  }, [absoluteUrl, campaignUrl]);

  const openModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <ShareModalContent
            onClose={closeModal}
            copyLink={copyLink}
            copied={copied}
            shareWhatsApp={shareWhatsApp}
            shareFacebook={shareFacebook}
            shareMessenger={shareMessenger}
          />,
          document.body
        )
      : null;

  if (variant === "compact") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={openModal}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg transition-colors hover:bg-white flex-shrink-0"
          aria-label="Share campaign"
        >
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
        {modal}
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`.trim()}>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-verified-500 bg-verified-50 px-4 py-2.5 text-sm font-medium text-verified-800 transition-colors hover:bg-verified-100"
        aria-label="Share campaign"
      >
        <Share2 className="w-4 h-4" />
        Share this campaign
      </button>
      {modal}
    </div>
  );
}
