"use client";

import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { Heart, Shield, Users, CheckCircle2 } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function AboutPage() {
  const { content } = useSiteContent();
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-medium mb-6">
              {content.aboutTitle}
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              {content.aboutSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <h2 className="text-4xl font-medium mb-6">Our Mission</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  {content.aboutMission}
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Our mission is to make it easy for individuals, organizations, and charities to raise funds for causes that matter, while ensuring transparency and trust through our verification process.
                </p>
              </div>
              <div className="relative h-96 w-full rounded-lg overflow-hidden">
                <div className="absolute inset-0">
                  <SafeImage
                    src="https://picsum.photos/seed/about1/800/600"
                    alt="Belizean Community"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    fallback={
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                        <Heart className="w-24 h-24 text-primary-600" />
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-medium text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-8 shadow-md">
                <Shield className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-2xl font-medium mb-3">Trust & Transparency</h3>
                <p className="text-gray-700">
                  We verify every campaign and campaign organizer to ensure transparency. All campaigns require proof of identity and need, building trust between donors and recipients.
                </p>
              </div>
              <div className="bg-white rounded-lg p-8 shadow-md">
                <Heart className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-2xl font-medium mb-3">Community First</h3>
                <p className="text-gray-700">
                  We&apos;re committed to supporting Belizean communities. Every Belizean Dollar raised goes directly to the cause - we charge zero platform fees.
                </p>
              </div>
              <div className="bg-white rounded-lg p-8 shadow-md">
                <Users className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-2xl font-medium mb-3">Accessibility</h3>
                <p className="text-gray-700">
                  We make fundraising accessible to everyone - individuals, organizations, and charities. Our platform is easy to use and available to all Belizeans.
                </p>
              </div>
              <div className="bg-white rounded-lg p-8 shadow-md">
                <CheckCircle2 className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-2xl font-medium mb-3">Integrity</h3>
                <p className="text-gray-700">
                  We operate with integrity and accountability. Our verification process ensures that funds go to legitimate causes and verified individuals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-medium text-center mb-12">What We Do</h2>
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-medium mb-3">Verified Campaigns</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We verify every campaign organizer&apos;s identity and review proof documents to ensure campaigns are legitimate and transparent. This builds trust and protects donors.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-medium mb-3">Zero Platform Fees</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Unlike many platforms, we charge zero platform fees. Every Belizean Dollar raised goes directly to the cause. We only charge what&apos;s necessary for secure payment processing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-medium mb-3">Community Support</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We connect those in need with generous supporters across Belize. Our platform makes it easy to share campaigns and receive donations from friends, family, and the wider community.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                  4
                </div>
                <div>
                  <h3 className="text-2xl font-medium mb-3">Flexible Campaigns</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Campaigns stay active as long as you need them. There&apos;s no time pressure - you can continue receiving donations even after reaching your goal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-medium mb-8">Our Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div>
                <div className="text-5xl font-medium mb-2">BZ$2.5M+</div>
                <div className="text-primary-100">Raised for Causes</div>
              </div>
              <div>
                <div className="text-5xl font-medium mb-2">1,200+</div>
                <div className="text-primary-100">Campaigns Created</div>
              </div>
              <div>
                <div className="text-5xl font-medium mb-2">15K+</div>
                <div className="text-primary-100">Supporters</div>
              </div>
            </div>
            <p className="text-xl text-primary-100">
              Together, we&apos;re making a difference in communities across Belize
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-medium mb-4">Join Us in Making a Difference</h2>
            <p className="text-xl text-gray-600 mb-8">
              Whether you need support or want to help others, GivahBz is here for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/campaigns/create"
                className="bg-success-500 text-white px-8 py-4 rounded-full font-medium hover:bg-success-600 transition-colors text-lg shadow-lg"
              >
                Start a Campaign
              </Link>
              <Link
                href="/campaigns"
                className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-full font-medium hover:bg-primary-50 transition-colors text-lg"
              >
                Support a Campaign
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
