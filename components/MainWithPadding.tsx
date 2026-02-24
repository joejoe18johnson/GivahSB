"use client";

import { usePathname } from "next/navigation";

export default function MainWithPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  return (
    <main className={isAdmin ? "min-h-screen" : "min-h-screen pt-16"}>
      {children}
    </main>
  );
}
