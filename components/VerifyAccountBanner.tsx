"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { ShieldAlert, ChevronRight } from "lucide-react";

function isFullyVerified(user: { phoneVerified?: boolean; idVerified?: boolean; addressVerified?: boolean }): boolean {
  return !!(user.phoneVerified && user.idVerified && user.addressVerified);
}

export default function VerifyAccountBanner() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isVerificationPage = pathname === "/verification-center";

  if (isLoading || !user || isAdminRoute || isVerificationPage) return null;
  if (isFullyVerified(user)) return null;

  return (
    <div
      className="bg-amber-50 border-b border-amber-200 text-amber-900"
      role="region"
      aria-label="Verification notice"
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-2 flex-wrap">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <span className="text-sm font-medium">
          Please verify account to start a campaign.
        </span>
        <Link
          href="/verification-center"
          className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2"
        >
          Verify now
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
