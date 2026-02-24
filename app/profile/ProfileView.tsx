"use client";

import Link from "next/link";
import Image from "next/image";
import {
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
  FileText,
} from "lucide-react";
import type { RefObject } from "react";
import type { IdDocumentTypeValue, InputChangeEvent } from "./types";

export interface ProfileViewProps {
  user: { email?: string; name?: string; profilePhoto?: string; idDocument?: string; idDocumentType?: "social_security" | "passport"; idVerified?: boolean; idPending?: boolean; addressDocument?: string; addressVerified?: boolean; addressPending?: boolean; phoneVerified?: boolean; phonePending?: boolean };
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
  phoneNumber: string;
  phoneInput: string;
  setPhoneInput: (v: string) => void;
  editingPhone: boolean;
  handleSavePhone: () => void;
  handleAddPhone: () => void;
  idDocumentType: string;
  setIdDocumentType: (v: IdDocumentTypeValue) => void;
  idFileInputRef: RefObject<HTMLInputElement>;
  idDocumentFile: File | null;
  setIdDocumentFile: (v: File | null) => void;
  handleIdFileChange: (e: InputChangeEvent) => void;
  handleIdDocumentUpload: () => void;
  isUploadingId: boolean;
  uploadProgress: number;
  addressFileInputRef: RefObject<HTMLInputElement>;
  addressDocumentFile: File | null;
  setAddressDocumentFile: (v: File | null) => void;
  handleAddressFileChange: (e: InputChangeEvent) => void;
  handleAddressDocumentUpload: () => void;
  isUploadingAddress: boolean;
  addressUploadProgress: number;
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
  setEditingPhone: (v: boolean) => void;
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
    phoneNumber,
    phoneInput,
    setPhoneInput,
    editingPhone,
    handleSavePhone,
    handleAddPhone,
    idDocumentType,
    setIdDocumentType,
    idFileInputRef,
    idDocumentFile,
    setIdDocumentFile,
    handleIdFileChange,
    handleIdDocumentUpload,
    isUploadingId,
    uploadProgress,
    addressFileInputRef,
    addressDocumentFile,
    setAddressDocumentFile,
    handleAddressFileChange,
    handleAddressDocumentUpload,
    isUploadingAddress,
    addressUploadProgress,
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
    setEditingPhone,
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

  const idBlocked = user?.idVerified || (user?.idPending === true && !!user?.idDocument);

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

      <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-8">Account</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Profile Photo</h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-6">
            <div
              className="relative flex-shrink-0 w-24 h-24 min-w-[6rem] min-h-[6rem] rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-medium"
              style={{ aspectRatio: "1" }}
            >
              {(profilePhoto || user?.profilePhoto) ? (
                <Image
                  src={profilePhoto || user?.profilePhoto || ""}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span>{name.charAt(0).toUpperCase()}</span>
              )}
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Name</h2>
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
            <p className="text-gray-900">{name}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
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
              {user?.phoneVerified && <p className="text-sm text-gray-600">This number cannot be changed or removed.</p>}
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">ID Verification</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {user?.idDocument ? (
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
              <p className="text-gray-600">Upload a photo of your Social Security card or Passport for verification. Once uploaded, it will be pending admin approval and cannot be changed.</p>
              <p className="text-sm text-gray-500">Supported: JPG, PNG, HEIC, PDF (max 10MB). If upload fails, ensure you’re signed in and try again.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                  <select
                    value={idDocumentType}
                    onChange={(e) => setIdDocumentType((e.target.value || "") as IdDocumentTypeValue)}
                    disabled={idBlocked}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Address Verification</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {user?.addressDocument ? (
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
              <p className="text-gray-600">Upload a proof of address document (utility bill, bank statement, or government-issued document with your address). Once uploaded, it will be pending admin approval and cannot be changed.</p>
              <p className="text-sm text-gray-500">Supported: JPG, PNG, HEIC, PDF (max 10MB). If upload fails, ensure you’re signed in and try again.</p>
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Connected app permissions</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-600">No connected apps yet</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">Email address</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-900">{user.email || "joejoe18johnson@gmail.com"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Birthday</h2>
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
            <p className="text-gray-900">{new Date(birthday).toLocaleDateString()}</p>
          ) : (
            <p className="text-gray-600">Add your birthday</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Password</h2>
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
              <p className="text-gray-900">●●●●●●●●●●●●</p>
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

      <div className="bg-white rounded-xl border border-red-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Deactivate account</h2>
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
