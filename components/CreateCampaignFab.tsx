"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";
import { Plus } from "lucide-react";

export default function CreateCampaignFab() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { confirm } = useThemedModal();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) return null;

  const handleNotLoggedIn = async () => {
    const goToLogin = await confirm(
      "Please sign in to create a campaign. Would you like to go to the sign-in page?",
      { title: "Sign in required", confirmLabel: "Sign in", cancelLabel: "Cancel", variant: "primary" }
    );
    if (goToLogin) router.push("/auth/login?callbackUrl=/campaigns/create");
  };

  return (
    <>
      {user ? (
        <Link
          href="/campaigns/create"
          className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-2 bg-verified-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-verified-600 active:bg-verified-600 font-semibold text-sm"
          aria-label="Create / Start Campaign"
        >
          <Plus className="w-5 h-5 shrink-0" />
          Create/ Start Campaign
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleNotLoggedIn}
          className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center gap-2 bg-verified-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-verified-600 active:bg-verified-600 font-semibold text-sm"
          aria-label="Create / Start Campaign"
        >
          <Plus className="w-5 h-5 shrink-0" />
          Create/ Start Campaign
        </button>
      )}
    </>
  );
}
