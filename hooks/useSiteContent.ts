"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteContent } from "@/lib/siteContent";
import { mergeWithDefaults } from "@/lib/siteContent";

export function useSiteContent(): { content: SiteContent; isLoading: boolean; error: string | null; refetch: () => Promise<void> } {
  const [content, setContent] = useState<SiteContent>(() => mergeWithDefaults(null));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/site-content", { cache: "no-store" });
      const data = await res.json();
      setContent(mergeWithDefaults(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setContent(mergeWithDefaults(null));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { content, isLoading, error, refetch };
}
