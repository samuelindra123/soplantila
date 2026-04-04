"use client";

import { UserProfile } from "@/types/api";
import { useState, useRef, useEffect } from "react";
import { profileService, UpdateProfileData } from "../services/profile-service";
import { XIcon, CameraIcon, CheckIcon } from "@/components/ui/icons";

type EditProfileModalProps = {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormErrors = Partial<Record<keyof UpdateProfileData | "general", string>>;

const GENDER_OPTIONS = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
  { value: "OTHER", label: "Lainnya" },
  { value: "PREFER_NOT_TO_SAY", label: "Tidak ingin menyebutkan" },
] as const;

export function EditProfileModal({ profile, isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateProfileData>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    bio: profile.bio || "",
    pekerjaan: profile.pekerjaan || "",
    tempatLahir: profile.tempatLahir || "",
    tanggalLahir: profile.tanggalLahir ? profile.tanggalLahir.split("T")[0] : "",
    gender: profile.gender,
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(profile.fotoProfilUrl);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(profile.coverImageUrl);
  const [selectedCoverOption, setSelectedCoverOption] = useState<"current" | "new" | "none">(
    profile.coverImageUrl ? "current" : "none",
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when profile changes
  useEffect(() => {
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      bio: profile.bio || "",
      pekerjaan: profile.pekerjaan || "",
      tempatLahir: profile.tempatLahir || "",
      tanggalLahir: profile.tanggalLahir ? profile.tanggalLahir.split("T")[0] : "",
      gender: profile.gender,
    });
    setProfileImagePreview(profile.fotoProfilUrl);
    setCoverImagePreview(profile.coverImageUrl);
    setProfileImage(null);
    setCoverImage(null);
    setSelectedCoverOption(profile.coverImageUrl ? "current" : "none");
    setErrors({});
    setSuccessMessage(null);
  }, [profile, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, general: "Ukuran foto profil maksimal 2MB" }));
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setErrors((prev) => ({ ...prev, general: "Format foto harus JPG, PNG, atau WEBP" }));
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, general: "Ukuran cover image maksimal 2MB" }));
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, general: "Format cover harus JPG, PNG, atau WEBP" }));
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setCoverImage(file);
    setCoverImagePreview(nextPreview);
    setSelectedCoverOption("new");
    setErrors((prev) => ({ ...prev, general: undefined }));
  };

  const handleSelectCoverOption = (option: "current" | "new" | "none") => {
    if (option === "new" && !coverImagePreview) {
      return;
    }
    if (option === "current" && !profile.coverImageUrl) {
      return;
    }

    setSelectedCoverOption(option);
    setErrors((prev) => ({ ...prev, general: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "Nama depan wajib diisi";
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Nama belakang wajib diisi";
    }
    if (!formData.username?.trim()) {
      newErrors.username = "Username wajib diisi";
    } else if (!/^[a-z0-9._]{3,30}$/.test(formData.username)) {
      newErrors.username = "Username harus 3-30 karakter (huruf kecil, angka, titik, underscore)";
    }
    if (!formData.tanggalLahir) {
      newErrors.tanggalLahir = "Tanggal lahir wajib diisi";
    }
    if (!formData.tempatLahir?.trim()) {
      newErrors.tempatLahir = "Tempat lahir wajib diisi";
    }

    if (selectedCoverOption === "new" && !coverImage) {
      newErrors.general = "Upload cover image dulu sebelum memilih cover baru";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const coverImageAction =
        selectedCoverOption === "none"
          ? "REMOVE"
          : selectedCoverOption === "new" && coverImage
            ? "REPLACE"
            : "KEEP";

      await profileService.updateProfile(
        {
          ...formData,
          coverImageAction,
        },
        profileImage || undefined,
        coverImageAction === "REPLACE" ? coverImage || undefined : undefined,
      );
      setSuccessMessage("Profil berhasil diperbarui!");
      
      // Wait a moment to show success message, then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui profil";
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || "U";
  const displayedCoverPreview =
    selectedCoverOption === "none"
      ? null
      : selectedCoverOption === "current"
        ? profile.coverImageUrl
        : coverImagePreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="relative w-full max-w-2xl max-h-[90vh] bg-background border border-border-soft rounded-[2rem] shadow-premium overflow-hidden flex flex-col mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
          <h2 id="edit-profile-title" className="text-xl font-bold">
            Edit Profil
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-dark transition-colors"
            aria-label="Tutup modal"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Cover Image Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-muted">
                Cover Image
              </label>
              <div 
                className="relative h-32 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-surface-dark border border-border-soft"
              >
                {displayedCoverPreview ? (
                  <img
                    src={displayedCoverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={() => setCoverImagePreview(null)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                    Belum ada cover image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  className="px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  Upload Cover
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCoverOption("none")}
                  className="px-4 py-2 rounded-full bg-surface-dark border border-border-soft text-sm font-semibold hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  Hapus Cover
                </button>
              </div>
              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverImageChange}
                className="hidden"
                aria-label="Upload cover profile"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectCoverOption("current")}
                  disabled={!profile.coverImageUrl}
                  className={`text-left p-3 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    selectedCoverOption === "current"
                      ? "border-accent bg-accent/10"
                      : "border-border-soft bg-surface-dark hover:border-accent/40"
                  } ${!profile.coverImageUrl ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Saat ini</p>
                  <p className="text-sm font-medium mt-1">Gunakan cover sekarang</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCoverOption("new")}
                  disabled={!coverImage}
                  className={`text-left p-3 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    selectedCoverOption === "new"
                      ? "border-accent bg-accent/10"
                      : "border-border-soft bg-surface-dark hover:border-accent/40"
                  } ${!coverImage ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Baru</p>
                  <p className="text-sm font-medium mt-1">Pakai hasil upload</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCoverOption("none")}
                  className={`text-left p-3 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    selectedCoverOption === "none"
                      ? "border-accent bg-accent/10"
                      : "border-border-soft bg-surface-dark hover:border-accent/40"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tanpa cover</p>
                  <p className="text-sm font-medium mt-1">Tampilkan background default</p>
                </button>
              </div>
              <p className="text-xs text-muted">
                Upload cover lalu pilih tampilan yang ingin digunakan. Maksimal 2MB (JPG/PNG/WEBP).
              </p>
            </div>

            {/* Profile Image Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-muted">
                Foto Profil
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-surface border-2 border-border-soft overflow-hidden">
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-accent/10 text-xl font-bold text-accent">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profileImageInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-accent text-white rounded-full shadow-lg hover:bg-accent-strong transition-colors"
                    aria-label="Ubah foto profil"
                  >
                    <CameraIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">Ubah foto profil</p>
                  <p className="text-xs text-muted mt-1">JPG, PNG, atau WEBP. Maksimal 2MB.</p>
                </div>
              </div>
              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProfileImageChange}
                className="hidden"
                aria-label="Upload foto profil"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-muted">
                  Nama Depan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-surface-dark border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.firstName 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-border-soft focus:border-accent/50 focus:ring-accent/20"
                  }`}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-muted">
                  Nama Belakang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-surface-dark border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.lastName 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-border-soft focus:border-accent/50 focus:ring-accent/20"
                  }`}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-muted">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-8 pr-4 py-3 bg-surface-dark border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.username 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-border-soft focus:border-accent/50 focus:ring-accent/20"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-medium text-muted">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                placeholder="Ceritakan sedikit tentang dirimu..."
                className="w-full px-4 py-3 bg-surface-dark border border-border-soft rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
              />
              <p className="text-xs text-muted text-right">
                {(formData.bio || "").length}/500
              </p>
            </div>

            {/* Pekerjaan */}
            <div className="space-y-2">
              <label htmlFor="pekerjaan" className="block text-sm font-medium text-muted">
                Pekerjaan
              </label>
              <input
                type="text"
                id="pekerjaan"
                name="pekerjaan"
                value={formData.pekerjaan}
                onChange={handleInputChange}
                placeholder="Contoh: Software Engineer"
                className="w-full px-4 py-3 bg-surface-dark border border-border-soft rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tempatLahir" className="block text-sm font-medium text-muted">
                  Tempat Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="tempatLahir"
                  name="tempatLahir"
                  value={formData.tempatLahir}
                  onChange={handleInputChange}
                  placeholder="Contoh: Jakarta"
                  className={`w-full px-4 py-3 bg-surface-dark border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.tempatLahir 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-border-soft focus:border-accent/50 focus:ring-accent/20"
                  }`}
                />
                {errors.tempatLahir && (
                  <p className="text-sm text-red-500">{errors.tempatLahir}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="tanggalLahir" className="block text-sm font-medium text-muted">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="tanggalLahir"
                  name="tanggalLahir"
                  value={formData.tanggalLahir}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-surface-dark border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all ${
                    errors.tanggalLahir 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-border-soft focus:border-accent/50 focus:ring-accent/20"
                  }`}
                />
                {errors.tanggalLahir && (
                  <p className="text-sm text-red-500">{errors.tanggalLahir}</p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-medium text-muted">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-surface-dark border border-border-soft rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error / Success Messages */}
            {errors.general && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-500">{errors.general}</p>
              </div>
            )}
            {successMessage && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-500">{successMessage}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-soft bg-background">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-surface-dark border border-border-soft hover:bg-surface font-semibold text-sm transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-accent text-white font-semibold text-sm hover:bg-accent-strong transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
