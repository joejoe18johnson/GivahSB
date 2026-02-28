"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Settings, X, ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "givah_cookie_consent";

export type CookiePreferences = {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  preferences: true,
  analytics: false,
  marketing: false,
};

function loadStoredConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    return {
      necessary: parsed.necessary !== false,
      preferences: !!parsed.preferences,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

function saveConsent(prefs: CookiePreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Optional: set a first-party cookie for server-side checks (e.g. same name as key)
  document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function CookieConsent() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const stored = loadStoredConsent();
    setConsentGiven(stored !== null);
    if (stored) setPrefs(stored);
  }, []);

  const acceptAll = () => {
    const all: CookiePreferences = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(all);
    setPrefs(all);
    setConsentGiven(true);
    setShowSettings(false);
  };

  const rejectNonEssential = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(necessaryOnly);
    setPrefs(necessaryOnly);
    setConsentGiven(true);
    setShowSettings(false);
  };

  const saveSettings = () => {
    saveConsent(prefs);
    setConsentGiven(true);
    setShowSettings(false);
  };

  const togglePref = (key: keyof CookiePreferences) => {
    if (key === "necessary") return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  if (consentGiven !== false) return null;

  return (
    <>
      {/* Backdrop when settings modal is open */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[200] bg-black/40"
          aria-hidden
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <div
          className="fixed left-1/2 top-1/2 z-[201] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
        >
          <div className="rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 id="cookie-settings-title" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-600" />
                Cookie settings
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              <p className="text-sm text-gray-600">
                We use cookies to run the site, remember your choices, and improve your experience. You can choose which categories to allow.
              </p>

              {/* Necessary */}
              <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Necessary</p>
                  <p className="text-sm text-gray-500 mt-0.5">Required for login, security, and core features. Cannot be disabled.</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-100 text-primary-700 px-2.5 py-1 text-xs font-medium">Always on</span>
              </div>

              {/* Preferences */}
              <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Preferences</p>
                  <p className="text-sm text-gray-500 mt-0.5">Remember your settings (e.g. language, display options).</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.preferences}
                  onClick={() => togglePref("preferences")}
                  className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${prefs.preferences ? "bg-primary-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${prefs.preferences ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-500 mt-0.5">Help us understand how the site is used (e.g. page views) to improve it.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.analytics}
                  onClick={() => togglePref("analytics")}
                  className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${prefs.analytics ? "bg-primary-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${prefs.analytics ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 py-2">
                <div>
                  <p className="font-medium text-gray-900">Marketing</p>
                  <p className="text-sm text-gray-500 mt-0.5">Used to show relevant campaigns or measure ad effectiveness (if we use such tools).</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.marketing}
                  onClick={() => togglePref("marketing")}
                  className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${prefs.marketing ? "bg-primary-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${prefs.marketing ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                <Link href="/privacy" className="text-primary-600 hover:underline" onClick={() => setShowSettings(false)}>
                  Privacy policy
                </Link>
                {" "}has more on how we use data.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex flex-wrap gap-2 justify-end bg-gray-50">
              <button
                type="button"
                onClick={rejectNonEssential}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Necessary only
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Save settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[199] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        role="region"
        aria-label="Cookie consent"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-primary-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">We use cookies</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  We use cookies to keep you signed in, remember your choices, and improve the site. By clicking &quot;Accept all&quot; you allow all categories; or choose &quot;Settings&quot; to pick which cookies we use.{" "}
                  <Link href="/privacy" className="text-primary-600 hover:underline font-medium">
                    Privacy policy
                  </Link>
                </p>
                {!detailsOpen ? (
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    className="mt-2 text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    More info <ChevronDown className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p><strong>Necessary:</strong> login, security, core features (always on).</p>
                    <p><strong>Preferences:</strong> your settings. <strong>Analytics:</strong> how the site is used. <strong>Marketing:</strong> relevant content (if we use it).</p>
                    <button type="button" onClick={() => setDetailsOpen(false)} className="text-primary-600 hover:underline flex items-center gap-1">
                      Less <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Necessary only
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
