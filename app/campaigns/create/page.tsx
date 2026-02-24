"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** TEMPORARY: set to true to require phone + ID + address verification before creating campaigns. */
const REQUIRE_VERIFICATION_TO_CREATE = false;
import { useRouter } from "next/navigation";
import { addCampaignUnderReview } from "@/lib/campaignsUnderReview";
import { compressImageForUpload } from "@/lib/compressImage";
import { useThemedModal } from "@/components/ThemedModal";
import Link from "next/link";

export default function CreateCampaignPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fullDescription: "",
    goal: "",
    category: "",
    location: "",
    daysLeft: "",
    creatorType: "",
  });

  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofDragOver, setProofDragOver] = useState(false);
  const [imageFiles, setImageFiles] = useState<[File | null, File | null]>([null, null]);
  const [imageDragOver, setImageDragOver] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useThemedModal();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/campaigns/create");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const status = user.status ?? "active";
  if (status === "deleted") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Account disabled</h1>
          <p className="text-gray-600 mb-6">
            Your account has been disabled by an administrator. You cannot create or edit campaigns. Contact support if you believe this is an error.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (status === "on_hold") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Account on hold</h1>
          <p className="text-gray-600 mb-6">
            Your account is currently on hold. You cannot create or edit campaigns until an administrator removes the hold. Contact support if you have questions.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (REQUIRE_VERIFICATION_TO_CREATE && (!user.phoneVerified || !user.idVerified || !user.addressVerified)) {
    const missingVerifications = [];
    const pendingVerifications = [];
    
    if (!user.phoneNumber) {
      missingVerifications.push("phone number");
    } else if (!user.phoneVerified) {
      pendingVerifications.push("phone number");
    }
    
    if (!user.idDocument) {
      missingVerifications.push("ID document");
    } else if (!user.idVerified) {
      pendingVerifications.push("ID document");
    }
    
    if (!user.addressDocument) {
      missingVerifications.push("address document");
    } else if (!user.addressVerified) {
      pendingVerifications.push("address document");
    }
    
    const missingText = missingVerifications.length > 0 ? missingVerifications.join(", ") : null;
    const pendingText = pendingVerifications.length > 0 ? pendingVerifications.join(", ") : null;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification required</h1>
          <p className="text-gray-600 mb-6">
            {missingText && (
              <>You must upload your {missingText} in your profile before you can create campaigns. </>
            )}
            {pendingText && (
              <>Your {pendingText} {pendingText.includes(",") ? "are" : "is"} pending admin approval. </>
            )}
            {!missingText && !pendingText && (
              <>Your phone number, ID document, and address document must be approved by an admin before you can create campaigns. </>
            )}
            Once approved, you will be able to create campaigns.
          </p>
          <Link
            href="/profile"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700"
          >
            {missingText ? "Go to profile" : "View profile"}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (proofFiles.length === 0) {
      alert("Please upload at least one proof document to verify your need.", { title: "Proof required", variant: "error" });
      return;
    }
    if (!imageFiles[0] || !imageFiles[1]) {
      alert("Please upload 2 campaign images (one for each cover panel).", { title: "2 images required", variant: "error" });
      return;
    }

    const goalNum = parseFloat(formData.goal) || 0;
    const MAX_GOAL = 5000;
    if (goalNum > MAX_GOAL) {
      alert(`Funding goal cannot exceed BZ$${MAX_GOAL.toLocaleString()}.`, { title: "Goal too high", variant: "error" });
      return;
    }
    const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const creatorName = user?.name ?? "User";
    const creatorId = user?.id ?? "";

    // Validate files before proceeding
    if (!imageFiles[0] || !imageFiles[1]) {
      alert("Please upload both campaign images before submitting.", { title: "Images Required", variant: "error" });
      return;
    }

    if (!imageFiles[0].type.startsWith("image/") || !imageFiles[1].type.startsWith("image/")) {
      alert("Both files must be valid image files.", { title: "Invalid File Type", variant: "error" });
      return;
    }

    // Check file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFiles[0].size > maxSize || imageFiles[1].size > maxSize) {
      alert("Image files must be less than 10MB each. Please compress your images and try again.", { title: "File Too Large", variant: "error" });
      return;
    }

    addCampaignUnderReview({
      id: pendingId,
      title: formData.title,
      description: formData.description,
      goal: goalNum,
      category: formData.category,
      creatorName,
      submittedAt: new Date().toISOString(),
    });

    setIsSubmitting(true);
    const UPLOAD_TIMEOUT_MS = 90000; // 90 seconds total for uploads + save

    const runSubmit = async () => {
      if (!user) {
        throw new Error("You must be signed in to submit. Please sign in and try again.");
      }

      // Compress images to speed up upload and avoid timeouts
      const [file1, file2] = await Promise.all([
        compressImageForUpload(imageFiles[0]!),
        compressImageForUpload(imageFiles[1]!),
      ]);

      // Upload via our API (server uploads to Supabase Storage).
      const uploadViaApi = async (file: File, index: 0 | 1): Promise<string> => {
        const form = new FormData();
        form.append("file", file);
        form.append("pendingId", pendingId);
        form.append("index", String(index));
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s per image
        const apiUrl = typeof window !== "undefined" ? `${window.location.origin}/api/upload-campaign-image` : "/api/upload-campaign-image";
        try {
          const res = await fetch(apiUrl, {
            method: "POST",
            credentials: "include",
            body: form,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = typeof data.error === "string" ? data.error : "Upload failed";
            const hint = typeof data.hint === "string" ? data.hint : "";
            throw new Error(hint ? `${msg} ${hint}` : msg);
          }
          if (typeof data.url !== "string") throw new Error("No URL returned");
          return data.url;
        } catch (e: any) {
          clearTimeout(timeoutId);
          if (e?.name === "AbortError") {
            throw new Error("Upload timed out. Try smaller images or check your connection.");
          }
          throw e;
        }
      };

      const [imageUrl1, imageUrl2] = await Promise.all([
        uploadViaApi(file1, 0).catch((err) => {
          console.error("Error uploading image 1:", err);
          throw new Error(`Failed to upload first image: ${err?.message || err}`);
        }),
        uploadViaApi(file2, 1).catch((err) => {
          console.error("Error uploading image 2:", err);
          throw new Error(`Failed to upload second image: ${err?.message || err}`);
        }),
      ]);

      const res = await fetch("/api/campaigns-under-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          fullDescription: formData.fullDescription || "",
          goal: goalNum,
          category: formData.category,
          creatorName,
          image: imageUrl1,
          image2: imageUrl2,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to submit campaign");
      }
      router.push("/my-campaigns");
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Submission timed out. Please check your connection and try again.")), UPLOAD_TIMEOUT_MS);
    });

    try {
      await Promise.race([runSubmit(), timeoutPromise]);
    } catch (err: any) {
      console.error("Failed to submit campaign for review:", err);
      const errorMessage = err?.message || String(err);
      let userMessage = "Your campaign could not be sent for review. Please try again.";

      if (errorMessage.includes("timed out") || errorMessage.includes("timeout")) {
        userMessage = errorMessage;
      } else if (errorMessage.includes("permission") || errorMessage.includes("Permission")) {
        userMessage = "Permission denied. Please check that you're signed in and have permission to create campaigns.";
      } else if (errorMessage.includes("upload") || errorMessage.includes("Upload")) {
        userMessage = errorMessage.length > 120 ? `Upload failed: ${errorMessage.slice(0, 120)}…` : errorMessage;
      } else if (errorMessage.includes("Supabase") || errorMessage.includes("campaign")) {
        userMessage = "Failed to save campaign data. Please check your connection and try again.";
      } else if (errorMessage.length < 200) {
        userMessage = errorMessage;
      }

      alert(userMessage, { title: "Submission Failed", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setProofFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const handleProofDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setProofDragOver(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type === "application/pdf" ||
          f.type.startsWith("image/") ||
          f.type === "application/msword" ||
          f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      setProofFiles((prev) => [...prev, ...files]);
    }
  };

  const handleProofDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProofDragOver(true);
  };

  const handleProofDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProofDragOver(false);
  };

  const removeFile = (index: number) => {
    setProofFiles(proofFiles.filter((_, i) => i !== index));
  };

  const isImage = (file: File) =>
    file.type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes((file.name.split(".").pop() || "").toLowerCase());

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

  const handleImageDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragOver(index);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragOver(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-medium mb-4">Start Your Campaign</h1>
      <p className="text-gray-600 mb-2">
        All campaigns require proof of need to ensure transparency and trust. Please provide supporting documents such as medical reports, financial statements, or other relevant documentation.
      </p>
      <p className="text-gray-600 mb-8">
        Your campaign will be held for review and will <strong>not</strong> appear on the public campaigns page until it is accepted by our team. You will be notified when it is approved or if any changes are needed.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Creator Type */}
        <div>
          <label className="block text-sm font-medium mb-2">
            I am a... *
          </label>
          <select
            name="creatorType"
            value={formData.creatorType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            <option value="">Select type</option>
            <option value="individual">Individual in Need</option>
            <option value="organization">Organization</option>
            <option value="charity">Registered Charity</option>
          </select>
        </div>

        {/* Campaign Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Campaign Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="Brief title describing your need"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            <option value="">Select a category</option>
            <option value="Medical expenses">Medical expenses</option>
            <option value="Educational support">Educational support</option>
            <option value="Disaster recovery">Disaster recovery</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Short Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="A brief summary of your campaign (2-3 sentences)"
          />
        </div>

        {/* Full Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Full Story *
          </label>
          <textarea
            name="fullDescription"
            value={formData.fullDescription}
            onChange={handleChange}
            required
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="Tell your story. What inspired you? What will you do with the funds?"
          />
        </div>

        {/* Goal Amount */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium">
              Funding Goal (BZ$) *
            </label>
            <span className="text-xs font-medium text-verified-700 bg-verified-50 px-2 py-1 rounded">
              Maximum BZ$5,000
            </span>
          </div>
          <input
            type="number"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            required
            min="1"
            max="5000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="e.g. 2000"
            step="0.01"
            aria-describedby="goal-max-notice"
          />
          <p id="goal-max-notice" className="text-sm text-gray-600 mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            You can ask for up to <strong>BZ$5,000</strong> per campaign. This is the maximum total funding goal allowed.
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="e.g., Belize City, Belize or Orange Walk Town, Belize"
          />
        </div>

        {/* Campaign Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Campaign Duration *
          </label>
          <select
            name="daysLeft"
            value={formData.daysLeft}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            <option value="">Select duration</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="120">120 days</option>
          </select>
        </div>

        {/* Campaign images — upload 2 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Campaign images *
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Upload 2 images for your campaign cover (left and right panels).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([0, 1] as const).map((index) => (
              <div key={index}>
                <span className="block text-xs font-medium text-gray-500 mb-1">
                  Image {index + 1}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleImageChange(index)}
                  className="hidden"
                  id={`campaign-image-upload-${index}`}
                />
                <label
                  htmlFor={`campaign-image-upload-${index}`}
                  onDragOver={handleImageDragOver(index)}
                  onDragLeave={handleImageDragLeave}
                  onDrop={handleImageDrop(index)}
                  className={`block border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    imageDragOver === index
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-300 hover:border-primary-500"
                  }`}
                >
                  {imageFiles[index] ? (
                    <div className="space-y-1">
                      <p className="text-primary-600 font-medium text-sm truncate" title={imageFiles[index]!.name}>
                        {imageFiles[index]!.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ({(imageFiles[index]!.size / 1024).toFixed(1)} KB) — click or drop to replace
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">
                        {index === 0 ? "First image" : "Second image"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Note about Identity Verification */}
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-success-600 mt-0.5" />
            <div>
              <p className="text-sm text-success-800 font-medium mb-1">
                Your identity has been verified
              </p>
              <p className="text-sm text-success-700">
                Your account identity verification is complete. You can now create campaigns.
              </p>
            </div>
          </div>
        </div>

        {/* Proof Documents - REQUIRED */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-900">
                Proof of Need Documents * (Required)
              </label>
              <p className="text-sm text-yellow-800 mb-4">
                To ensure transparency and build trust, please upload supporting documents such as:
              </p>
              <ul className="text-sm text-yellow-800 list-disc list-inside mb-4 space-y-1">
                <li>Medical reports or doctor&apos;s notes (for medical campaigns)</li>
                <li>Financial statements or income proof</li>
                <li>Official identification</li>
                <li>Organization registration documents (for organizations/charities)</li>
                <li>Any other relevant documentation proving your need</li>
              </ul>
            </div>
          </div>
          
          <label
            htmlFor="proof-upload"
            onDragOver={handleProofDragOver}
            onDragLeave={handleProofDragLeave}
            onDrop={handleProofDrop}
            className={`block border-2 border-dashed rounded-lg p-6 bg-white cursor-pointer transition-colors ${
              proofDragOver ? "border-primary-500 bg-primary-50" : "border-yellow-300 hover:border-yellow-500"
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="proof-upload"
            />
            <div className="flex flex-col items-center text-center">
              <FileText className="w-10 h-10 text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload or drag and drop proof documents
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG, DOC up to 10MB each
              </p>
            </div>
          </label>

          {/* Uploaded Files List */}
          {proofFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Uploaded Documents:</p>
              {proofFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Uploading images & submitting…" : "Submit for Review"}
          </button>
          <button
            type="button"
            className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
          >
            Save as Draft
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 font-medium mb-2">Important Information:</p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Your campaign will be reviewed by our team to verify all provided documents before being published.</li>
            <li>Your account identity has already been verified, so you only need to provide proof of need for this specific campaign.</li>
            <li>This verification process typically takes 24-48 hours.</li>
            <li>All documents are securely stored and only used for verification purposes.</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
