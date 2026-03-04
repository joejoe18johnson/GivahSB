"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck className="w-10 h-10 text-success-600" />
        </div>

        <h1 className="text-3xl font-medium text-gray-900 mb-4">Check your email</h1>

        <p className="text-gray-600 mb-4">
          We&apos;ve sent a confirmation link to
          {email ? <span className="font-semibold"> {email}</span> : " your email address"}.
        </p>
        <p className="text-gray-600 mb-6">
          Please open that email and click the link to confirm your address. Once confirmed, you
          can sign in and finish setting up your profile and verification.
        </p>

        <div className="space-y-3 text-sm text-gray-600 text-left mb-6">
          <p className="font-medium text-gray-800">Didn&apos;t receive the email?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your spam or promotions folder.</li>
            <li>Make sure you entered the correct email address.</li>
            <li>Wait a minute—sometimes delivery can be slightly delayed.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
          >
            Go to login
          </Link>
          <p className="text-xs text-gray-500">
            After confirming your email, sign in with the same address to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckEmailFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck className="w-10 h-10 text-success-600" />
        </div>
        <h1 className="text-3xl font-medium text-gray-900 mb-4">Check your email</h1>
        <p className="text-gray-600 mb-6">We&apos;ve sent a confirmation link to your email address.</p>
        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto mb-6" />
        <Link
          href="/auth/login"
          className="block w-full bg-primary-600 text-white px-8 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<CheckEmailFallback />}>
      <CheckEmailContent />
    </Suspense>
  );
}

