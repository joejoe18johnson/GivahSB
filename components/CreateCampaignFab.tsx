"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

export default function CreateCampaignFab() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (!user || isAdminRoute) return null;

  return (
    <Link
      href="/campaigns/create"
      className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-2 bg-success-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-success-600 active:bg-success-600 font-semibold text-sm"
      aria-label="Create / Start Campaign"
    >
      <Plus className="w-5 h-5 shrink-0" />
      Create/ Start Campaign
    </Link>
  );
}
