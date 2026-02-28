"use client";

import Image from "next/image";
import SafeImage from "@/components/SafeImage";

/** Main hero image (center) */
const HERO_MAIN = { src: "/hero-right.png", alt: "Community connection and support" };

/** Circular images: children and community — happy and grateful. */
const HERO_CIRCLES: Array<{
  src: string;
  alt: string;
  borderColor: string;
  position: string;
  onTop?: boolean;
}> = [
  {
    src: "/hero-circle-1.png",
    alt: "Child with globe — community and hope",
    borderColor: "ring-4 ring-green-500",
    position: "top-[8%] left-[0%] w-20 h-20 sm:w-24 sm:h-24",
  },
  {
    src: "/hero-circle-2.png",
    alt: "Children embracing — support and friendship",
    borderColor: "ring-4 ring-pink-400",
    position: "top-[5%] right-[5%] w-20 h-20 sm:w-24 sm:h-24",
  },
  {
    src: "/hero-circle-3.png",
    alt: "Smiling siblings — family and joy",
    borderColor: "ring-4 ring-green-500",
    position: "bottom-[18%] right-[12%] w-14 h-14 sm:w-20 sm:h-20",
  },
  {
    src: "/hero-circle-4.png",
    alt: "Community together — surprise and joy",
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
          className={`absolute rounded-full overflow-hidden shadow-lg ${circle.borderColor} ${circle.position} ${circle.onTop ? "z-20" : "z-10"}`}
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
