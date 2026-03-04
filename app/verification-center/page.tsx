"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useThemedModal } from "@/components/ThemedModal";
import { compressImageForUpload } from "@/lib/compressImage";
import type { IdDocumentTypeValue, InputChangeEvent } from "@/app/profile/types";

export default function VerificationCenterPage() {
  const { user, isLoading, updateUser } = useAuth();
  const { alert } = useThemedModal();

  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [phoneInput, setPhoneInput] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [idDocumentType, setIdDocumentType] = useState<IdDocumentTypeValue>(user?.idDocumentType || "");
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addressDocumentFile, setAddressDocumentFile] = useState<File | null>(null);
  const [isUploadingAddress, setIsUploadingAddress] = useState(false);
  const [addressUploadProgress, setAddressUploadProgress] = useState(0);
  const [idRejectionReason, setIdRejectionReason] = useState<string | null>(null);
  const [addressRejectionReason, setAddressRejectionReason] = useState<string | null>(null);

  const idFileInputRef = useRef<HTMLInputElement>(null);
  const addressFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber || "");
      setIdDocumentType((user.idDocumentType as IdDocumentTypeValue) || "");
      if (user.phoneVerified) setEditingPhone(false);
    }
  }, [user]);

  // Load latest rejection reasons (ID / address) from notifications so we can show them next to the upload UI
  useEffect(() => {
    if (!user) {
      setIdRejectionReason(null);
      setAddressRejectionReason(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications?limit=50", { credentials: "include" });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        const list = Array.isArray(data.notifications) ? data.notifications : [];
        // Look for the most recent verification_rejected notifications
        const reversed = [...list].reverse() as {
          type?: string;
          title?: string;
          body?: string;
        }[];
        const idNotif = reversed.find(
          (n) =>
            n.type === "verification_rejected" &&
            typeof n.title === "string" &&
            n.title.toLowerCase().includes("identity document")
        );
        const addrNotif = reversed.find(
          (n) =>
            n.type === "verification_rejected" &&
            typeof n.title === "string" &&
            n.title.toLowerCase().includes("address document")
        );
        if (!cancelled) {
          setIdRejectionReason(typeof idNotif?.body === "string" ? idNotif.body : null);
          setAddressRejectionReason(typeof addrNotif?.body === "string" ? addrNotif.body : null);
        }
      } catch {
        if (!cancelled) {
          setIdRejectionReason(null);
          setAddressRejectionReason(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSavePhone = async () => {
    const raw = phoneInput.trim();
    if (!raw) return;
    if (!/^[\d-]+$/.test(raw)) {
      alert("Phone number can only contain numbers and hyphens (e.g. 501-123-4567 or 5011234567).", { variant: "error" });
      return;
    }
    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      alert("Please enter a valid phone number with at least 7 digits (e.g. 501-123-4567 or 5011234567).", { variant: "error" });
      return;
    }
    try {
      await updateUser({ phoneNumber: raw, phoneVerified: false, phonePending: true });
      setPhoneNumber(raw);
      setEditingPhone(false);
      setPhoneInput("");
      try {
        await fetch("/api/notifications/verification-uploaded", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type: "phone" }),
        });
      } catch {
        // non-blocking
      }
    } catch (error) {
      console.error("Error saving phone:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save phone number. Please try again.";
      alert(message, { variant: "error" });
    }
  };

  const handleAddPhone = () => {
    setEditingPhone(true);
    setPhoneInput("");
  };

  async function uploadVerificationViaApi(
    file: File,
    documentType: string,
    onProgress?: (p: number) => void
  ): Promise<string> {
    if (!user) throw new Error("You must be signed in to upload.");
    onProgress?.(10);
    const fileToSend = await compressImageForUpload(file);
    onProgress?.(30);
    const formData = new FormData();
    formData.append("file", fileToSend);
    formData.append("documentType", documentType);
    onProgress?.(50);
    const res = await fetch("/api/upload-verification", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    onProgress?.(90);
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Upload failed.");
    }
    onProgress?.(100);
    if (typeof data.url !== "string") throw new Error("No URL returned.");
    return data.url;
  }

  const handleIdDocumentUpload = async () => {
    if (user?.idPending && user?.idDocument) {
      alert("You already have an ID document pending verification. Please wait for the verification process to complete before uploading a new document.", { variant: "error" });
      return;
    }
    if (!idDocumentType) {
      alert("Please select the type of ID document (Social Security or Passport).", { variant: "error" });
      return;
    }
    if (!idDocumentFile) {
      alert("Please select a file to upload.", { variant: "error" });
      return;
    }
    if (!user) return;

    setIsUploadingId(true);
    setUploadProgress(0);
    try {
      const documentUrl = await uploadVerificationViaApi(
        idDocumentFile,
        idDocumentType,
        (p) => setUploadProgress(p)
      );
      try {
        await updateUser({
          idDocument: documentUrl,
          idDocumentType: idDocumentType as "social_security" | "passport",
          idVerified: false,
          idPending: true,
        });
      } catch (updateErr: unknown) {
        console.error("Error saving ID document to profile:", updateErr);
        alert(
          "Document uploaded but we couldn't save it to your profile. Please try again or contact support.",
          { variant: "error" }
        );
        return;
      }
      setIdDocumentFile(null);
      if (idFileInputRef.current) idFileInputRef.current.value = "";
      try {
        await fetch("/api/notifications/verification-uploaded", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type: "id" }),
        });
      } catch {
        // non-blocking
      }
      alert("ID document uploaded successfully. It will be reviewed by an admin.", { variant: "success" });
    } catch (error: unknown) {
      console.error("Error uploading ID document:", error);
      const errorMessage = error instanceof Error && error.message ? error.message : String(error);
      alert(`Upload failed: ${errorMessage}`, { variant: "error" });
    } finally {
      setIsUploadingId(false);
      setUploadProgress(0);
    }
  };

  const handleIdFileChange = (e: InputChangeEvent) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = /^image\//.test(file.type) || file.type === "application/pdf";
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowedExt = ["jpg", "jpeg", "png", "gif", "webp", "heic", "pdf"].includes(ext);
    if (!allowedTypes && !allowedExt) {
      alert("Please select an image (JPG, PNG, HEIC, etc.) or PDF.", { variant: "error" });
      if (idFileInputRef.current) idFileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.", { variant: "error" });
      if (idFileInputRef.current) idFileInputRef.current.value = "";
      return;
    }
    setIdDocumentFile(file);
  };

  const handleAddressDocumentUpload = async () => {
    if (user?.addressPending) {
      alert("You already have an address document pending verification. Please wait for the verification process to complete before uploading a new document.", { variant: "error" });
      return;
    }
    if (!addressDocumentFile) {
      alert("Please select a file to upload.", { variant: "error" });
      return;
    }
    if (!user) return;

    setIsUploadingAddress(true);
    setAddressUploadProgress(0);
    try {
      const documentUrl = await uploadVerificationViaApi(
        addressDocumentFile,
        "address",
        (p) => setAddressUploadProgress(p)
      );
      try {
        await updateUser({
          addressDocument: documentUrl,
          addressVerified: false,
          addressPending: true,
        });
      } catch (updateErr: unknown) {
        console.error("Error saving address document to profile:", updateErr);
        alert(
          "Document uploaded but we couldn't save it to your profile. Please try again or contact support.",
          { variant: "error" }
        );
        return;
      }
      setAddressDocumentFile(null);
      if (addressFileInputRef.current) addressFileInputRef.current.value = "";
      try {
        await fetch("/api/notifications/verification-uploaded", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type: "address" }),
        });
      } catch {
        // non-blocking
      }
      alert("Address document uploaded successfully. It will be reviewed by an admin.", { variant: "success" });
    } catch (error: unknown) {
      console.error("Error uploading address document:", error);
      const errorMessage = error instanceof Error && error.message ? error.message : String(error);
      alert(`Upload failed: ${errorMessage}`, { variant: "error" });
    } finally {
      setIsUploadingAddress(false);
      setAddressUploadProgress(0);
    }
  };

  const handleAddressFileChange = (e: InputChangeEvent) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = /^image\//.test(file.type) || file.type === "application/pdf";
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowedExt = ["jpg", "jpeg", "png", "gif", "webp", "heic", "pdf"].includes(ext);
    if (!allowedTypes && !allowedExt) {
      alert("Please select an image (JPG, PNG, HEIC, etc.) or PDF.", { variant: "error" });
      if (addressFileInputRef.current) addressFileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.", { variant: "error" });
      if (addressFileInputRef.current) addressFileInputRef.current.value = "";
      return;
    }
    setAddressDocumentFile(file);
  };

  const idRejected = !!(user?.idDocument && !user.idVerified && !user.idPending);
  const addressRejected = !!(user?.addressDocument && !user.addressVerified && !user.addressPending);
  const idBlocked = user?.idVerified || (user?.idPending === true && !!user?.idDocument);

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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to manage your verification.</p>
          <Link
            href="/auth/login?callbackUrl=/verification-center"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary-600" />
          Verification Center
        </h1>
        <p className="text-gray-600 mt-2">Verify your phone, ID, and address to create campaigns. All three must be approved by our team.</p>
      </div>

      {/* Phone */}
      <div className="bg-white rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Phone number</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {phoneNumber ? (
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">{phoneNumber}</p>
              {user?.phoneVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-verified-100 text-verified-700 rounded-full text-xs font-medium w-fit">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : user?.phonePending ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                  <AlertTriangle className="w-3 h-3" />
                  Pending approval
                </span>
              ) : null}
              <p className="text-sm text-gray-600">This number cannot be changed. Only an admin can verify or deny it.</p>
            </div>
          ) : editingPhone ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You can add your phone number once. After saving, it will be pending admin approval and cannot be edited or removed.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 501-123-4567 or 5011234567"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
                  autoFocus
                />
                <button
                  onClick={handleSavePhone}
                  disabled={!phoneInput.trim()}
                  className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button onClick={() => { setEditingPhone(false); setPhoneInput(""); }} className="p-2 text-gray-600 hover:text-gray-700" aria-label="Cancel">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">No phone number on file</p>
              <p className="text-sm text-gray-500 mb-3">Add your phone number here. Once saved, it will be pending admin approval and cannot be edited or removed.</p>
              <button
                onClick={handleAddPhone}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                Add phone number
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ID Verification */}
      <div className="bg-white rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">ID Verification</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {user?.idDocument && !idRejected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <p className="text-gray-900 font-medium">{user.idDocumentType === "social_security" ? "Social Security Card" : "Passport"}</p>
              </div>
              {user?.idVerified ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-verified-100 text-verified-700 rounded-full text-xs font-medium w-fit">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                  <p className="text-sm text-gray-600">Your ID document cannot be changed or removed.</p>
                </>
              ) : user?.idPending ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                    <AlertTriangle className="w-3 h-3" />
                    Pending approval
                  </span>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">ID document submitted and pending verification</p>
                        <p className="text-sm text-amber-800">Your ID document has already been submitted and is currently being reviewed by our team. You cannot upload a new document until the verification process is complete. You will be notified once your ID has been approved or if any additional information is needed.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {idRejected && idRejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">ID document not approved</p>
                  <p className="text-sm text-red-700 whitespace-pre-line">{idRejectionReason}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Please fix the issue and upload a new ID document below.
                  </p>
                </div>
              )}
              <p className="text-gray-600">Upload a photo of your Social Security card or Passport for verification. Once uploaded, it will be pending admin approval and cannot be changed.</p>
              <p className="text-sm text-gray-500">Supported: JPG, PNG, HEIC, PDF (max 10MB). If upload fails, ensure you&apos;re signed in and try again.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                  <select
                    value={idDocumentType}
                    onChange={(e) => setIdDocumentType((e.target.value || "") as IdDocumentTypeValue)}
                    disabled={idBlocked}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-300"
                  >
                    <option value="">Select ID type</option>
                    <option value="social_security">Social Security Card</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input ref={idFileInputRef} type="file" accept="image/*,.pdf" onChange={handleIdFileChange} className="sr-only" id="id-document-upload" aria-label="Choose ID document file" tabIndex={-1} />
                    {idBlocked ? (
                      <button type="button" disabled className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
                        <Upload className="w-4 h-4" />
                        {idDocumentFile ? idDocumentFile.name : "Choose file"}
                      </button>
                    ) : (
                      <label htmlFor="id-document-upload" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {idDocumentFile ? idDocumentFile.name : "Choose file"}
                      </label>
                    )}
                    {idDocumentFile && !idBlocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setIdDocumentFile(null);
                          if (idFileInputRef.current) idFileInputRef.current.value = "";
                        }}
                        className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleIdDocumentUpload}
                    disabled={!idDocumentType || !idDocumentFile || isUploadingId || idBlocked}
                    className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {isUploadingId ? `Uploading... ${uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : ""}` : "Upload ID Document"}
                  </button>
                  {isUploadingId && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-success-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
                {idBlocked && user?.idPending && <p className="text-sm text-amber-600 mt-2">You cannot upload a new ID document while your current submission is pending verification.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Verification */}
      <div className="bg-white rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Address Verification</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {user?.addressDocument && !addressRejected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <p className="text-gray-900 font-medium">Proof of Address</p>
              </div>
              {user?.addressVerified ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-verified-100 text-verified-700 rounded-full text-xs font-medium w-fit">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                  <p className="text-sm text-gray-600">Your address document cannot be changed or removed.</p>
                </>
              ) : user?.addressPending ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                    <AlertTriangle className="w-3 h-3" />
                    Pending approval
                  </span>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">Address document submitted and pending verification</p>
                        <p className="text-sm text-amber-800">Your address document has already been submitted and is currently being reviewed by our team. You cannot upload a new document until the verification process is complete. You will be notified once your address has been approved or if any additional information is needed.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {addressRejected && addressRejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">Address document not approved</p>
                  <p className="text-sm text-red-700 whitespace-pre-line">{addressRejectionReason}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Please fix the issue and upload a new proof of address below.
                  </p>
                </div>
              )}
              <p className="text-gray-600">Upload a proof of address document (utility bill, bank statement, or government-issued document with your address). Once uploaded, it will be pending admin approval and cannot be changed.</p>
              <p className="text-sm text-gray-500">Supported: JPG, PNG, HEIC, PDF (max 10MB). If upload fails, ensure you&apos;re signed in and try again.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input ref={addressFileInputRef} type="file" accept="image/*,.pdf" onChange={handleAddressFileChange} className="sr-only" id="address-document-upload" aria-label="Choose address document file" tabIndex={-1} />
                    {user?.addressPending || user?.addressVerified ? (
                      <button type="button" disabled className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
                        <Upload className="w-4 h-4" />
                        {addressDocumentFile ? addressDocumentFile.name : "Choose file"}
                      </button>
                    ) : (
                      <label htmlFor="address-document-upload" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {addressDocumentFile ? addressDocumentFile.name : "Choose file"}
                      </label>
                    )}
                    {addressDocumentFile && !user?.addressPending && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressDocumentFile(null);
                          if (addressFileInputRef.current) addressFileInputRef.current.value = "";
                        }}
                        className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAddressDocumentUpload}
                    disabled={!addressDocumentFile || isUploadingAddress || user?.addressVerified || user?.addressPending === true}
                    className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {isUploadingAddress ? `Uploading... ${addressUploadProgress > 0 ? `${Math.round(addressUploadProgress)}%` : ""}` : "Upload Address Document"}
                  </button>
                  {isUploadingAddress && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-success-500 h-2 rounded-full transition-all duration-300" style={{ width: `${addressUploadProgress}%` }} />
                    </div>
                  )}
                </div>
                {user?.addressPending && <p className="text-sm text-amber-600 mt-2">You cannot upload a new address document while your current submission is pending verification.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        <Link href="/profile" className="text-primary-600 hover:text-primary-700 font-medium">
          ← Back to My Profile
        </Link>
      </p>
    </div>
  );
}
