"use client";

import Image from "next/image";
import { Heart } from "lucide-react";

// Diverse, happy and grateful people — Hispanic and Black representation (Unsplash, free to use)
const HERO_IMAGES = {
  // Central: community / connection (two people, grateful)
  main: "https://images.unsplash.com/photo-1529153397083-583ae2ee3a62?w=600&q=85",
  // Circular portraits: happy and grateful Black and Hispanic people
  circle1: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=85", // woman smiling
  circle2: "https://images.unsplash.com/photo-1529626455594-4ff0802cfbeb?w=300&q=85", // Black woman
  circle3: "https://images.unsplash.com/photo-1507003211169-9a9d7a8c4f22?w=300&q=85", // person portrait
  circle4: "https://images.unsplash.com/photo-1551836022-deb4028be6f7?w=300&q=85",   // woman grateful
  circle5: "https://images.unsplash.com/photo-1544005313-94ddf0286d6f?w=300&q=85",   // woman happy
  // Hands / gratitude
  hands: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&q=85",
};

export default function HeroCommunityCollage() {
  return (
    <div className="relative w-full max-w-md aspect-[4/3] min-h-[280px] flex justify-center items-center">
      {/* Subtle dot-pattern background */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #16a34a 1px, transparent 0)`,
          backgroundSize: "24px 24px",
          backgroundColor: "rgb(240 253 244)",
        }}
        aria-hidden
      />

      {/* Central main image */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-[70%] max-w-[320px] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/80">
          <Image
            src={HERO_IMAGES.main}
            alt="Community supporting each other"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 70vw, 320px"
            unoptimized
          />
          {/* Small heart icon overlay */}
          <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" aria-hidden />
          </div>
        </div>
      </div>

      {/* Circular images around the main */}
      {/* Top-left - happy woman */}
      <div className="absolute top-[8%] left-[2%] w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-emerald-400 shadow-lg z-10 relative">
        <Image src={HERO_IMAGES.circle1} alt="Happy community member" fill className="object-cover" sizes="80px" unoptimized />
      </div>
      {/* Top-right - grateful person */}
      <div className="absolute top-[5%] right-[8%] w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-pink-300 shadow-lg z-10 relative">
        <Image src={HERO_IMAGES.circle2} alt="Grateful community member" fill className="object-cover" sizes="80px" unoptimized />
      </div>
      {/* Right - hands / hope */}
      <div className="absolute top-[38%] right-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-4 ring-amber-300 shadow-lg z-10 relative">
        <Image src={HERO_IMAGES.hands} alt="Giving and gratitude" fill className="object-cover" sizes="64px" unoptimized />
      </div>
      {/* Bottom-right */}
      <div className="absolute bottom-[18%] right-[5%] w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-4 ring-emerald-400 shadow-lg z-10 relative">
        <Image src={HERO_IMAGES.circle4} alt="Happy supporter" fill className="object-cover" sizes="64px" unoptimized />
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-[12%] left-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-emerald-500 shadow-lg z-10 relative">
        <Image src={HERO_IMAGES.circle5} alt="Community member" fill className="object-cover" sizes="80px" unoptimized />
      </div>

      {/* Belize accent (blue circle — replace with flag image if desired) */}
      <div className="absolute bottom-[10%] left-[12%] w-9 h-9 rounded-full bg-primary-500 ring-2 ring-white shadow z-10" aria-hidden />
    </div>
  );
}
