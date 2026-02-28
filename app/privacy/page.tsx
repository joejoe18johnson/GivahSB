"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-medium mb-6">
              Privacy Information
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              How we collect, use, and protect your personal data in line with Belize&apos;s Data Protection Act.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg text-gray-700">
            <p className="lead text-gray-600">
              GivahBz (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This notice describes how we process your personal data in accordance with the laws of Belize, including the <strong>Data Protection Act, 2021 (Act No. 45 of 2021)</strong>.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">1. Who we are</h2>
            <p>
              We operate a crowdfunding platform for Belizean communities. We act as a data controller in respect of the personal data we collect when you use our website and services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Data we collect</h2>
            <p>We may collect and process:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account data:</strong> name, email address, phone number, profile photo, and password (encrypted).</li>
              <li><strong>Verification data:</strong> identity and address documents you submit for campaign creator verification, as required for platform safety.</li>
              <li><strong>Campaign and donation data:</strong> campaign details, donation amounts, payment-related information, and communications you send through the platform.</li>
              <li><strong>Technical data:</strong> IP address, device type, browser, and usage information (e.g. pages visited) to operate and improve our services.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">3. How we use your data</h2>
            <p>We process your data fairly and lawfully to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our platform and services.</li>
              <li>Verify campaign creators and prevent fraud.</li>
              <li>Process donations and payouts and communicate about them.</li>
              <li>Send you important service or security notices and, where you have agreed, updates about campaigns or the platform.</li>
              <li>Comply with legal obligations and protect our rights and those of our users.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Legal basis</h2>
            <p>
              Under Belize&apos;s Data Protection Act we rely on: your consent where we ask for it; performance of a contract (e.g. when you create an account or make a donation); our legitimate interests (e.g. security, fraud prevention, improving our services); and compliance with legal obligations.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Sharing your data</h2>
            <p>
              We may share your data with: service providers who help us run the platform (e.g. hosting, payments), under strict confidentiality and data protection terms; law enforcement or regulators when required by Belizean law; and other users only where necessary (e.g. campaign organisers see donor information relevant to their campaign). We do not sell your personal data.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Data security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your data against unauthorised access, loss, or misuse, in line with the Act&apos;s security requirements. In the event of a personal data breach that poses a risk to your rights, we will notify the Data Protection Commissioner and affected individuals as required by law.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Your rights under Belize law</h2>
            <p>Under the Data Protection Act, 2021, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access</strong> your personal data we hold.</li>
              <li><strong>Rectification</strong> of inaccurate or incomplete data.</li>
              <li><strong>Erasure</strong> of your data in certain circumstances.</li>
              <li><strong>Data portability</strong> (where applicable) to receive your data in a structured, commonly used format.</li>
              <li><strong>Object</strong> to processing for direct marketing and in certain other cases.</li>
              <li><strong>Restrict</strong> processing in certain situations.</li>
              <li>Lodge a complaint with the <strong>Data Protection Commissioner</strong> of Belize if you believe your rights have been violated.</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, please contact us using the details below. We will respond within the timeframes set by the Act.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Retention</h2>
            <p>
              We keep your data only for as long as necessary to fulfil the purposes set out in this notice, to comply with legal obligations (e.g. tax, anti-money laundering), and to resolve disputes and enforce our agreements.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Children</h2>
            <p>
              Our services are not directed at children. We do not knowingly collect personal data from anyone under 18. If you believe we have collected such data, please contact us so we can delete it.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">10. Changes to this notice</h2>
            <p>
              We may update this privacy information from time to time. We will post the updated version on this page and, where required by law, notify you of significant changes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">11. Contact us</h2>
            <p>
              For privacy-related requests, to exercise your rights, or for questions about this notice, contact us:
            </p>
            <ul className="list-none pl-0 space-y-1 mt-2">
              <li>By email or through our <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium underline">Contact</Link> page.</li>
              <li>You may also have the right to complain to the Office of the Data Protection Commissioner of Belize, in accordance with the Data Protection Act, 2021.</li>
            </ul>

            <p className="mt-10 text-sm text-gray-500">
              Last updated: 2025. This privacy information is provided in accordance with the laws of Belize.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
