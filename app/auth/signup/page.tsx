"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useThemedModal } from "@/components/ThemedModal";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  
  const { signup, loginWithGoogle, user, isAdmin, adminCheckDone } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { alert } = useThemedModal();

  useEffect(() => {
    if (!user) return;
    if (!adminCheckDone) return;
    router.replace(isAdmin ? "/admin" : "/my-campaigns");
  }, [user, isAdmin, adminCheckDone, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber?.trim()) {
      setError("Please fill in all fields including phone number.");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    const phone = formData.phoneNumber.trim();
    // Only allow digits and hyphens
    if (!/^[\d-]+$/.test(phone)) {
      setError("Phone number can only contain numbers and hyphens (e.g. 501-123-4567 or 5011234567).");
      return;
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setError("Please enter a valid phone number with at least 7 digits (e.g. 501-123-4567 or 5011234567).");
      return;
    }
    
    const success = await signup(
      formData.email,
      formData.password,
      formData.name,
      phone
    );
    
    if (success) {
      // Redirect is handled by useEffect when user (and isAdmin) updates
      setTimeout(() => {
        alert(
          "Account created successfully! To create campaigns, please verify your identity in your profile settings. Your phone number, ID document, and address document need to be approved by an admin.",
          { 
            title: "Account Created", 
            variant: "info" 
          }
        );
      }, 500);
    } else {
      setError("Account creation failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join GivahBz and help make a difference</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" data-auth-form>
            <button
              type="button"
              disabled={googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                setError("");
                let isRedirecting = false;
                try {
                  await loginWithGoogle();
                  // Redirect is handled by useEffect when user and adminCheckDone update (admins → /admin, others → /my-campaigns)
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "";
                  if (msg === "REDIRECTING") {
                    isRedirecting = true;
                    return;
                  }
                  const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
                  const errMsg = code === "auth/popup-closed-by-user"
                    ? "Sign-in was cancelled."
                    : code === "auth/unauthorized-domain"
                      ? "This domain is not authorized for sign-in. Add it in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs (e.g. localhost or your Vercel domain)."
                      : (err && typeof err === "object" && "message" in err && typeof (err as { message: string }).message === "string")
                        ? (err as { message: string }).message
                        : "Google sign-in failed. Please try again.";
                  setError(errMsg);
                } finally {
                  if (!isRedirecting) setGoogleLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or sign up with email</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder:text-gray-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder:text-gray-500"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 text-gray-900 placeholder:text-gray-500"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 text-gray-900 placeholder:text-gray-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder:text-gray-500"
                placeholder="e.g. 501-123-4567 or 5011234567"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your phone must be approved before you can create campaigns. We&apos;ll notify you once it&apos;s verified.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
            >
              Create Account
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
      </div>
    </div>
  );
}
