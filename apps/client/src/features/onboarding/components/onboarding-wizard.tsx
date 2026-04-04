"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitOnboardingAction } from "@/features/onboarding/actions";
import { useAuth } from "@/features/auth/context/auth-context";
import { AuthInput, FieldWrapper, StatusMessage, Spinner } from "@/components/auth/auth-primitives";

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
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

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (fileInputRef.current?.files?.[0]) {
      formData.append("fotoProfil", fileInputRef.current.files[0]);
    }

    const result = await submitOnboardingAction(formData);
    
    if (result.success) {
      await refreshUser();
      router.push("/dashboard");
    } else {
      setError(result.error || "Gagal menyimpan profil.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-12">
      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-center">
        
        {/* Step 1: Basic Identity */}
        {step === 1 && (
          <div className="space-y-12 animate-reveal">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Halo! Siapa nama Anda?</h2>
              <p className="text-xl text-muted font-medium">Mari mulai dengan identitas dasar Anda.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FieldWrapper id="firstName" label="Nama Depan">
                <AuthInput 
                  id="firstName" placeholder="Samuel" value={form.firstName} 
                  onChange={e => setForm({...form, firstName: e.target.value})} className="text-foreground h-16 text-lg"
                />
              </FieldWrapper>
              <FieldWrapper id="lastName" label="Nama Belakang">
                <AuthInput 
                  id="lastName" placeholder="Indrabastian" value={form.lastName} 
                  onChange={e => setForm({...form, lastName: e.target.value})} className="text-foreground h-16 text-lg"
                />
              </FieldWrapper>
              <div className="md:col-span-2">
                <FieldWrapper id="username" label="Username Unik">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-lg">@</span>
                    <AuthInput 
                      id="username" placeholder="samuelindrabastian" value={form.username} 
                      onChange={e => setForm({...form, username: e.target.value})} className="pl-10 text-foreground h-16 text-lg"
                    />
                  </div>
                </FieldWrapper>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-12 animate-reveal">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Lebih dekat lagi.</h2>
              <p className="text-xl text-muted font-medium">Beri tahu kami tentang latar belakang Anda.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FieldWrapper id="pekerjaan" label="Pekerjaan">
                <AuthInput 
                  id="pekerjaan" placeholder="Product Designer" value={form.pekerjaan} 
                  onChange={e => setForm({...form, pekerjaan: e.target.value})} className="text-foreground h-16 text-lg"
                />
              </FieldWrapper>
              <FieldWrapper id="tanggalLahir" label="Tanggal Lahir">
                <AuthInput 
                  id="tanggalLahir" type="date" value={form.tanggalLahir} 
                  onChange={e => setForm({...form, tanggalLahir: e.target.value})} className="text-foreground h-16 text-lg"
                />
              </FieldWrapper>
              <FieldWrapper id="tempatLahir" label="Tempat Lahir">
                <AuthInput 
                  id="tempatLahir" placeholder="Jakarta" value={form.tempatLahir} 
                  onChange={e => setForm({...form, tempatLahir: e.target.value})} className="text-foreground h-16 text-lg"
                />
              </FieldWrapper>
              <FieldWrapper id="gender" label="Jenis Kelamin">
                <div className="relative">
                  <select 
                    className="h-16 w-full rounded-xl border border-border-soft bg-surface-dark px-4 text-lg font-medium text-foreground appearance-none outline-none focus:border-accent/50"
                    value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </FieldWrapper>
            </div>
          </div>
        )}

        {/* Step 3: Expression */}
        {step === 3 && (
          <div className="space-y-12 animate-reveal">
            <div className="space-y-4 text-center">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Ekspresikan diri.</h2>
              <p className="text-xl text-muted font-medium">Langkah terakhir sebelum masuk ke dunia Soplantila.</p>
            </div>
            
            <div className="flex flex-col items-center space-y-8">
              <div 
                className="relative h-48 w-48 rounded-[4rem] bg-surface-dark border-2 border-dashed border-border-soft flex items-center justify-center overflow-hidden group cursor-pointer hover:border-accent transition-all shadow-premium"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center space-y-2">
                    <span className="text-4xl">📸</span>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Upload Foto</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <span className="text-xs font-bold text-white uppercase tracking-widest">Ubah</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              
              <div className="w-full max-w-lg">
                <FieldWrapper id="bio" label="Bio Singkat">
                  <textarea 
                    className="w-full min-h-[120px] rounded-2xl border border-border-soft bg-surface-dark p-6 text-lg font-medium text-foreground outline-none focus:border-accent/50 shadow-premium"
                    placeholder="Apa yang ingin Anda bagikan kepada dunia?"
                    value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                  />
                </FieldWrapper>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mt-8"><StatusMessage tone="error">{error}</StatusMessage></div>}
      </div>

      {/* Onboarding Footer - Fixed Navigation */}
      <footer className="mt-20 pt-12 border-t border-border-soft flex flex-col gap-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Langkah {step} dari {totalSteps}</span>
            </div>
            <div className="flex gap-4">
               {step > 1 && (
                 <button onClick={prevStep} className="px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-surface-dark transition-all">Kembali</button>
               )}
               {step < totalSteps ? (
                 <button 
                  onClick={nextStep} 
                  disabled={step === 1 && (!form.firstName || !form.username)}
                  className="px-10 py-4 bg-foreground text-background rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-premium hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                 >
                   Lanjut
                 </button>
               ) : (
                 <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="px-10 py-4 bg-accent text-white rounded-full font-bold text-xs uppercase tracking-[0.2em] shadow-premium hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                 >
                   {isSubmitting && <Spinner />}
                   Selesaikan
                 </button>
               )}
            </div>
         </div>
         {/* Progress Bar */}
         <div className="h-1 w-full bg-surface-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-700 ease-in-out" 
              style={{ width: `${progress}%` }} 
            />
         </div>
      </footer>
    </div>
  );
}
