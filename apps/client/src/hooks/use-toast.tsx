'use client';

import { useState, useCallback } from 'react';

interface ToastOptions {
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ToastOptions>({
    message: '',
    variant: 'info',
    duration: 3000,
  });

  const showToast = useCallback((opts: ToastOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'success', duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'error', duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'warning', duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'info', duration });
  }, [showToast]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    showToast,
    success,
    error,
    warning,
    info,
    isOpen,
    options,
    handleClose,
  };
}
