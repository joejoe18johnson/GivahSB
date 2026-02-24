"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "What is GivahBz?",
      answer: "GivahBz is a Belizean online crowdfunding platform that helps people raise money for causes, charities, individuals, events, or projects. We connect those in need with generous supporters across Belize."
    },
    {
      question: "How much does it cost to use GivahBz?",
      answer: "GivahBz charges zero platform fees. Every Belizean Dollar raised goes directly to your cause. Third-party payment processing fees may apply (typically 2.9% + BZ$0.30 for card transactions)."
    },
    {
      question: "Who can create a campaign?",
      answer: "Anyone can create a campaign - individuals, organizations, charities, or community groups. However, all campaign organizers must verify their identity and provide proof of need before their campaign is published."
    },
    {
      question: "What documents do I need to verify my identity?",
      answer: (
        <>
          You need to provide:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Proof of ID: Social Security Card, Passport, or National ID</li>
            <li>Proof of Address: Utility bill, bank statement, or government letter (dated within last 3 months)</li>
            <li>Proof of Need: Documents supporting your campaign (medical reports, financial statements, etc.)</li>
          </ul>
        </>
      )
    },
    {
      question: "How long does verification take?",
      answer: "Identity and campaign verification typically takes 24-48 hours. Our team reviews all documents to ensure transparency and trust."
    },
    {
      question: "How do I receive funds from my campaign?",
      answer: "Funds are transferred to your bank account monthly. Payouts are processed around the 15th of each month for all donations received in the previous month. You'll need to provide your bank account details during campaign setup."
    },
    {
      question: "Is there a minimum amount I need to raise?",
      answer: "No, there's no minimum fundraising goal. However, there is a minimum payout threshold of BZ$50. If your campaign raises less than BZ$50 in a month, funds will accumulate until the threshold is reached."
    },
    {
      question: "Can I keep my campaign active after reaching my goal?",
      answer: "Yes! Your campaign stays active as long as you want. You can continue receiving donations even after hitting your goal. There's no time pressure - you control when to close your campaign."
    },
    {
      question: "What can I raise funds for?",
      answer: (
        <>
          GivahBz supports a wide range of causes:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Medical costs and healthcare expenses</li>
            <li>Education (school supplies, tuition, resources)</li>
            <li>Community projects and initiatives</li>
            <li>Disaster relief and emergency situations</li>
            <li>Charity events and non-profit organizations</li>
            <li>Personal support and financial hardship</li>
          </ul>
        </>
      )
    },
    {
      question: "How do I share my campaign?",
      answer: "Once your campaign is verified and published, you can share it via social media, email, messaging apps, or any other method. We provide built-in sharing tools to make it easy to spread the word."
    },
    {
      question: "Are donations tax-deductible?",
      answer: "Tax deductibility depends on the type of campaign and your tax situation. We recommend consulting with a tax professional for specific advice. GivahBz does not provide tax advice."
    },
    {
      question: "What happens if I don't reach my goal?",
      answer: "You still receive all funds raised, even if you don't reach your goal. There's no penalty for not reaching your target. Your campaign can stay active to continue receiving donations."
    },
    {
      question: "Can I update my campaign after it's published?",
      answer: "Yes, you can update your campaign with progress updates, photos, and new information. However, major changes to the campaign goal or purpose may require re-verification."
    },
    {
      question: "How do I donate to a campaign?",
      answer: "Simply visit any campaign page and click the 'Donate' button. You can choose from preset amounts (BZ$1, BZ$5, BZ$10, BZ$20, BZ$50) or enter a custom amount. Payment can be made via credit/debit card, bank transfer, or mobile payment."
    },
    {
      question: "Is my donation secure?",
      answer: "Yes, all donations are processed through secure payment systems. We use industry-standard encryption and security measures to protect your payment information."
    },
    {
      question: "Can I donate anonymously?",
      answer: "Yes, you can choose to donate anonymously. Your name won't appear publicly on the campaign, but the campaign organizer will still receive your donation."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-medium mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              Find answers to common questions about GivahBz
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-medium text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200">
                      <div className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still Have Questions */}
            <div className="mt-12 bg-primary-50 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-medium mb-4">Still Have Questions?</h2>
              <p className="text-gray-700 mb-6">
                Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
