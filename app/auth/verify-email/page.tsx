"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";

/**
 * Shown when the user clicks "Go to login" before confirming. Redirects them here
 * instead of the login form so they see the verification reminder and cannot reach
 * the account until they've clicked the link in their email.
 */
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck className="w-10 h-10 text-success-600 dark:text-success-400" />
        </div>

        <h1 className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-4">
          Please check your email
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Click on the verification link we sent to your email to continue. You cannot sign in or access your account until your email is verified.
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full border-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 bg-transparent px-8 py-3 rounded-full font-medium hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
          >
            I&apos;ve confirmed my email — sign in
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Only use the sign-in button after you&apos;ve clicked the link in your email.
          </p>
        </div>
      </div>
    </div>
  );
}
