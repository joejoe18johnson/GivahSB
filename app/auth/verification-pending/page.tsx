"use client";

import { CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function VerificationPendingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>
        
        <h1 className="text-3xl font-medium text-gray-900 mb-4">
          Verification Pending
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for creating your account, {user?.name || "User"}!
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
          <p className="text-sm text-yellow-800 mb-4">
            Your identity documents have been submitted and are currently under review. Our team will verify your:
          </p>
          <ul className="text-sm text-yellow-800 list-disc list-inside space-y-2">
            <li>ID Document (Social Security Card, Passport, or National ID)</li>
            <li>Proof of Address</li>
          </ul>
          <p className="text-sm text-yellow-800 mt-4">
            This process typically takes 24-48 hours. You&apos;ll receive an email notification once your account is verified.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Go to Homepage
          </Link>
          <p className="text-sm text-gray-600">
            Once verified, you&apos;ll be able to create campaigns and support others.
          </p>
        </div>
      </div>
    </div>
  );
}
