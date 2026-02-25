"use client";

import Image from "next/image";

interface UserAvatarProps {
  profilePhoto?: string | null;
  name: string;
  email?: string;
  size?: 32 | 40 | 96;
  className?: string;
}

const sizeClasses = {
  32: "w-8 h-8 text-sm",
  40: "w-10 h-10 text-sm",
  96: "w-24 h-24 min-w-[6rem] min-h-[6rem] text-3xl",
} as const;

const sizePx = { 32: 32, 40: 40, 96: 96 } as const;

/** Vibrant background colors for initial avatars (white letter). Same user => same color. */
const INITIAL_AVATAR_COLORS = [
  "bg-[#0d9488]", // teal
  "bg-[#0891b2]", // cyan
  "bg-[#2563eb]", // blue
  "bg-[#4f46e5]", // indigo
  "bg-[#7c3aed]", // violet
  "bg-[#a855f7]", // purple
  "bg-[#c026d3]", // fuchsia
  "bg-[#db2777]", // pink
  "bg-[#dc2626]", // red
  "bg-[#ea580c]", // orange
  "bg-[#ca8a04]", // yellow
  "bg-[#65a30d]", // lime
  "bg-[#059669]", // emerald
] as const;

function getInitialAvatarColor(name?: string, email?: string): string {
  const seed = (name?.trim() || "") + (email?.trim() || "");
  if (!seed) return INITIAL_AVATAR_COLORS[0];
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return INITIAL_AVATAR_COLORS[n % INITIAL_AVATAR_COLORS.length];
}

/**
 * Shows user profile photo (e.g. Google image) or an initial avatar: first letter on a colored circle.
 * For no photo, uses a deterministic color from name/email so the same user always gets the same color.
 */
export default function UserAvatar({
  profilePhoto,
  name,
  email,
  size = 40,
  className = "",
}: UserAvatarProps) {
  const initial = (name?.trim() || email?.trim() || "?")[0].toUpperCase();
  const sizeClass = sizeClasses[size];
  const px = sizePx[size];

  if (profilePhoto) {
    return (
      <Image
        src={profilePhoto}
        alt={name || "Profile"}
        width={px}
        height={px}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass} ${className}`}
        unoptimized
      />
    );
  }

  const bgColor = getInitialAvatarColor(name, email);
  return (
    <div
      className={`rounded-full overflow-hidden ${bgColor} flex items-center justify-center text-white font-medium flex-shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      <span>{initial}</span>
    </div>
  );
}
