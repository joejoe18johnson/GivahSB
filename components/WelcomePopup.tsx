"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSiteContent } from "@/hooks/useSiteContent";

const STORAGE_KEY = "givahbz_welcome_dismissed";

export default function WelcomePopup() {
  const pathname = usePathname();
  const { content } = useSiteContent();
  const [show, setShow] = useState(false);

  // Do not show on auth pages (reset password, confirm email, login, signup, etc.)
  const isAuthRoute = pathname?.startsWith("/auth") ?? false;
  if (isAuthRoute) return null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setShow(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={dismiss}
      />
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 pt-8">
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-4">
            <Image
              src="/givah-logo.png"
              alt="Givah"
              width={144}
              height={144}
              className="object-contain"
            />
          </div>
          <h2 id="welcome-title" className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-3">
            Welcome to {content.siteName}
          </h2>
          <p className="text-center text-gray-600 mb-4">
            {content.aboutMission}
          </p>
          <p className="text-center text-primary-600 font-medium mb-6">
            You don&apos;t need to be logged in to donate!
          </p>
          <Link
            href="/campaigns/create"
            onClick={dismiss}
            className="block w-full py-3 px-4 text-center font-medium text-white bg-success-600 hover:bg-success-700 rounded-xl transition-colors"
          >
            Start your first campaign
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="block w-full mt-3 py-2.5 text-center font-medium text-gray-600 hover:text-gray-800"
          >
            Explore campaigns
          </button>
        </div>
      </div>
    </div>
  );
}
