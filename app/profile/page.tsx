"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { X } from "lucide-react";
import { useThemedModal } from "@/components/ThemedModal";
import ProfileView from "./ProfileView";

export default function ProfilePage() {
  const { user, isLoading, updateUser, logout } = useAuth();
  const { alert } = useThemedModal();
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("verify") === "1") {
      setShowVerifyBanner(true);
    }
  }, []);
  const [editingName, setEditingName] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [name, setName] = useState(user?.name || "Johannes Johnson");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || null as string | null);
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
      setProfilePhoto(userState.profilePhoto);
      setLastSavedState(userState);
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

  // Do not allow viewing profile until email is verified (defense in depth).
  if (user.emailVerified === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please verify your email before you can view your profile. Check your inbox and click the verification link we sent.</p>
          <Link
            href="/auth/login"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Go to sign in
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
      const res = await fetch("/api/profile/delete", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to deactivate account");
      }
      // Account and auth user are deleted; full redirect so session is gone
      window.location.href = "/";
    } catch (error) {
      console.error("Error deactivating account:", error);
      alert("Failed to deactivate account. Please try again or contact support.", { variant: "error" });
      setIsDeactivating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (!res.ok) {
        const message = typeof (data as { error?: string }).error === "string" ? (data as { error: string }).error : "Upload failed";
        throw new Error(message);
      }
      const photoUrl = (data as { url: string }).url;
      await updateUser({ profilePhoto: photoUrl });
      setProfilePhoto(photoUrl);
      setLastSavedState((prev) => ({ ...prev, profilePhoto: photoUrl }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      const message = error instanceof Error ? error.message : "Failed to upload photo. Please try again.";
      alert(message, { variant: "error" });
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


  const handleSaveSettings = async () => {
    try {
      await updateUser({ name, birthday: birthday || undefined });
      setLastSavedState({ name, birthday: birthday || "", phoneNumber: user?.phoneNumber || "", profilePhoto: profilePhoto ?? lastSavedState.profilePhoto });
      setEditingName(false);
      setEditingBirthday(false);
      setEditingPassword(false);
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
    setProfilePhoto(lastSavedState.profilePhoto);
    setEditingName(false);
    setEditingBirthday(false);
    setEditingPassword(false);
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
    <>
      {showVerifyBanner && user && (
        <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-primary-800 text-sm md:text-base">
            <strong>Verify to create campaigns.</strong> Add and verify your phone number, ID document, and address in the{" "}
            <Link href="/verification-center" className="font-medium underline hover:text-primary-900">Verification Center</Link>. Once approved, you can start a campaign.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowVerifyBanner(false);
              window.history.replaceState(null, "", "/profile");
            }}
            className="shrink-0 p-2 text-primary-600 hover:text-primary-800 rounded-lg hover:bg-primary-100 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
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
    </>
  );
}
