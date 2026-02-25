"use client";

import Image from "next/image";
import SafeImage from "@/components/SafeImage";

/** Main hero image (center) */
const HERO_MAIN = { src: "/hero-right.png", alt: "Community connection and support" };

/** Circular images: Black, Mayan, and Latin American people — happy and grateful community. */
const HERO_CIRCLES = [
  {
    src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop",
    alt: "Happy Black community member",
    borderColor: "ring-4 ring-green-500",
    position: "top-[8%] left-[0%] w-20 h-20 sm:w-24 sm:h-24",
  },
  {
    src: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop",
    alt: "Grateful Latin American community member",
    borderColor: "ring-4 ring-pink-400",
    position: "top-[5%] right-[5%] w-20 h-20 sm:w-24 sm:h-24",
  },
  {
    src: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=200&h=200&fit=crop",
    alt: "Mayan woman in traditional dress",
    borderColor: "ring-4 ring-amber-400",
    position: "top-[38%] right-[2%] w-16 h-16 sm:w-20 sm:h-20",
    onTop: true, // render in front so it sits over the central image (e.g. woman's hair)
  },
  {
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
    alt: "Black woman, grateful community supporter",
    borderColor: "ring-4 ring-green-500",
    position: "bottom-[28%] right-[2%] w-16 h-16 sm:w-20 sm:h-20",
  },
  {
    src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop",
    alt: "Happy Latin American man",
    borderColor: "ring-4 ring-green-500",
    position: "bottom-[18%] right-[12%] w-14 h-14 sm:w-20 sm:h-20",
  },
  {
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    alt: "Latin American community member",
    borderColor: "ring-4 ring-primary-400",
    position: "bottom-[8%] left-[15%] w-14 h-14 sm:w-20 sm:h-20",
  },
];

export default function HeroCommunityVisual() {
  return (
    <div className="relative max-w-md w-full aspect-[4/3] min-h-[280px] flex justify-center items-center">
      {/* Central image - original hero */}
      <div className="relative z-0 w-full h-full flex justify-center items-center">
        <SafeImage
          src={HERO_MAIN.src}
          alt={HERO_MAIN.alt}
          className="w-full h-full object-contain block rounded-lg"
        />
      </div>

      {/* Circular images around the main - happy & grateful people */}
      {HERO_CIRCLES.map((circle, i) => (
        <div
          key={i}
          className={`absolute z-10 rounded-full overflow-hidden shadow-lg ${circle.borderColor} ${circle.position}`}
        >
          <Image
            src={circle.src}
            alt={circle.alt}
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
