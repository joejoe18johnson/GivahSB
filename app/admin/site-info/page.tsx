"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mergeWithDefaults, type SiteContent, type HomeFaqItem } from "@/lib/siteContent";
import { useThemedModal } from "@/components/ThemedModal";
import { FileText, Save, Plus, Trash2 } from "lucide-react";

/** Keys of SiteContent that are string fields (excludes homeFaqs which is edited separately). */
type StringSiteContentKey = Exclude<keyof SiteContent, "homeFaqs">;

const FIELDS: { key: StringSiteContentKey; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "siteName", label: "Site name", placeholder: "GivahBz" },
  { key: "heroTitle", label: "Home hero title", placeholder: "Belizean Supporting Belizeans" },
  { key: "heroSubtitle", label: "Home hero subtitle", placeholder: "Life is either a daring adventure..." },
  { key: "communityHeadingPart1", label: "Community heading (part 1)", placeholder: "Communities Share " },
  { key: "communityHeadingPart2", label: "Community heading (part 2)", placeholder: "Burdens" },
  { key: "footerTagline", label: "Footer tagline", placeholder: "Supporting organizations, charities..." },
  { key: "footerCopyright", label: "Footer copyright line", placeholder: "© 2026 GivahBz. All rights reserved." },
  { key: "aboutTitle", label: "About page title", placeholder: "About GivahBz" },
  { key: "aboutSubtitle", label: "About page subtitle", placeholder: "Empowering Belizean communities..." },
  { key: "aboutMission", label: "About mission paragraph", placeholder: "GivahBz was created to provide...", multiline: true },
];

export default function AdminSiteInfoPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<SiteContent>(() => mergeWithDefaults(null));
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { alert } = useThemedModal();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/site-content", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setForm(mergeWithDefaults(data));
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load");
          setForm(mergeWithDefaults(null));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (key: StringSiteContentKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateFaq = (index: number, field: "q" | "a", value: string) => {
    setForm((prev) => {
      const next = [...prev.homeFaqs];
      if (!next[index]) return prev;
      next[index] = { ...next[index], [field]: value };
      return { ...prev, homeFaqs: next };
    });
  };

  const addFaq = () => {
    setForm((prev) => ({ ...prev, homeFaqs: [...prev.homeFaqs, { q: "", a: "" }] }));
  };

  const removeFaq = (index: number) => {
    setForm((prev) => ({
      ...prev,
      homeFaqs: prev.homeFaqs.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Failed to save.";
        const hint = data?.hint;
        alert(hint && !msg.includes(hint) ? `${msg}\n\n${hint}` : msg, { variant: "error" });
        return;
      }
      alert("Site content saved. Changes will appear on the site shortly.", { variant: "success" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary-600" />
          Edit site info
        </h1>
        <p className="text-gray-600 mt-1">
          Update text that appears on the homepage, footer, and about page. Changes are saved to the database and shown across the site.
        </p>
      </div>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          {loadError} Using default content. You can still edit and save.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {FIELDS.map(({ key, label, placeholder, multiline }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              {multiline ? (
                <textarea
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
            </div>
          ))}

          {/* Homepage FAQ section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Homepage FAQ</label>
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add FAQ
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              These questions appear in the &quot;Frequently Asked Questions&quot; section on the homepage.
            </p>
            <div className="space-y-4">
              {form.homeFaqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      aria-label="Remove FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Question</label>
                    <input
                      type="text"
                      value={faq.q}
                      onChange={(e) => updateFaq(index, "q", e.target.value)}
                      placeholder="Question"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Answer</label>
                    <textarea
                      value={faq.a}
                      onChange={(e) => updateFaq(index, "a", e.target.value)}
                      placeholder="Answer"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
