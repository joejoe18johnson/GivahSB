"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  ImageIcon,
  ShieldCheck,
  XCircle,
  CheckCircle2,
} from "lucide-react";

export default function CampaignGuidePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-medium mb-4">
              How to Create a Good Campaign
            </h1>
            <p className="text-lg md:text-xl text-primary-100">
              Clear story, strong visuals, and following our rules help your campaign get approved and earn trust from donors.
            </p>
          </div>
        </div>
      </section>

      {/* Explain the situation + best pictures */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-medium text-center mb-10 text-gray-900">
              Tell Your Story Clearly
            </h2>
            <p className="text-gray-700 text-center mb-10 max-w-2xl mx-auto">
              Explain the situation in a few sentences: who needs help, why, and how the funds will be used. Be specific so donors understand the need.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success-500 flex items-center justify-center text-white flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Use strong photos</h3>
                    <p className="text-gray-600 text-sm">
                      Choose images that show the real need or context. One or two clear photos that explain the situation work better than many unrelated ones.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success-500 flex items-center justify-center text-white flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Keep the story focused</h3>
                    <p className="text-gray-600 text-sm">
                      Short description for the card, then a fuller story for the campaign page. Include proof of need and how much you need (goal).
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <Image
                  src="/cancer-treatment-ana-1.png"
                  alt="Example: campaign image that shows the situation clearly"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules: no contact info */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-medium text-center mb-8 text-gray-900 dark:text-gray-100">
              Campaign Rules
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start gap-4">
                <XCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No contact information on your campaign
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Do not put addresses, phone numbers, or email addresses in the campaign title, description, or images. Contact happens through GivahBZ and your verified account only.
                  </p>
                </div>
              </div>
              <div className="p-6 flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-success-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Proof of need required
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Upload documents that show the need (e.g. medical letter, school letter, repair quote). This helps donors trust your campaign and speeds up approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vetting / approval */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 p-6 md:p-8 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <ShieldCheck className="w-10 h-10 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                  All campaigns are reviewed before going live
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Every campaign is vetted and approved by GivahBZ before it goes live. This keeps the platform safe and trustworthy. If your campaign is not approved, we’ll tell you why and you can edit and resubmit. Follow this guide to improve your chances of approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">
              Ready to create your campaign?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/campaigns/create"
                className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                Create a campaign
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center border-2 border-primary-600 text-primary-600 dark:text-primary-400 px-6 py-3 rounded-full font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                How GivahBZ works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
