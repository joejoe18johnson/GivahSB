"use client";

import Link from "next/link";
import Image from "next/image";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function Footer() {
  const { content } = useSiteContent();
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/givah-logo.png"
                alt={content.siteName}
                width={140}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <p className="text-gray-400">
              {content.footerTagline}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Start Fundraising</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/campaigns/create" className="hover:text-white">Create a Campaign</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/fees-payouts" className="hover:text-white">Fees & Payouts</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/campaigns" className="hover:text-white">Browse Campaigns</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">About</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How {content.siteName} Works</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>{content.footerCopyright}</p>
        </div>
      </div>
    </footer>
  );
}
