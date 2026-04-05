'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    info: 'bg-surface-dark',
    success: 'bg-success/10',
    error: 'bg-danger/10',
    warning: 'bg-yellow-500/10',
  }[type];

  const textColor = {
    info: 'text-foreground',
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-yellow-600',
  }[type];

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div
        className={`${bgColor} border border-border-soft rounded-2xl px-6 py-3 shadow-premium glass-strong backdrop-blur-xl`}
      >
        <p className={`text-[14px] font-medium ${textColor}`}>{message}</p>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const showToast = (
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info'
  ) => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null;

  return { showToast, ToastComponent };
}
