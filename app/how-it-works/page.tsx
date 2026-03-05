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
      description: "People donate online, and funds are collected securely toward your funding goal. For now, donations are processed only up to your stated goal amount — no additional funds are accepted beyond that limit.",
      icon: <DollarSign className="w-8 h-8" />,
      details: [
        "Donations processed securely online",
        "Funds transferred to your account when needed or upon request",
        "Campaign closes once the funding goal is reached"
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
      text: "Your campaign stays active until your funding goal is reached. Once the goal has been met, the campaign automatically closes and no additional donations are accepted."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community Support",
      text: "Connect with the Belizean community and receive support from people who care about your cause."
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
                className="bg-white rounded-lg gradient-border-1 p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start"
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
                className="bg-white rounded-lg p-6 gradient-border-1 transition-shadow"
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
                    Your campaign stays active until your funding goal is reached. Once the goal has been met, the campaign automatically closes and no additional donations are accepted.
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
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-medium mb-4 text-gray-900 dark:text-white">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Create your campaign today and start receiving support from the Belizean community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/campaigns"
                className="relative gradient-outline-btn border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-full font-medium hover:bg-primary-50 transition-colors text-lg dark:border-transparent dark:bg-transparent dark:text-white dark:hover:bg-white/10"
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
