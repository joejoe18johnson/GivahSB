"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";
import SafeImage from "@/components/SafeImage";
import { compressImageForUpload } from "@/lib/compressImage";

interface EditableCampaign {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  goal: number;
  category: string;
  location: string;
  image: string;
  image2: string;
  status?: string;
}

export default function EditMyCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { alert } = useThemedModal();

  const campaignId = typeof params.campaignId === "string" ? params.campaignId : "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [campaign, setCampaign] = useState<EditableCampaign | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    fullDescription: "",
    category: "",
    location: "",
  });
  const [image1Url, setImage1Url] = useState<string>("");
  const [image2Url, setImage2Url] = useState<string>("");
  const fileInput1Ref = useRef<HTMLInputElement | null>(null);
  const fileInput2Ref = useRef<HTMLInputElement | null>(null);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<0 | 1 | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login?callbackUrl=/my-campaigns");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!campaignId || !user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/my/campaigns/${campaignId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setError(typeof data.error === "string" ? data.error : "Failed to load campaign.");
          }
          return;
        }
        if (!cancelled && data.campaign) {
          const c = data.campaign as EditableCampaign;
          if (c.status === "stopped") {
            router.replace("/my-campaigns?message=stopped");
            return;
          }
          setCampaign(c);
          setForm({
            title: c.title,
            description: c.description,
            fullDescription: c.fullDescription || "",
            category: c.category,
            location: c.location || "",
          });
          setImage1Url(c.image || "");
          setImage2Url(c.image2 || "");
        }
      } catch {
        if (!cancelled) setError("Failed to load campaign.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [campaignId, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index: 0 | 1) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaignId) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, etc.).", { variant: "error" });
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image must be less than 10MB.", { variant: "error" });
      return;
    }
    setUploadingImageIndex(index);
    try {
      const compressed = await compressImageForUpload(file, { maxDimension: 1600, quality: 0.82 });
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("index", String(index));
      const res = await fetch(`/api/my/campaigns/${campaignId}/images`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Failed to upload image.";
        alert(message, { variant: "error" });
        return;
      }
      const url = (data as { url?: string }).url;
      if (!url) {
        alert("Upload succeeded but no URL was returned.", { variant: "error" });
        return;
      }
      if (index === 0) setImage1Url(url);
      else setImage2Url(url);
      alert("Image updated.", { variant: "success" });
    } catch {
      alert("Failed to upload image. Please try again.", { variant: "error" });
    } finally {
      setUploadingImageIndex(null);
      if (index === 0 && fileInput1Ref.current) fileInput1Ref.current.value = "";
      if (index === 1 && fileInput2Ref.current) fileInput2Ref.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/my/campaigns/${campaignId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          fullDescription: form.fullDescription,
          category: form.category,
          location: form.location || undefined,
          image: image1Url || undefined,
          image2: image2Url || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Failed to save changes.";
        setError(message);
        alert(message, { variant: "error" });
        setSaving(false);
        return;
      }
      alert("Campaign updated.", { variant: "success" });
      router.push("/my-campaigns");
    } catch {
      const message = "Failed to save changes. Please try again.";
      setError(message);
      alert(message, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <Link
        href="/my-campaigns"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Campaigns
      </Link>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-600">Loading campaign…</p>
        </div>
      ) : !campaign ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">
            {error || "Campaign could not be found or you do not have permission to edit it."}
          </p>
          <Link href="/my-campaigns" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
            Return to My Campaigns
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">Edit Campaign</h1>
          <p className="text-gray-600 mb-6">
            You can update your title, short description, full story, category, and location.{" "}
            <span className="font-semibold text-amber-700">The goal amount cannot be changed.</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl gradient-border-1 shadow-sm p-6 md:p-8">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Campaign images
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Update your two cover images. For best results use landscape images, up to 10MB each.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative w-full h-40 sm:h-48 bg-gray-200 rounded-lg overflow-hidden">
                  {image1Url ? (
                    <SafeImage
                      src={image1Url}
                      alt={`${form.title || "Campaign"} image 1`}
                      fill
                      className="object-cover"
                      blurEdges
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          Image 1
                        </div>
                      }
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                      Image 1
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-2 flex justify-center">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-xs font-medium text-gray-700 cursor-pointer shadow-sm">
                      {uploadingImageIndex === 0 ? "Uploading…" : "Change image 1"}
                      <input
                        ref={fileInput1Ref}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange(0)}
                        disabled={uploadingImageIndex !== null}
                      />
                    </label>
                  </div>
                </div>
                <div className="relative w-full h-40 sm:h-48 bg-gray-200 rounded-lg overflow-hidden">
                  {image2Url || image1Url ? (
                    <SafeImage
                      src={image2Url || image1Url}
                      alt={`${form.title || "Campaign"} image 2`}
                      fill
                      className="object-cover"
                      blurEdges
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          Image 2
                        </div>
                      }
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                      Image 2
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-2 flex justify-center">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-xs font-medium text-gray-700 cursor-pointer shadow-sm">
                      {uploadingImageIndex === 1 ? "Uploading…" : "Change image 2"}
                      <input
                        ref={fileInput2Ref}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange(1)}
                        disabled={uploadingImageIndex !== null}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Campaign title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                required
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full story *</label>
              <textarea
                name="fullDescription"
                value={form.fullDescription}
                onChange={handleChange}
                rows={6}
                required
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50 text-gray-900"
                >
                  <option value="">Select a category</option>
                  <option value="Medical expenses">Medical expenses</option>
                  <option value="Educational support">Educational support</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location (optional)</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50 text-gray-900"
                  placeholder="City or district"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Goal amount (read-only)</label>
              <input
                type="text"
                value={campaign.goal.toLocaleString(undefined, { style: "currency", currency: "BZD" })}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                If you need to change the goal, please contact support so an administrator can review it.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => router.push("/my-campaigns")}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-full bg-success-500 text-white text-sm font-medium hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

