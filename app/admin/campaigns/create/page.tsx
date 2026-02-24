"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { compressImageForUpload } from "@/lib/compressImage";
import { useThemedModal } from "@/components/ThemedModal";
import { Upload, ArrowLeft, Shield } from "lucide-react";

const CATEGORIES = ["Medical expenses", "Educational support", "Disaster recovery", "Other"];
const CREATOR_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
  { value: "charity", label: "Registered Charity" },
] as const;

export default function AdminCreateCampaignPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const { alert } = useThemedModal();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fullDescription: "",
    goal: "",
    category: "Other",
    location: "",
    daysLeft: "30",
    creatorType: "organization" as "individual" | "organization" | "charity",
  });
  const [imageFiles, setImageFiles] = useState<[File | null, File | null]>([null, null]);
  const [imageDragOver, setImageDragOver] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/admin/campaigns/create");
      return;
    }
    if (!isLoading && user && !isAdmin) {
      router.replace("/admin");
    }
  }, [user, isAdmin, isLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "creatorType" && (value === "individual" || value === "organization" || value === "charity")) {
      setFormData((prev) => ({ ...prev, creatorType: value }));
    }
  };

  const isImage = (file: File) =>
    file.type.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(
      (file.name.split(".").pop() ?? "").toLowerCase()
    );

  const handleImageChange = (index: 0 | 1) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isImage(file)) {
      setImageFiles((prev) => {
        const next: [File | null, File | null] = [...prev];
        next[index] = file;
        return next;
      });
    }
    e.target.value = "";
  };

  const handleImageDrop = (index: 0 | 1) => (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file && isImage(file)) {
      setImageFiles((prev) => {
        const next: [File | null, File | null] = [...prev];
        next[index] = file;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be signed in.", { variant: "error" });
      return;
    }
    const goalNum = parseFloat(formData.goal) || 0;
    if (goalNum <= 0) {
      alert("Please enter a valid funding goal.", { variant: "error" });
      return;
    }
    if (!imageFiles[0] || !imageFiles[1]) {
      alert("Please upload both campaign images.", { variant: "error" });
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (imageFiles[0].size > maxSize || imageFiles[1].size > maxSize) {
      alert("Each image must be under 10MB.", { variant: "error" });
      return;
    }

    setIsSubmitting(true);
    const pendingId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    try {
      const [file1, file2] = await Promise.all([
        compressImageForUpload(imageFiles[0]),
        compressImageForUpload(imageFiles[1]),
      ]);
      const upload = async (file: File, index: 0 | 1): Promise<string> => {
        const form = new FormData();
        form.append("file", file);
        form.append("pendingId", pendingId);
        form.append("index", String(index));
        const res = await fetch("/api/upload-campaign-image", {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = (data.error as string) || "Upload failed";
          const hint = data.hint as string | undefined;
          throw new Error(hint ? `${msg}\n\n${hint}` : msg);
        }
        if (typeof data.url !== "string") throw new Error("No URL returned");
        return data.url;
      };
      const [imageUrl1, imageUrl2] = await Promise.all([
        upload(file1, 0),
        upload(file2, 1),
      ]);
      const apiRes = await fetch("/api/admin/create-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          fullDescription: formData.fullDescription.trim() || formData.description.trim(),
          goal: goalNum,
          category: formData.category,
          location: formData.location.trim() || undefined,
          daysLeft: parseInt(formData.daysLeft, 10) || 30,
          creatorType: formData.creatorType,
          image: imageUrl1,
          image2: imageUrl2,
          creatorName: user?.name ?? "Admin",
          creatorId: user?.id ?? null,
        }),
      });
      const result = await apiRes.json().catch(() => ({}));
      if (!apiRes.ok) {
        throw new Error((result.error as string) || "Failed to create campaign");
      }
      const campaignId = result.campaignId as string;
      if (campaignId) {
        router.push(`/campaigns/${campaignId}`);
      } else {
        router.push("/admin/campaigns");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create campaign.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (!user && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </Link>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-6 h-6 text-primary-600" />
        <h1 className="text-3xl font-semibold text-gray-900">Create Admin-Backed Campaign</h1>
      </div>
      <p className="text-gray-600 mb-8">
        This campaign will be published immediately and show the &quot;Givah Approved Campaign&quot; badge so supporters know it&apos;s trusted by Givah.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Campaign title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="Brief title for the campaign"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Short description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="2–3 sentences"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Full story</label>
          <textarea
            name="fullDescription"
            value={formData.fullDescription}
            onChange={handleChange}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="Full campaign story"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Funding goal (BZ$) *</label>
            <input
              type="number"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Duration (days)</label>
            <select
              name="daysLeft"
              value={formData.daysLeft}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="120">120 days</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Creator type</label>
          <select
            name="creatorType"
            value={formData.creatorType}
            onChange={(e) => setFormData((p) => ({ ...p, creatorType: e.target.value as "individual" | "organization" | "charity" }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            {CREATOR_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="e.g. Belize City, Belize"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Campaign images * (2 required)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([0, 1] as const).map((index) => (
              <div key={index}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleImageChange(index)}
                  className="hidden"
                  id={`admin-img-${index}`}
                />
                <label
                  htmlFor={`admin-img-${index}`}
                  onDragOver={(e) => { e.preventDefault(); setImageDragOver(index); }}
                  onDragLeave={(e) => { e.preventDefault(); setImageDragOver(null); }}
                  onDrop={(e) => { e.preventDefault(); setImageDragOver(null); handleImageDrop(index)(e); }}
                  className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                    imageDragOver === index ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400"
                  }`}
                >
                  {imageFiles[index] ? (
                    <p className="text-primary-600 font-medium text-sm truncate">{imageFiles[index]!.name}</p>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Image {index + 1}</p>
                    </>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-70"
          >
            {isSubmitting ? "Publishing…" : "Publish campaign"}
          </button>
          <Link
            href="/admin/campaigns"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
