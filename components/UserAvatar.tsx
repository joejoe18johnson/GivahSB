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

/**
 * Shows user profile photo or a default avatar with the first letter of their name.
 * For Google sign-in without a profile pic, the initial is used.
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

  return (
    <div
      className={`rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      <span>{initial}</span>
    </div>
  );
}
