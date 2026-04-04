import type { InputHTMLAttributes, ReactNode } from "react";

type FieldWrapperProps = {
  children: ReactNode;
  error?: string;
  hint?: string;
  id: string;
  label: string;
  required?: boolean;
};

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

type InlineActionButtonProps = {
  children: ReactNode;
  onClick: () => void;
};

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" 
        fill="currentColor" 
        className="opacity-20"
      />
      <path 
        d="M12 2L4.5 20.29L12 17L19.5 20.29L12 2Z" 
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" className="text-accent" />
    </svg>
  );
}

export function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function FieldWrapper({
  children,
  error,
  hint,
  id,
  label,
  required,
}: FieldWrapperProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="group space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <label htmlFor={id} className="text-[10px] font-bold tracking-[0.15em] text-muted uppercase">
          {label}
          {required ? <span className="ml-1 text-accent">*</span> : null}
        </label>
      </div>
      <div className="relative" aria-describedby={describedBy}>
        {children}
      </div>
      <div className="min-h-5 px-0.5">
        {error ? (
          <p id={`${id}-error`} className="text-[11px] font-semibold text-danger animate-reveal">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-[11px] font-medium leading-relaxed text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AuthInput({ className = "", error, ...props }: AuthInputProps) {
  return (
    <input
      {...props}
      aria-invalid={Boolean(error)}
      className={`h-12 w-full rounded-xl border bg-surface-dark px-4 text-[14px] font-medium text-foreground transition-all duration-300 outline-none placeholder:text-muted/40 focus:bg-background focus:ring-4 focus:ring-accent/5 hover:border-border-soft/60 ${
        error
          ? "border-danger/50 focus:border-danger focus:ring-danger/5"
          : "border-border-soft focus:border-accent/50"
      } ${className}`}
    />
  );
}

export function InlineActionButton({
  children,
  onClick,
}: InlineActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-[11px] font-bold tracking-wider text-muted uppercase transition-colors hover:text-foreground focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

export function FormCard({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border-soft glass-strong p-8 sm:p-12 shadow-premium hover:shadow-hover transition-all duration-700">
        <div className="relative z-10">{children}</div>
      </div>

      {footer ? (
        <div className="flex justify-center rounded-2xl border border-border-soft glass p-6 transition-all duration-300">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function StatusMessage({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "error" | "success";
}) {
  const styles = {
    error: "border-danger/10 bg-danger/[0.03] text-danger",
    success: "border-success/10 bg-success/[0.03] text-success",
    neutral: "border-border-soft bg-surface-dark text-muted",
  };

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-[13px] leading-relaxed transition-all animate-reveal ${styles[tone]}`}
    >
      <div className="mt-0.5 shrink-0">
        {tone === "error" && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {tone === "success" && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {tone === "neutral" && (
          <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="font-semibold">{children}</div>
    </div>
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="h-px flex-1 bg-border-soft" />
      <span className="text-[10px] font-bold tracking-[0.2em] text-muted/60 uppercase whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-border-soft" />
    </div>
  );
}

export function SocialButton({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="group relative flex h-12 flex-1 items-center justify-center gap-3 rounded-xl border border-border-soft bg-surface px-4 text-[13px] font-bold text-foreground shadow-premium transition-all duration-300 hover:border-accent/30 hover:bg-background hover:shadow-hover active:scale-[0.98]"
    >
      <span className="text-muted transition-colors group-hover:text-foreground">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M21.8 12.23c0-.77-.07-1.5-.2-2.2H12v4.16h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.6Z" />
      <path d="M12 22c2.76 0 5.08-.91 6.77-2.46l-3.3-2.56c-.92.62-2.1.98-3.47.98-2.67 0-4.93-1.8-5.74-4.22H2.85v2.63A10 10 0 0 0 12 22Z" />
      <path d="M6.26 13.74A5.98 5.98 0 0 1 5.94 12c0-.6.1-1.18.32-1.74V7.63H2.85a10 10 0 0 0 0 8.74l3.41-2.63Z" />
      <path d="M12 5.96c1.5 0 2.85.51 3.91 1.52l2.93-2.93C17.07 2.91 14.76 2 12 2a10 10 0 0 0-9.15 5.63l3.41 2.63c.8-2.43 3.07-4.3 5.74-4.3Z" />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M15.2 2.5c0 1.1-.44 2.18-1.18 2.96-.8.83-1.98 1.42-3.1 1.33-.14-1.04.38-2.14 1.12-2.9.78-.8 2.08-1.38 3.16-1.39ZM18.54 18.72c-.6.88-.88 1.28-1.65 2.06-1.08 1.08-2.6 2.43-4.48 2.45-1.67.02-2.1-1.08-4.36-1.06-2.26.01-2.73 1.08-4.4 1.06-1.87-.02-3.3-1.23-4.39-2.31C-2.44 16.32-.55 8.83 2.58 6.9c1.49-.92 3.84-1.47 5.91-.65.98.39 1.9 1.06 3.07 1.06 1.13 0 1.82-.72 3.22-1.08 1.68-.43 3.73-.24 5.11.58-4.46 2.67-3.74 9.07.65 11.91Z" />
    </svg>
  );
}
