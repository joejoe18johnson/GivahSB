import SafeImage from "@/components/SafeImage";
import { CheckCircle2, Share2, DollarSign, Clock, Users, Shield } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "1",
      title: "Create a Fundraiser",
      description: "Make a campaign page for your cause - whether it's a personal need, charity, organization, or community project.",
      icon: <Users className="w-8 h-8" />,
      details: [
        "Set up your campaign with photos and your story",
        "Set your fundraising goal in Belizean Dollars (BZ$)",
        "Upload proof documents to verify your need",
        "Choose your campaign duration"
      ]
    },
    {
      number: "2",
      title: "Get Verified",
      description: "Our team reviews your campaign and verifies your identity and proof documents to ensure trust and transparency.",
      icon: <Shield className="w-8 h-8" />,
      details: [
        "Identity verification (ID and address proof required)",
        "Review of proof of need documents",
        "Campaign approval typically within 24-48 hours",
        "Verified badge displayed on your campaign"
      ]
    },
    {
      number: "3",
      title: "Share Your Campaign",
      description: "Send your campaign link to friends, family, and supporters to invite donations.",
      icon: <Share2 className="w-8 h-8" />,
      details: [
        "Share via social media, email, or messaging",
        "Use our built-in sharing tools",
        "Track your campaign's progress in real-time",
        "Engage with supporters through updates"
      ]
    },
    {
      number: "4",
      title: "Receive Funds",
      description: "People donate online, and funds are paid to you regularly. No time pressure - your campaign stays active as long as you want.",
      icon: <DollarSign className="w-8 h-8" />,
      details: [
        "Donations processed securely online",
        "Funds transferred to your account monthly",
        "Keep receiving donations even after hitting your goal"
      ]
    }
  ];

  const benefits = [
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "No Platform Fees",
      text: "Every Belizean Dollar raised goes directly to your cause. We charge no platform fee."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified & Trusted",
      text: "All campaigns are verified with proof of identity and need, ensuring transparency and trust."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "No Time Pressure",
      text: "Your campaign stays active as long as you need it. Keep receiving donations even after reaching your goal."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community Support",
      text: "Connect with the Belizean community and receive support from people who care about your cause."
    }
  ];

  const useCases = [
    {
      title: "Medical Costs",
      description: "Cover medical expenses, surgeries, treatments, or healthcare needs",
      image: "https://picsum.photos/seed/usecase1/600/400"
    },
    {
      title: "Education",
      description: "Support school supplies, tuition fees, educational resources, or student needs",
      image: "https://picsum.photos/seed/usecase2/600/400"
    },
    {
      title: "Community Projects",
      description: "Fund community centers, local initiatives, or neighborhood improvements",
      image: "https://picsum.photos/seed/usecase6/600/400"
    },
    {
      title: "Disaster Relief",
      description: "Emergency funding for hurricane damage, floods, or natural disasters",
      image: "https://picsum.photos/seed/usecase4/600/400"
    },
    {
      title: "Charity Events",
      description: "Raise funds for charity organizations, non-profits, or community events",
      image: "https://picsum.photos/seed/usecase5/600/400"
    },
    {
      title: "Personal Support",
      description: "Help individuals and families facing financial hardship or emergencies",
      image: "https://picsum.photos/seed/usecase6/600/400"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-medium mb-6">
              How GivahBz Works
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8">
              A simple, trusted way to raise money for causes that matter to Belizean communities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/campaigns/create"
                className="bg-white text-primary-600 px-8 py-3 rounded-full font-medium hover:bg-primary-50 transition-colors"
              >
                Start Your Campaign
              </Link>
              <Link
                href="/campaigns"
                className="border-2 border-white text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-colors"
              >
                Browse Campaigns
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-medium text-center mb-12">How It Works</h2>
          <div className="max-w-5xl mx-auto space-y-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-success-500 rounded-full flex items-center justify-center text-white">
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl font-medium text-primary-600">{step.number}</span>
                    <h3 className="text-2xl font-medium text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-lg text-gray-700 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-600">
                        <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-medium text-center mb-12">Why Choose GivahBz?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-gray-200 transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-success-500 rounded-full flex items-center justify-center text-white">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-medium text-center mb-4">Great For:</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            GivahBz supports a wide range of causes and needs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-shadow group"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0">
                    <SafeImage
                      src={useCase.image}
                      alt={useCase.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      fallback={
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                          <span className="text-primary-600 text-3xl font-medium">
                            {useCase.title.charAt(0)}
                          </span>
                        </div>
                      }
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{useCase.title}</h3>
                  <p className="text-gray-600">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-medium text-center mb-8">Important Information</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 space-y-4">
              <div className="flex items-start gap-4">
                <DollarSign className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-lg mb-2">Fees</h3>
                  <p className="text-primary-100">
                    GivahBz charges <strong>no platform fee</strong> - every Belizean Dollar raised goes directly to your cause. Third-party payment processing fees may still apply.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-lg mb-2">No Time Pressure</h3>
                  <p className="text-primary-100">
                    Your campaign stays active as long as you want and can keep receiving donations even after hitting your goal. You control when to close your campaign.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-lg mb-2">Verification Required</h3>
                  <p className="text-primary-100">
                    All campaign organizers must verify their identity and provide proof of need. This ensures transparency and builds trust with donors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-medium mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Create your campaign today and start receiving support from the Belizean community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/campaigns/create"
                className="bg-success-500 text-white px-8 py-4 rounded-full font-medium hover:bg-success-600 transition-colors text-lg"
              >
                Create Your Campaign
              </Link>
              <Link
                href="/campaigns"
                className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-full font-medium hover:bg-primary-50 transition-colors text-lg"
              >
                Explore Campaigns
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
