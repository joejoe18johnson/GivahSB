"use client";

import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import {
  Mail,
  Calendar,
  Lock,
  Edit,
  X,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { RefObject } from "react";
import type { InputChangeEvent } from "./types";

export interface ProfileViewProps {
  user: { email?: string; name?: string; profilePhoto?: string };
  showSavedPopup: boolean;
  showErrorPopup: boolean;
  profilePhoto: string | null;
  name: string;
  setName: (v: string) => void;
  editingName: boolean;
  setEditingName: (v: boolean) => void;
  handleSaveName: () => void;
  handleRemovePhoto: () => void;
  handlePhotoUpload: (e: InputChangeEvent) => void;
  isUploadingPhoto: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  editingBirthday: boolean;
  setEditingBirthday: (v: boolean) => void;
  birthday: string;
  setBirthday: (v: string) => void;
  handleSaveBirthday: () => void;
  editingPassword: boolean;
  setEditingPassword: (v: boolean) => void;
  handleSavePassword: () => void;
  lastSavedState: { name: string; birthday: string; phoneNumber: string; profilePhoto: string | null };
  updateUser: (u: { name?: string; birthday?: string }) => Promise<void>;
  showDeactivateConfirm: boolean;
  deactivatePhrase: string;
  deactivateInput: string;
  setDeactivateInput: (v: string) => void;
  isDeactivating: boolean;
  handleDeactivateAccount: () => void;
  onSaveSettings: () => Promise<void>;
  onCancel: () => void;
  onDeactivateOpen: () => void;
  onDeactivateCancel: () => void;
}

export default function ProfileView(props: ProfileViewProps) {
  const {
    user,
    showSavedPopup,
    showErrorPopup,
    profilePhoto,
    name,
    setName,
    editingName,
    setEditingName,
    handleSaveName,
    handleRemovePhoto,
    handlePhotoUpload,
    isUploadingPhoto,
    fileInputRef,
    editingBirthday,
    setEditingBirthday,
    birthday,
    setBirthday,
    handleSaveBirthday,
    editingPassword,
    setEditingPassword,
    handleSavePassword,
    lastSavedState,
    updateUser,
    showDeactivateConfirm,
    deactivatePhrase,
    deactivateInput,
    setDeactivateInput,
    isDeactivating,
    handleDeactivateAccount,
    onSaveSettings,
    onCancel,
    onDeactivateOpen,
    onDeactivateCancel,
  } = props;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {showSavedPopup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-white rounded-xl shadow-lg border border-success-200 px-5 py-4 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success-600" />
            </div>
            <p className="text-success-800 font-medium">Settings saved successfully!</p>
          </div>
        </div>
      )}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-white rounded-xl shadow-lg border border-red-200 px-5 py-4 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-800 font-medium">Failed to save settings. Please try again.</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-8">Account</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Photo</h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-6">
            <div
              className="relative flex-shrink-0 w-24 h-24 min-w-[6rem] min-h-[6rem] rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-medium"
              style={{ aspectRatio: "1" }}
            >
              <UserAvatar
                profilePhoto={profilePhoto || user?.profilePhoto || null}
                name={name}
                email={user?.email}
                size={96}
                className="w-full h-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="sr-only"
                id="photo-upload"
                aria-label="Upload profile photo"
                disabled={isUploadingPhoto}
              />
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload photo
              </label>
              {profilePhoto && (
                <div className="flex gap-2">
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Change
                  </label>
                  <button
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Name</h2>
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {editingName ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button onClick={handleSaveName} className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium">
                Save
              </button>
              <button
                onClick={() => {
                  setName(user?.name || "Johannes Johnson");
                  setEditingName(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <p className="text-gray-900 dark:text-gray-100">{name}</p>
          )}
        </div>
      </div>


      <div className="bg-white dark:bg-gray-800 rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Connected app permissions</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-600">No connected apps yet</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email address</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-900 dark:text-gray-100">{user.email || "joejoe18johnson@gmail.com"}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Birthday</h2>
          </div>
          {!editingBirthday && (
            <button onClick={() => setEditingBirthday(true)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {editingBirthday ? (
            <div className="flex items-center gap-3">
              <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" autoFocus />
              <button onClick={handleSaveBirthday} className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium">Save</button>
              <button onClick={() => { setBirthday(""); setEditingBirthday(false); }} className="p-2 text-gray-600 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : birthday ? (
            <p className="text-gray-900 dark:text-gray-100">{new Date(birthday).toLocaleDateString()}</p>
          ) : (
            <p className="text-gray-600">Add your birthday</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl gradient-border-1 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Password</h2>
          </div>
          {!editingPassword && (
            <button onClick={() => setEditingPassword(true)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {editingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
                <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
                <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Confirm new password" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSavePassword} className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium">Save</button>
                <button onClick={() => setEditingPassword(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-gray-100">●●●●●●●●●●●●</p>
              <button
                onClick={() => {
                  const userEmail = user?.email || "";
                  alert(`Password reset email will be sent to ${userEmail}`);
                  console.log("Password reset requested for:", userEmail);
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={onSaveSettings} className="flex-1 px-6 py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium">
          Save Settings
        </button>
        <button onClick={onCancel} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          Cancel
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Deactivate account</h2>
              <p className="text-sm text-gray-600 mb-4">If you deactivate your account, you won&apos;t be able to log in anymore, and your fundraisers will no longer appear on the platform.</p>
              <p className="text-sm text-gray-600 mb-4">
                To learn more about your account management options,{" "}
                <Link href="#" className="text-primary-600 hover:text-primary-700 underline">click here</Link>.
              </p>
              {showDeactivateConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-600">Are you sure you want to deactivate your account? This action cannot be undone.</p>
                  <p className="text-sm text-gray-700">
                    Type <strong className="font-mono text-red-600">{deactivatePhrase}</strong> below to confirm:
                  </p>
                  <input
                    type="text"
                    value={deactivateInput}
                    onChange={(e) => setDeactivateInput(e.target.value)}
                    placeholder="Type the phrase above"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                    autoComplete="off"
                    disabled={isDeactivating}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeactivateAccount}
                      disabled={isDeactivating || deactivateInput !== deactivatePhrase}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                    >
                      {isDeactivating ? "Deactivating…" : "Yes, deactivate my account"}
                    </button>
                    <button onClick={onDeactivateCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium" disabled={isDeactivating}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={onDeactivateOpen} className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                  Deactivate account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
