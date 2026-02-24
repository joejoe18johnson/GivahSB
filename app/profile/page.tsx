"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { compressImageForUpload } from "@/lib/compressImage";
import Link from "next/link";
import Image from "next/image";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Lock, 
  Edit, 
  X, 
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileText
} from "lucide-react";
import { useThemedModal } from "@/components/ThemedModal";
import type { IdDocumentTypeValue, InputChangeEvent } from "./types";
import ProfileView from "./ProfileView";

export default function ProfilePage() {
  const { user, isLoading, updateUser, logout } = useAuth();
  const { alert } = useThemedModal();
  const [editingName, setEditingName] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [name, setName] = useState(user?.name || "Johannes Johnson");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [phoneInput, setPhoneInput] = useState("");
  const [idDocumentType, setIdDocumentType] = useState(user?.idDocumentType || "" as IdDocumentTypeValue);
  const [idDocumentFile, setIdDocumentFile] = useState(null as File | null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addressDocumentFile, setAddressDocumentFile] = useState(null as File | null);
  const [isUploadingAddress, setIsUploadingAddress] = useState(false);
  const [addressUploadProgress, setAddressUploadProgress] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null as string | null);
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const addressFileInputRef = useRef<HTMLInputElement>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivatePhrase, setDeactivatePhrase] = useState("");
  const [deactivateInput, setDeactivateInput] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track last saved state
  const [lastSavedState, setLastSavedState] = useState({
    name: user?.name || "Johannes Johnson",
    birthday: user?.birthday || "",
    phoneNumber: user?.phoneNumber || "",
    profilePhoto: user?.profilePhoto || null,
  });

  // Sync state with user data when user changes
  useEffect(() => {
    if (user) {
      const userState = {
        name: user.name || "Johannes Johnson",
        birthday: user.birthday || "",
        phoneNumber: user.phoneNumber || "",
        profilePhoto: user.profilePhoto || null,
      };
      setName(userState.name);
      setBirthday(userState.birthday);
      setPhoneNumber(userState.phoneNumber);
      setProfilePhoto(userState.profilePhoto);
      // Update last saved state to match current user data
      setLastSavedState(userState);
      // If phone is verified, don't allow editing
      if (user.phoneVerified) {
        setEditingPhone(false);
      }
      setIdDocumentType(user.idDocumentType || "");
    }
  }, [user]);

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
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Link
            href="/auth/login?callbackUrl=/profile"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveName = async () => {
    try {
      await updateUser({ name });
      setEditingName(false);
    } catch (error) {
      console.error("Error saving name:", error);
      alert("Failed to save name. Please try again.", { variant: "error" });
    }
  };

  const handleSaveBirthday = async () => {
    try {
      await updateUser({ birthday });
      setEditingBirthday(false);
    } catch (error) {
      console.error("Error saving birthday:", error);
      alert("Failed to save birthday. Please try again.", { variant: "error" });
    }
  };

  const handleSavePassword = () => {
    // TODO: Implement password change logic (requires current password verification)
    // For now, just close the edit mode
    setEditingPassword(false);
    alert("Password change functionality will be implemented with backend integration.", { title: "Coming soon", variant: "info" });
  };

  const handleDeactivateAccount = async () => {
    if (!user) return;
    setIsDeactivating(true);
    try {
      await updateUser({ status: "deleted" });
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deactivating account:", error);
      alert("Failed to deactivate account. Please try again or contact support.", { variant: "error" });
      setIsDeactivating(false);
    }
  };

  const handlePhotoUpload = async (e: InputChangeEvent) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file", { variant: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB", { variant: "error" });
      return;
    }
    // Show preview instantly
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Upload and save immediately
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/photo", { method: "POST", credentials: "include", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      const photoUrl = data.url;
      await updateUser({ profilePhoto: photoUrl });
      setProfilePhoto(photoUrl);
      setLastSavedState((prev) => ({ ...prev, profilePhoto: photoUrl }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.", { variant: "error" });
      setProfilePhoto(user.profilePhoto || null);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setProfilePhoto(null);
    setIsUploadingPhoto(true);
    try {
      await updateUser({ profilePhoto: undefined });
      setLastSavedState((prev) => ({ ...prev, profilePhoto: null }));
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Failed to remove photo. Please try again.", { variant: "error" });
    } finally {
      setIsUploadingPhoto(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSavePhone = async () => {
    const raw = phoneInput.trim();
    if (!raw) return;
    // Only allow digits and hyphens
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
    } catch (error) {
      console.error("Error saving phone:", error);
      alert("Failed to save phone number. Please try again.", { variant: "error" });
    }
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
      } catch (updateErr: any) {
        console.error("Error saving ID document to profile:", updateErr);
        alert(
          "Document uploaded but we couldn’t save it to your profile. Please try again or contact support.",
          { variant: "error" }
        );
        return;
      }
      setIdDocumentFile(null);
      if (idFileInputRef.current) {
        idFileInputRef.current.value = "";
      }
      alert("ID document uploaded successfully. It will be reviewed by an admin.", { variant: "success" });
    } catch (error: any) {
      console.error("Error uploading ID document:", error);
      const errorMessage = error?.message || String(error);
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
      } catch (updateErr: any) {
        console.error("Error saving address document to profile:", updateErr);
        alert(
          "Document uploaded but we couldn’t save it to your profile. Please try again or contact support.",
          { variant: "error" }
        );
        return;
      }
      setAddressDocumentFile(null);
      if (addressFileInputRef.current) {
        addressFileInputRef.current.value = "";
      }
      alert("Address document uploaded successfully. It will be reviewed by an admin.", { variant: "success" });
    } catch (error: any) {
      console.error("Error uploading address document:", error);
      const errorMessage = error?.message || String(error);
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

  const handleAddPhone = () => {
    setEditingPhone(true);
    setPhoneInput("");
  };

  const handleSaveSettings = async () => {
    try {
      await updateUser({ name, birthday: birthday || undefined });
      setLastSavedState({ name, birthday: birthday || "", phoneNumber: phoneNumber || "", profilePhoto: profilePhoto ?? lastSavedState.profilePhoto });
      setEditingName(false);
      setEditingBirthday(false);
      setEditingPassword(false);
      setEditingPhone(false);
      setPhoneInput("");
      setShowSavedPopup(true);
      setTimeout(() => setShowSavedPopup(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 4000);
    }
  };
  const handleCancel = () => {
    setName(lastSavedState.name);
    setBirthday(lastSavedState.birthday);
    setPhoneNumber(lastSavedState.phoneNumber);
    setPhoneInput("");
    setProfilePhoto(lastSavedState.profilePhoto);
    setEditingName(false);
    setEditingBirthday(false);
    setEditingPassword(false);
    setEditingPhone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleDeactivateOpen = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let phrase = "deactivate-";
    for (let i = 0; i < 6; i++) phrase += chars.charAt(Math.floor(Math.random() * chars.length));
    setDeactivatePhrase(phrase);
    setDeactivateInput("");
    setShowDeactivateConfirm(true);
  };
  const handleDeactivateCancel = () => {
    setShowDeactivateConfirm(false);
    setDeactivateInput("");
  };

  return (
    <ProfileView
      user={user}
      showSavedPopup={showSavedPopup}
      showErrorPopup={showErrorPopup}
      profilePhoto={profilePhoto}
      name={name}
      setName={setName}
      editingName={editingName}
      setEditingName={setEditingName}
      handleSaveName={handleSaveName}
      handleRemovePhoto={handleRemovePhoto}
      handlePhotoUpload={handlePhotoUpload}
      isUploadingPhoto={isUploadingPhoto}
      fileInputRef={fileInputRef}
      phoneNumber={phoneNumber}
      phoneInput={phoneInput}
      setPhoneInput={setPhoneInput}
      editingPhone={editingPhone}
      handleSavePhone={handleSavePhone}
      handleAddPhone={handleAddPhone}
      idDocumentType={idDocumentType}
      setIdDocumentType={setIdDocumentType}
      idFileInputRef={idFileInputRef}
      idDocumentFile={idDocumentFile}
      setIdDocumentFile={setIdDocumentFile}
      handleIdFileChange={handleIdFileChange}
      handleIdDocumentUpload={handleIdDocumentUpload}
      isUploadingId={isUploadingId}
      uploadProgress={uploadProgress}
      addressFileInputRef={addressFileInputRef}
      addressDocumentFile={addressDocumentFile}
      setAddressDocumentFile={setAddressDocumentFile}
      handleAddressFileChange={handleAddressFileChange}
      handleAddressDocumentUpload={handleAddressDocumentUpload}
      isUploadingAddress={isUploadingAddress}
      addressUploadProgress={addressUploadProgress}
      editingBirthday={editingBirthday}
      setEditingBirthday={setEditingBirthday}
      birthday={birthday}
      setBirthday={setBirthday}
      handleSaveBirthday={handleSaveBirthday}
      editingPassword={editingPassword}
      setEditingPassword={setEditingPassword}
      handleSavePassword={handleSavePassword}
      lastSavedState={lastSavedState}
      updateUser={updateUser}
      setEditingPhone={setEditingPhone}
      showDeactivateConfirm={showDeactivateConfirm}
      deactivatePhrase={deactivatePhrase}
      deactivateInput={deactivateInput}
      setDeactivateInput={setDeactivateInput}
      isDeactivating={isDeactivating}
      handleDeactivateAccount={handleDeactivateAccount}
      onSaveSettings={handleSaveSettings}
      onCancel={handleCancel}
      onDeactivateOpen={handleDeactivateOpen}
      onDeactivateCancel={handleDeactivateCancel}
    />
  );
}
