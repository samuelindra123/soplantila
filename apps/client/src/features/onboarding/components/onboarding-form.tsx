"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/auth-context";
import { AuthInput, FieldWrapper, StatusMessage, Spinner } from "@/components/auth/auth-primitives";
import { completeOnboardingAction } from "../actions";

export function OnboardingForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    tanggalLahir: "",
    tempatLahir: "",
    gender: "MALE",
    pekerjaan: "",
    bio: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (fileInputRef.current?.files?.[0]) {
      formData.append("fotoProfil", fileInputRef.current.files[0]);
    }

    try {
      const result = await completeOnboardingAction(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      await refreshUser();
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan profil. Periksa kembali data Anda.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-2xl mx-auto pb-20">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-6">
        <div 
          className="relative h-32 w-32 rounded-[2.5rem] bg-surface-dark border-2 border-dashed border-border-soft flex items-center justify-center overflow-hidden group cursor-pointer hover:border-accent transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center space-y-1">
              <span className="text-2xl">📸</span>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Upload</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
             <span className="text-xs font-bold text-white uppercase tracking-widest">Ubah</span>
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        <div className="text-center space-y-1">
           <h3 className="text-lg font-bold text-foreground">Foto Profil</h3>
           <p className="text-xs text-muted font-medium">Opsional, tapi membantu teman mengenali Anda.</p>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="grid md:grid-cols-2 gap-6">
        <FieldWrapper id="firstName" label="Nama Depan">
          <AuthInput 
            id="firstName" 
            placeholder="Samuel" 
            value={form.firstName} 
            onChange={e => setForm({...form, firstName: e.target.value})} 
            required
            className="text-foreground"
          />
        </FieldWrapper>
        <FieldWrapper id="lastName" label="Nama Belakang">
          <AuthInput 
            id="lastName" 
            placeholder="Indrabastian" 
            value={form.lastName} 
            onChange={e => setForm({...form, lastName: e.target.value})} 
            required
            className="text-foreground"
          />
        </FieldWrapper>
        <FieldWrapper id="username" label="Username">
          <AuthInput 
            id="username" 
            placeholder="samuelindrabastian" 
            value={form.username} 
            onChange={e => setForm({...form, username: e.target.value})} 
            required
            className="text-foreground"
          />
        </FieldWrapper>
        <FieldWrapper id="pekerjaan" label="Pekerjaan">
          <AuthInput 
            id="pekerjaan" 
            placeholder="Product Designer" 
            value={form.pekerjaan} 
            onChange={e => setForm({...form, pekerjaan: e.target.value})} 
            className="text-foreground"
          />
        </FieldWrapper>
        <FieldWrapper id="tanggalLahir" label="Tanggal Lahir">
          <AuthInput 
            id="tanggalLahir" 
            type="date" 
            value={form.tanggalLahir} 
            onChange={e => setForm({...form, tanggalLahir: e.target.value})} 
            required
            className="text-foreground"
          />
        </FieldWrapper>
        <FieldWrapper id="tempatLahir" label="Tempat Lahir">
          <AuthInput 
            id="tempatLahir" 
            placeholder="Jakarta" 
            value={form.tempatLahir} 
            onChange={e => setForm({...form, tempatLahir: e.target.value})} 
            className="text-foreground"
          />
        </FieldWrapper>
        <FieldWrapper id="gender" label="Jenis Kelamin">
          <div className="relative">
            <select 
              id="gender"
              className="h-12 w-full rounded-xl border border-border-soft bg-surface-dark px-4 text-[14px] font-medium text-foreground transition-all duration-300 outline-none focus:border-accent/50 appearance-none"
              value={form.gender}
              onChange={e => setForm({...form, gender: e.target.value})}
            >
              <option value="MALE">Laki-laki</option>
              <option value="FEMALE">Perempuan</option>
              <option value="OTHER">Lainnya</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted">
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </FieldWrapper>
      </div>

      <FieldWrapper id="bio" label="Bio Singkat">
        <textarea 
          id="bio"
          className="w-full min-h-[120px] rounded-xl border border-border-soft bg-surface-dark p-4 text-[14px] font-medium text-foreground transition-all duration-300 outline-none focus:border-accent/50"
          placeholder="Ceritakan sedikit tentang diri Anda..."
          value={form.bio}
          onChange={e => setForm({...form, bio: e.target.value})}
        />
      </FieldWrapper>

      {error && <StatusMessage tone="error">{error}</StatusMessage>}

      <div className="pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-2xl bg-foreground text-background font-bold text-lg shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          {isSubmitting && <Spinner />}
          Selesaikan Profil
        </button>
      </div>
    </form>
  );
}
