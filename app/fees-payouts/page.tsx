import Link from "next/link";
import { DollarSign, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function FeesPayoutsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-medium mb-6">
              Fees & Payouts
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              Transparent pricing with no platform fees. Every Belizean Dollar raised goes directly to your cause.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* No Platform Fees */}
            <div className="bg-success-50 border-l-4 border-success-500 p-8 rounded-lg mb-12">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-success-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-3xl font-medium text-gray-900 mb-4">
                    No Platform Fees
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    GivahBz charges <strong>zero platform fees</strong>. Every Belizean Dollar (BZ$) raised goes directly to your cause. We believe in supporting communities without taking a cut from donations.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Processing Fees */}
            <div className="mb-12">
              <h2 className="text-3xl font-medium mb-6">Payment Processing Fees</h2>
              <div className="bg-white rounded-lg p-8">
                <p className="text-gray-700 mb-4">
                  While we don&apos;t charge platform fees, third-party payment processors may apply small fees for handling transactions. These fees are standard across the industry and help ensure secure, reliable payment processing.
                </p>
                <div className="bg-white rounded-lg p-6 mt-6">
                  <h3 className="text-xl font-medium mb-4">Typical Payment Processing Fees:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Credit/Debit Cards:</strong> Approximately 2.9% + BZ$0.30 per transaction
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Bank Transfers:</strong> Fees vary by bank (typically BZ$2-5 per transfer)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">
                        <strong>Mobile Payments:</strong> Fees vary by provider
                      </span>
                    </li>
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Payment processing fees are deducted automatically from each donation before funds are transferred to your account. You&apos;ll see the net amount received in your payout summary.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Schedule */}
            <div className="mb-12">
              <h2 className="text-3xl font-medium mb-6">Payout Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <Clock className="w-10 h-10 text-primary-600 mb-4" />
                  <h3 className="text-xl font-medium mb-3">Monthly Payouts</h3>
                  <p className="text-gray-700">
                    Funds are transferred to your account on a monthly basis. Payouts are processed around the 15th of each month for all donations received in the previous month.
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <DollarSign className="w-10 h-10 text-primary-600 mb-4" />
                  <h3 className="text-xl font-medium mb-3">Minimum Payout</h3>
                  <p className="text-gray-700">
                    There is a minimum payout threshold of BZ$50. If your campaign has raised less than BZ$50 in a month, funds will accumulate until the threshold is reached.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-12">
              <h2 className="text-3xl font-medium mb-6">Payment Methods</h2>
              <div className="bg-white rounded-lg p-8">
                <p className="text-gray-700 mb-6">
                  We support multiple payment methods to make it easy for donors to contribute:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Credit & Debit Cards</h4>
                    <p className="text-sm text-gray-600">Visa, Mastercard, and other major cards</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Bank Transfers</h4>
                    <p className="text-sm text-gray-600">Direct transfers from Belizean banks</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Mobile Payments</h4>
                    <p className="text-sm text-gray-600">Mobile money and digital wallets</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Other Methods</h4>
                    <p className="text-sm text-gray-600">Additional payment options available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receiving Funds */}
            <div className="mb-12">
              <h2 className="text-3xl font-medium mb-6">Receiving Your Funds</h2>
              <div className="bg-primary-50 rounded-lg p-8">
                <h3 className="text-xl font-medium mb-4">Bank Account Setup</h3>
                <p className="text-gray-700 mb-6">
                  To receive payouts, you&apos;ll need to provide your bank account details during campaign setup. We support transfers to Belizean bank accounts.
                </p>
                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-medium mb-3">Required Information:</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <span>Bank name and branch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <span>Account holder name (must match your verified identity)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <span>Account number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <span>Account type (checking/savings)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-8 rounded-lg">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Important Notes</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• All payouts are processed in Belizean Dollars (BZ$)</li>
                    <li>• You&apos;ll receive a detailed payout summary via email each month</li>
                    <li>• Processing times may vary depending on your bank</li>
                    <li>• Contact us if you need to update your bank account information</li>
                    <li>• Funds are only transferred to verified campaign organizers</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <h2 className="text-3xl font-medium mb-4">Ready to Start Fundraising?</h2>
              <p className="text-gray-600 mb-6">
                Create your campaign today and start receiving support with zero platform fees.
              </p>
              <Link
                href="/campaigns/create"
                className="inline-block bg-success-500 text-white px-8 py-4 rounded-full font-medium hover:bg-success-600 transition-colors text-lg shadow-lg"
              >
                Start Your Campaign
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
